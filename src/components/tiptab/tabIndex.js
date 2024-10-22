import { Extension } from "@tiptap/core";
// import { Node } from "prosemirror-model";
import { TextSelection, AllSelection } from "prosemirror-state";

export function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}

export const TapIndexProps = {
  min: -1,
  max: 30,
  more: 1,
  less: -1,
};

export function isBulletListNode(node) {
  return node.type.name === "bulletList";
}

export function isOrderedListNode(node) {
  return node.type.name === "orderedList";
}

export function isTodoListNode(node) {
  return node.type.name === "listItem";
}

export function isListNode(node) {
  return isBulletListNode(node) || isOrderedListNode(node) || isTodoListNode(node);
}

function setNodeTapIndexMarkup(tr, pos, delta) {
  if (!tr.doc) return tr;

  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;

  const minTapIndex = TapIndexProps.min;
  const maxTapIndex = TapIndexProps.max;

  const tapIndex = clamp((node.attrs.tapIndex || 0) + delta, minTapIndex, maxTapIndex);

  if (tapIndex === node.attrs.tapIndex) return tr;

  const nodeAttrs = {
    ...node.attrs,
    tapIndex,
  };

  return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
}

function updateTapIndexLevel(tr, delta) {
  const { doc, selection } = tr;

  if (!doc || !selection) return tr;

  if (!(selection instanceof TextSelection || selection instanceof AllSelection)) {
    return tr;
  }

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;

    if (nodeType.name === "paragraph" || nodeType.name === "heading") {
      tr = setNodeTapIndexMarkup(tr, pos, delta);
      console.log(node,"tapIndex update!!!!!")
      return false;
    }
    if (isListNode(node)) {
      return false;
    }
    return true;
  });

  return tr;
}

export const tabIndex = Extension.create({
  name: "tabIndex",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      tabIndexLevel: [-1, 0, 1, 2, 3, 4, 5, 5],
      defaultTabIndexLevel: 0,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          tabIndex: {
            default: this.options.defaultTabIndexLevel,
            renderHTML: (attributes) => {
              return {
                attr: `tabindex= ${attributes.tapIndex}px !important`,
              };
            },
            parseHTML: (element) => {
              return parseInt(element.setAttribute('tabindex')) || this.options.defaultTabIndexLevel;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      tapIndex:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          tr = updateTapIndexLevel(tr, TapIndexProps.more);

          if (tr.docChanged) {
            dispatch && dispatch(tr);
            return true;
          }

          return false;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          tr = updateTapIndexLevel(tr, TapIndexProps.less);

          if (tr.docChanged) {
            dispatch && dispatch(tr);
            return true;
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.tapIndex(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});

// tabindex 넣는부분 추가하기.

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

export const IndentProps = {
  min: 0,
  max: 210,
  more: 30,
  less: -30,
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

function setNodeIndentMarkup(tr, pos, delta) {
  if (!tr.doc) return tr;

  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;

  const minIndent = IndentProps.min;
  const maxIndent = IndentProps.max;

  const indent = clamp((node.attrs.indent || 0) + delta, minIndent, maxIndent);

  if (indent === node.attrs.indent) return tr;

  const nodeAttrs = {
    ...node.attrs,
    indent,
  };

  return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
}

function updateTapIndextLevel(tr, delta) {
  const { doc, selection } = tr;

  if (!doc || !selection) return tr;

  if (!(selection instanceof TextSelection || selection instanceof AllSelection)) {
    return tr;
  }

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;

    if (nodeType.name === "paragraph" || nodeType.name === "heading") {
      tr = setNodeIndentMarkup(tr, pos, delta);
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
                style: `margin-left: ${attributes.indent}px !important`,
              };
            },
            parseHTML: (element) => {
              return parseInt(element.style.marginLeft) || this.options.defaultTabIndexLevel;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          tr = updateTapIndextLevel(tr, IndentProps.more);

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
          tr = updateTapIndextLevel(tr, IndentProps.less);

          if (tr.docChanged) {
            dispatch && dispatch(tr);
            return true;
          }

          return false;
        },
    };
  },

  // addKeyboardShortcuts() {
  //   return {
  //     Tab: () => this.editor.commands.indent(),
  //     "Shift-Tab": () => this.editor.commands.outdent(),
  //   };
  // },
});

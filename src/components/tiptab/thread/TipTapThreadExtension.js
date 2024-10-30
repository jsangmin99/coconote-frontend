import { Node } from '@tiptap/core';
// import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
// import UniqueID from '@tiptap-pro/extension-unique-id'; // UniqueID 확장 임포트
import TipTapThreadComponent from './TipTapThreadComponent.vue';
import { Plugin } from "prosemirror-state";

export default Node.create({
  name: 'tiptapthreadComponent',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null, // 기본값 null
      },
      content: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.tiptap-thread',
        getAttrs: (element) => {
          const content = element.querySelector('span.text')?.innerHTML || '';
          return {
            id: element.getAttribute('data-id') || null, // 기존 id를 찾고, 없으면 null로 설정
            content,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // ID와 콘텐츠를 사용하여 HTML 문자열을 구성
    const elementString = `
      <div class="tiptap-thread" data-id="${HTMLAttributes.id}">
        <label>쓰레드</label>
        <span class="content">
          <span class="text">${HTMLAttributes.content}</span>
          <button>${HTMLAttributes.id}로 이동하기</button>
        </span>
      </div>
    `;

    // HTML 문자열을 DOM으로 변환하여 반환
    const wrapper = document.createElement('div');
    wrapper.innerHTML = elementString;

    return wrapper.firstChild; // 생성된 DOM 요소를 반환
  },

  addOptions() {
    return {
      onNodeChange: (options) => {
        const node = options?.nodes[0];
        const event = new CustomEvent("nodeChange", { detail: node });
        window.dispatchEvent(event);
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TipTapThreadComponent);
  },

  addProseMirrorPlugins() {
    const onNodeChange = this.options.onNodeChange;

    return [
      new Plugin({
        view: () => {
          return {
            update: (view, prevState) => {
              if (view.state.doc !== prevState.doc) {
                const { from, to } = view.state.selection;
                const nodes = [];
                view.state.doc.nodesBetween(from, to, (node, pos) => {
                  nodes.push({ node, pos });
                });

                // `onNodeChange` 호출
                onNodeChange({ nodes, editor: this.editor });
              }
            },
          };
        },
      }),
    ];
  },
});
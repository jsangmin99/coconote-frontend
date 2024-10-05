<template>
  <div v-if="editor" class="container">
    <!-- <div class="control-group">
      <div class="button-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
        >
          Bold
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
        >
          Italic
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
        >
          Strike
        </button>
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :disabled="!editor.can().chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
        >
          Code
        </button>
        <button @click="editor.chain().focus().unsetAllMarks().run()">
          Clear marks
        </button>
        <button @click="editor.chain().focus().clearNodes().run()">
          Clear nodes
        </button>
        <button
          @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }"
        >
          Paragraph
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        >
          H1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        >
          H3
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }"
        >
          H4
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 5 }) }"
        >
          H5
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 6 }) }"
        >
          H6
        </button>
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
        >
          Bullet list
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
        >
          Ordered list
        </button>
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
        >
          Code block
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
        >
          Blockquote
        </button>
        <button @click="editor.chain().focus().setHorizontalRule().run()">
          Horizontal rule
        </button>
        <button @click="editor.chain().focus().setHardBreak().run()">
          Hard break
        </button>
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().chain().focus().undo().run()"
        >
          Undo
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().chain().focus().redo().run()"
        >
          Redo
        </button>
        <button
          @click="editor.chain().focus().setColor('#958DF1').run()"
          :class="{
            'is-active': editor.isActive('textStyle', { color: '#958DF1' }),
          }"
        >
          Purple
        </button>
      </div>
    </div> -->
    <div id="editorArea">
      <editor-content :editor="editor" />
    </div>
    <div style="width: 100%; margin-top: 30px">
      <pre style="white-space: break-spaces">{{ localHTML }}</pre>
    </div>
    <div style="width: 100%; margin-top: 30px">
      <pre style="white-space: break-spaces">{{ localJSON }}</pre>
    </div>
  </div>
</template>

<script>
import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";
import CustomBlock from "@/components/tiptab/CustomBlock"; // CustomBlock 가져오기

import UniqueID from "@tiptap-pro/extension-unique-id";
import DragHandle from "@tiptap-pro/extension-drag-handle";
import NodeRange from "@tiptap-pro/extension-node-range";
// import { isChangeOrigin } from "@tiptap/extension-collaboration";
// import DraggableItem from '@/components/tiptab/DraggableItem'
import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    EditorContent,
  },
  props: {
    initialContent: {
      type: Object,
      required: true, // 부모로부터 받아야 하는 값
    },
    parentUpdateEditorContent: {
      type: Object,
      required: false,
    },
  },
  computed: {
    ...mapGetters([
      "getBlockFeIdIndex",
      "getTargetBlockPrevFeId",
      "getTargetBlockPrevFeIdIndex",
    ]),
  },

  data() {
    return {
      editor: null,
      localJSON: "",
      localHTML: "",
      defaultContent: this.initialContent, // 부모로부터 받은 데이터를 초기값으로 설정
      updateEditorContent: this.parentUpdateEditorContent,

      recentKeyboardKey: null,
    };
  },
  watch: {
    // 부모에서 전달받은 content 값이 변경될 때 실행할 함수
    parentUpdateEditorContent(newVal) {
      this.onContentChanged(newVal);
    },
  },
  mounted() {
    console.log(">>>>>>>>PPP", this.defaultContent);
    window.addEventListener("keydown", this.onKeydown); // 키보드 입력 이벤트 감지
    this.editor = new Editor({
      extensions: [
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        TextStyle.configure({ types: [ListItem.name] }),
        StarterKit,
        CustomBlock,
        // DraggableItem
        UniqueID.configure({
          types: [
            "heading",
            "paragraph",
            "orderedList",
            "bulletList",
            "listItem",
          ],
          // filterTransaction: (transaction) => !isChangeOrigin(transaction),
        }),
        NodeRange.configure({
          // allow to select only on depth 0
          // depth: 0,
          key: null,
        }),
        DragHandle.configure({
          render() {
            const element = document.createElement("div");

            element.classList.add("custom-drag-handle");

            return element;
          },
        }),
      ],
      onUpdate: () => {
        this.localHTML = this.editor.getHTML();
        this.localJSON = this.editor.getJSON();
      },
      content: this.defaultContent,
    });

    this.editor.on("create", ({ editor }) => {
      // The editor is ready.
      console.log(`create`, editor);
      this.localHTML = editor.getHTML();
      this.localJSON = editor.getJSON();
    });

    this.editor.on("selectionUpdate", ({ editor }) => {
      // The selection has changed.
      // console.log(
      //   `selectionUpdate`,
      //   editor.view?.trackWrites?.data,
      //   editor.view?.trackWrites?.parentElement?.dataset?.id,
      //   editor.view?.trackWrites?.dataset?.id,
      //   this.recentKeyboardKey,
      //   editor
      // );

      const selectedNode = editor.state.selection;
      let isReturn = true;

      if (!selectedNode) {
        return false;
      }

      const updateBlockID = selectedNode?.$head?.path[3]?.attrs?.id;
      if (!updateBlockID) {
        return false;
      }
      const updateContent =
        selectedNode?.$head?.path[3]?.content?.content[0]?.text;

      console.log(
        "⭐ Node:",
        updateBlockID,
        updateContent,
        this.recentKeyboardKey,
        editor.view?.trackWrites?.dataset?.id,
        updateContent == "",
        editor.view?.trackWrites?.data,
        updateContent == undefined
      );
      if (this.localJSON.content != "") {
        this.localJSON = this.editor.getJSON();
      }

      // 삭제 확인 : keyCode 감지하려면 우선순위때문에 삭제한 id가 안나옴..
      const originTargetBlockId = editor.view?.trackWrites?.dataset?.id;
      const originTargetBlockContents = editor.view?.trackWrites?.data;
      console.error(
        originTargetBlockId,
        originTargetBlockContents,
        updateBlockID
      );
      if (
        originTargetBlockContents == undefined &&
        originTargetBlockId != undefined
      ) {
        // 내용이 undefined 이고, updateTarget이랑 originTarget이랑 다를 때감지 (삭제 확인용 감지)
        const result = this.localJSON.content.find(
          (item) => item.attrs && item.attrs.id === originTargetBlockId
        );
        console.log("result >>>>>>", result);
        if (result == undefined) {
          console.error("삭제다!!!");
          this.$parent.deleteBlock(originTargetBlockId);
          isReturn = false;
        } else {
          // 삭제 target block 말고 이전 block 함께 체크
          const prevBlockId = this.getTargetBlockPrevFeId(originTargetBlockId);
          const prevResult = this.localJSON.content.find(
            (item) => item.attrs && item.attrs.id === prevBlockId
          );
          if (prevResult == undefined) {
            this.$parent.deleteBlock(prevBlockId);
            isReturn = false;
          }
        }
      }

      // 삭제 method를 보내지 않았다면
      if (!isReturn) {
        return false;
      }
      // element 위치 감지
      const searchElAndPrevEl = this.findPreviousId(
        this.localJSON.content,
        updateBlockID
      );

      const previousId = searchElAndPrevEl[0];
      const targetElType = searchElAndPrevEl[1];

      // console.error("➡️prev➡️➡️", previousId);
      const parentId = null;

      // 여기서 감지해서 보내기
      this.$parent.updateBlock(
        updateBlockID,
        targetElType,
        updateContent == "" ? "" : updateContent,
        previousId,
        parentId
      );
    });

  },
  methods: {
    ...mapActions(["pushBlockFeIdsActions", "deleteBlockTargetFeIdActions"]),
    findPreviousId(obj, targetId) {
      return this.recursiveSearch(obj, targetId);
    },
    recursiveSearch(items, targetId, previousId = null) {
      if (!items || !Array.isArray(items)) return null;

      for (const item of items) {
        // 현재 객체가 targetId인 경우, previousId를 반환
        if (item.attrs && item.attrs.id === targetId) {
          const returnArr = [previousId, item.type];
          return returnArr;
        }

        // 현재 객체에 id가 있다면 그 값을 이전 id로 저장
        if (item.attrs && item.attrs.id) {
          previousId = item.attrs.id;
        }

        // 하위 content가 있으면 재귀적으로 검색
        if (item.content && Array.isArray(item.content)) {
          const found = this.recursiveSearch(
            item.content,
            targetId,
            previousId
          );
          if (found) {
            return found; // 값을 찾았으면 반환
          }
        }
      }

      return null; // 찾지 못했을 때
    },
    onContentChanged(newContent) {
      console.log(
        "부모 컴포넌트로부터 새로운 content를 받았습니다:",
        newContent
      );
      console.log(this.editor);

      let targetElement = document.querySelector(
        `#editorArea [data-id="${newContent.feId}"]`
      );

      if (newContent.method == "delete") {
        // 삭제한 경우
        if (targetElement) {
          // ⭐ 자식 생각 필요
          targetElement.remove();
        }
      } else {
        // 생성이나, 현재 targetElement가 없는 update의 경우
        if (targetElement) {
          // 이미 있는 내용 변경
          // 해당 요소의 텍스트를 변경
          targetElement.textContent = newContent.contents;
        } else {
          const typeEl = {
            heading: "h",
            paragraph: "p",
            orderedList: "ol",
            bulletList: "ul",
            listItem: "li",
          };

          let elTagType = typeEl[newContent.type];
          if (elTagType === "h") {
            elTagType += "1";
          }

          let newElement = document.createElement(elTagType);
          newElement.setAttribute("data-id", newContent.feId);
          newElement.textContent = newContent.contents;

          if (newContent.prevBlockId != null) {
            let prevElement = document.querySelector(
              `#editorArea [data-id="${newContent.prevBlockId}"]`
            );
            prevElement.insertAdjacentElement("afterend", newElement);
            return false;
          } else if (newContent.parentBlockId != null) {
            let parentElement = document.querySelector(
              `#editorArea [data-id="${newContent.parentBlockId}"]`
            );
            parentElement.appendChild(newElement);
            return false;
          }
        }
        return false;
      }

    },
    onKeydown(event) {
      this.recentKeyboardKey = event.keyCode; // 누른 키 값을 저장
      console.log("key event!! >> ", this.recentKeyboardKey);
      // 8 : 백스페이스
    },
  },
  beforeUnmount() {
    // 컴포넌트 제거 시 이벤트 리스너 제거
    window.removeEventListener("keydown", this.onKeydown);
    this.editor.destroy();
  },
};
</script>

<style lang="scss">
/* Basic editor styles */
.tiptap {
  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: var(--purple-light);
    border-radius: 0.4rem;
    color: var(--black);
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: var(--black);
    border-radius: 0.5rem;
    color: var(--white);
    font-family: "JetBrainsMono", monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;

    code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }
  }

  blockquote {
    border-left: 3px solid var(--gray-3);
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid var(--gray-2);
    margin: 2rem 0;
  }
}

::selection {
  background-color: #70cff850;
}

.ProseMirror {
  padding: 1rem 1rem 1rem 0;

  * {
    margin-top: 0.75em;
  }

  > * {
    margin-left: 1rem;
  }

  .ProseMirror-widget * {
    margin-top: auto;
  }

  ul,
  ol {
    padding: 0 1rem;
  }
}

.ProseMirror-noderangeselection {
  *::selection {
    background: transparent;
  }

  * {
    caret-color: transparent;
  }
}

.ProseMirror-selectednode,
.ProseMirror-selectednoderange {
  position: relative;

  &::before {
    position: absolute;
    pointer-events: none;
    z-index: -1;
    content: "";
    top: -0.25rem;
    left: -0.25rem;
    right: -0.25rem;
    bottom: -0.25rem;
    background-color: #70cff850;
    border-radius: 0.2rem;
  }
}

.custom-drag-handle {
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1.25rem;
    content: "⠿";
    font-weight: 700;
    cursor: grab;
    background: #0d0d0d10;
    color: #0d0d0d50;
    border-radius: 0.25rem;
  }
}
</style>

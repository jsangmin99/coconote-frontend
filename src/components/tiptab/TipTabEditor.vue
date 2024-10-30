<template>
  <div v-if="editor" class="container tiptapWrap">
    <div class="control-group">
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
        <!-- 이미지 업로드 버튼 -->
        <button @click="triggerFileInput">image</button>
      </div>
    </div>
    <input type="file" ref="fileInput" @change="handleImageUpload" hidden />

    <div id="editorArea">
      <div class="placeholder editorPlaceholder" id="editorPlaceholder">
        내용을 입력하세요.
      </div>
      <editor-content :editor="editor" />
    </div>
    <div style="width: 100%; margin-top: 30px">
      <pre style="white-space: break-spaces">{{ localHTML }}</pre>
    </div>
    <div style="width: 100%; margin-top: 30px">
      <pre style="white-space: break-spaces">{{ localJSON }}</pre>
    </div>
    <div
      class="tcd-drop-area"
      v-if="tcdDroppedData"
      @dragover.prevent
      @drop="handleDrop"
    >
      이 곳에 data를 drop 하세요
    </div>
  </div>
</template>

<script>
import axios from "axios";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";

import UniqueID from "@tiptap-pro/extension-unique-id";
import DragHandle from "@tiptap-pro/extension-drag-handle";
import NodeRange from "@tiptap-pro/extension-node-range";
// import { isChangeOrigin } from "@tiptap/extension-collaboration";
import DraggableItem from "@/components/tiptab/DraggableItem";
import Image from "@tiptap/extension-image"; // 이미지 추가용
// import { NodePos } from '@tiptap/core';

// import Placeholder from "@tiptap/extension-placeholder";
import Focus from "@tiptap/extension-focus";

// 코드 내 들여쓰기 용
import { Indent } from "@/components/tiptab/indent";

// Thread drag&drop 용
import TipTapThread from "@/components/tiptab/thread/TipTapThreadExtension.js";
// import CustomLink from '@/components/tiptab/thread/CustomLink.js'
import Link from "@tiptap/extension-link";

import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    EditorContent,
  },
  props: {
    initialContent: {
      type: Array,
      required: true, // 부모로부터 받아야 하는 값
    },
    parentUpdateEditorContent: {
      type: Object,
      required: false,
    },
  },
  computed: {
    ...mapGetters([
      "getAllBlockFeIds",
      "getBlockFeIdIndex",
      "getTargetBlockPrevFeId",
      "getTargetBlockPrevFeIdIndex",

      // tcd용
      "getAllTcdState",
    ]),
  },

  data() {
    return {
      editor: null,
      localJSON: "",
      localHTML: "",
      defaultContent: this.initialContent, // 부모로부터 받은 데이터를 초기값으로 설정
      updateEditorContent: this.parentUpdateEditorContent,

      dragCheckEditorJson: null,

      dragCheckSelectionNode: null,
      tempDragCheckSelectionNode: null,

      // 처음로딩 + 내용없음
      isFirstAndNullContent: false,

      isRecvUpdate: false, // socket 메시지인지 아닌지 확인 용

      // image 업로드 용
      fileList: [], // 업로드할 파일 리스트
      tempFilesRes: null, // 서버에 저장된 파일 메타데이터 응답

      // 삭제체크용
      nodeLength: null,

      // router용 쿼리파라미터
      routeQueryBlockFeId: null,

      // 마지막으로 보냈던 obj..
      lastSendMsgObj: {
        blockFeId: null,
        blockIndent: null,
      },

      // 현재 보내는 이벤트 구분용
      currentEvent: null,

      // drag 용
      tcdDroppedData: null,
    };
  },
  watch: {
    parentUpdateEditorContent: {
      // 부모에서 전달받은 content 값이 변경될 때 실행할 함수
      handler(newVal) {
        console.error("부모에게 전달받은 값 보는 중.", newVal);
        this.onContentChanged(newVal);
      },
      deep: true, // 객체 내부의 변경사항도 감지
    },
    getAllTcdState: {
      handler(newVal) {
        // console.error("tcd 값 감지. canvas >>>> ", newVal);
        if (newVal.isDragStatus) {
          this.tcdDroppedData = newVal; // 드래그 데이터 저장
        } else {
          this.tcdDroppedData = null;
        }
      },
      deep: true,
    },
  },
  created() {},
  mounted() {
    this.editor = new Editor({
      extensions: [
        Image.configure({
          HTMLAttributes: {
            class: "my-image",
          },
        }),
        StarterKit.configure({
          bulletList: true, // ol, ul, li 형식 허용 X
          orderedList: true,
          listItem: true,
        }),
        TipTapThread.configure({
          onNodeChange: async (options) => {
            this.isRecvUpdate = false;

            const node = options?.nodes[0];
            const nodeDataId = node?.node?.attrs?.id;
            console.error("tiptapThread >>> ", options, nodeDataId, )
          },
        }),
        
        Link.configure({
          openOnClick: true,
          HTMLAttributes: {
            class: 'tiptap-link',
            'data-thread-id': null, // 초기값은 null
          },
        }),
        // CustomLink,
        DraggableItem,
        UniqueID.configure({
          types: [
            "heading",
            "paragraph",
            "image",
            "bulletList",
            "orderedList",
            "listItem",
          ],
        }),
        NodeRange.configure({
          key: null,
        }),
        DragHandle.configure({
          render: () => {
            const element = document.createElement("div");
            element.classList.add("custom-drag-handle");

            // 드래그 시작 시
            element.addEventListener("dragstart", (event) => {
              console.log("dragstart :: ", event);
              this.dragCheckSelectionNode = this.tempDragCheckSelectionNode;
              console.log("현 선택자 :: ", this.dragCheckSelectionNode);
              this.dragCheckEditorJson = this.selectedNodePrevAndNext(
                this.editor.getJSON().content,
                this.dragCheckSelectionNode?.attrs?.id
              );
              console.log(
                "현 선택자에 대한 이전 이후 값 >> ",
                this.dragCheckEditorJson
              );
            });

            // 드래그가 끝날 때
            element.addEventListener("dragend", (e) => {
              console.log("Drag ended :: ", e);
              // 드래그가 끝나면 상태를 초기화하는 로직 추가 가능
              const recentSelectorJson = this.selectedNodePrevAndNext(
                this.editor.getJSON().content,
                this.dragCheckSelectionNode?.attrs?.id
              );

              console.log("종료 후 이전 이후 값 >> >> ", recentSelectorJson);

              this.$parent.changeOrderBlock(recentSelectorJson);
              this.dragCheckEditorJson = null;
              this.dragCheckSelectionNode = null;
            });

            return element;
          },
          onNodeChange: ({ node }) => {
            if (this.dragCheckSelectionNode != null) {
              return false;
            }
            if (!node) {
              this.tempDragCheckSelectionNode = null;
              return;
            }
            this.tempDragCheckSelectionNode = node;
            // Do something with the node
          },
        }),
        Indent.configure({}),
        // Placeholder.configure({
        //   placeholder: "내용을 작성하세요.",
        //   // Use different placeholders depending on the node type:
        //   // placeholder: ({ node }) => {
        //   //   if (node.type.name === 'heading') {
        //   //     return 'What’s the title?'
        //   //   }

        //   //   return 'Can you add some further context?'
        //   // },
        // }),
        Focus.configure({
          className: "has-focus",
          mode: "all",
        }),
      ],
      // autofocus: true,
      onUpdate: () => {
        if (this.isRecvUpdate) {
          this.isRecvUpdate = false;
          return false;
        }
        if (this.currentEvent != null) {
          this.currentEvent = null;
          return false;
        }
        const selectedNode = this.editor.state.selection;
        let isReturn = true;

        if (!selectedNode) {
          return false;
        }

        // 삭제 check용
        if (this.dragCheckSelectionNode == null) {
          //drag 중이 아닐 때 가능
          const updateAfterNodes = selectedNode.$anchor.path[0].content.content;
          console.log(
            "ㅠㅠㅠㅠㅠㅠㅠㅠㅠ",
            this.nodeLength,
            updateAfterNodes.length
          );
          if (this.nodeLength > updateAfterNodes.length) {
            // 개수가 생성 때 보다 적어졌을 때
            const originAllFeIds = this.getAllBlockFeIds;
            const updateAllFeIds = updateAfterNodes.map((el) => {
              return el.attrs.id;
            });

            // originAllFeIds에 있는데 updateAllFeIds에 없는 값 찾기
            const removedIds = originAllFeIds.filter(
              (id) => !updateAllFeIds.includes(id)
            );
            console.error("removedIds >> ", removedIds);
            if (removedIds.length > 0) {
              this.$parent.deleteBlock(removedIds[0]);
              if (updateAfterNodes == 0) {
                const plel = document.querySelector("#editorPlaceholder");
                if (plel) {
                  if (plel.classList.contains("hidden")) {
                    plel.classList.remove("hidden");
                  }
                }
              }
              return false;
            }
          }
        }

        console.error("😭😭😭😭",selectedNode, selectedNode?.node?.type, selectedNode?.node?.type?.name)
        
        let tempUpdateBId = null
        if(selectedNode?.node?.type?.name == "tiptapthreadComponent"){
          tempUpdateBId = selectedNode.node?.attrs?.id
        }else{
          tempUpdateBId = selectedNode?.$head?.path[3]?.attrs?.id;
        }
        const updateBlockID = tempUpdateBId;

        console.error("😭😭😭😭222",updateBlockID)

        if (!updateBlockID) {
          return false;
        }
        const updateBlockIndent = selectedNode?.$head?.path[3]?.attrs?.indent;

        const updateEl = document.querySelector(`[data-id="${updateBlockID}"]`);
        let updateElOuterHtml = "";
        if (updateEl) {
          // 요소 복제 (true는 자식 요소까지 모두 복제)
          const clonedElement = updateEl.cloneNode(true);

          // 복제된 요소에서 class 속성 제거
          clonedElement.removeAttribute("class");

          // 복제된 요소 안에서 <br class="ProseMirror-trailingBreak"> 태그 제거
          const trailingBreaks = clonedElement.querySelectorAll(
            "br.ProseMirror-trailingBreak"
          );
          trailingBreaks.forEach((br) => br.remove());

          // 수정된 outerHTML 가져오기
          updateElOuterHtml = clonedElement.outerHTML;

          // const tagNames = ["OL", "UL", "H1", "H2", "H3", "H4", "H5", "H6"];
          console.error("🍆🍆🍆", updateEl, updateEl.tagName.toUpperCase());
          console.error("🍆🍆", updateElOuterHtml);
          // const tagIncludeIndex = tagNames.indexOf(
          //   updateEl.tagName.toUpperCase()
          // );
          if (
            //update 한 element가 ol이나 ul 이라면, 기존에 생성된 p태그는 ul태그 안으로 들어감 (p 태그의 아이디 중복 발생)
            updateEl.tagName.toUpperCase() === "OL" || // () 추가
            updateEl.tagName.toUpperCase() === "UL"
          ) {
            console.error("🍆🍆🍆🍆🍆🍆 This element is an ol or ul tag.");
            const targetElement = updateEl.querySelector(
              `[data-id="${this.lastSendMsgObj.blockFeId}"]`
            );
            if (targetElement) {
              this.$parent.deepDeleteBlock(this.lastSendMsgObj.blockFeId); // 따라서 기존 p 태그 DB상에서 삭제함
            }
          } else if (
            updateEl.tagName.toUpperCase() === "P" ||
            updateEl.tagName.toUpperCase().startsWith("H")
          ) {
            console.error("👀👀👀", updateEl, updateEl.tagName.toUpperCase());
            // 바뀐게 p 태그라면, 이전 element 분기 타서 이전 것 삭제해줘야함
            if (this.lastSendMsgObj.blockContents) {
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = this.lastSendMsgObj.blockContents;

              // 첫 번째 자식을 가져옵니다.
              const prevUpdateElType = tempDiv.firstElementChild;
              if (
                prevUpdateElType.tagName.toUpperCase() === "OL" ||
                prevUpdateElType.tagName.toUpperCase() === "UL"
              ) {
                //이전에 update 한 element 가 ol이나 ul 이고 현재 update 된 태그가 p태그 라면
                const isInsideEl = prevUpdateElType.querySelector(
                  `[data-id="${updateBlockID}"]`
                );
                if (isInsideEl) {
                  // 현재 update 하는 p태그가 이전 update 부분에 포함되어 있다면
                  console.error(
                    "😭😭😭😭😭",
                    `현재 업데이트 하려는 ${updateBlockID}는 ${this.lastSendMsgObj.blockFeId}에 포함되어있다`
                  );

                  // prevUpdateElType 내 자식 요소들이 isInsideEl 값만 있는지 확인
                  const allPTags = prevUpdateElType.querySelectorAll("p");

                  if (allPTags.length === 1 && allPTags[0] === isInsideEl) {
                    console.log(
                      "✅ prevUpdateElType에는 isInsideEl 외에 다른 자식 요소가 없습니다.",
                      this.lastSendMsgObj.blockFeId
                    );
                    this.$parent.deepDeleteBlock(this.lastSendMsgObj.blockFeId); // ul 태그 deep 삭제 보내기
                    // p 태그 생성하기
                  } else {
                    console.log(
                      "❌ prevUpdateElType에는 isInsideEl 외에 다른 자식 요소가 있습니다."
                    );
                    // ul태그 [현재 상태값] update로 값 보내기
                    const nowListStatusHtml = document.querySelector(
                      `[data-id="${this.lastSendMsgObj.blockFeId}"]`
                    );
                    if (nowListStatusHtml) {
                      const nowListStatusHtmlOuter =
                        nowListStatusHtml.outerHTML;
                      this.$parent.patchBlock(
                        this.lastSendMsgObj.blockFeId,
                        nowListStatusHtmlOuter
                      );
                    }
                    // p 태그 생성하기
                  }
                  // 위 if에서 임시로 저장해서 다 끝나고 보내기 p태그 create. ⭐⭐⭐⭐⭐⭐⭐⭐
                  this.updateDataEditorAfterEvent(
                    updateBlockID,
                    updateElOuterHtml,
                    updateBlockIndent
                  );
                  // 이 값들은 다른 장소에서 update 보내주도록 함
                  return false;
                }
              } else if (
                // 이전 값이 h태그 이거나 p 태그이고
                (prevUpdateElType.tagName.toUpperCase().startsWith("H") ||
                  prevUpdateElType.tagName.toUpperCase() === "P") &&
                prevUpdateElType.tagName != updateEl.tagName // 이전 태그와 현재 태그가 다를 때
              ) {
                const prevChangeTagEl = document.querySelector(
                  `[data-id="${this.lastSendMsgObj.blockFeId}"]`
                );
                console.error("오나용...", prevChangeTagEl);
                if (!prevChangeTagEl) {
                  console.error("오나용...222222ㅠㅠ");
                  //이전값이 없으면, 다른 동기화 화면에서도 지우고 h태그 생성되도록 진행

                  this.$parent.deepDeleteBlock(this.lastSendMsgObj.blockFeId); // 이전 태그 deep 삭제 보내기

                  this.updateDataEditorAfterEvent(
                    updateBlockID,
                    updateElOuterHtml,
                    updateBlockIndent
                  );
                  // 이 값들은 다른 장소에서 update 보내주도록 함
                  return false;
                }
              }
            }
          }
        }

        if (
          this.lastSendMsgObj.updateElOuterHtml == updateElOuterHtml &&
          this.lastSendMsgObj.blockFeId == updateBlockID
        ) {
          return false;
        }

        console.log(
          "⭐ Node:",
          updateBlockID,
          updateElOuterHtml,
          this.editor.view?.trackWrites?.dataset?.id,
          this.editor.view?.trackWrites?.data,
          updateBlockIndent
        );

        if (this.localJSON.content == undefined) {
          this.isFirstAndNullContent = true;
          this.localJSON = this.editor.getJSON(); // 이 부분 때문에 첫 로딩 시 updateElOuterHtml 값 비교 시 무조건 같은 값
        }

        const filterEl = document.querySelector(`[data-id="${updateBlockID}"]`);
        if (filterEl) {
          const filterElOuterHtml = filterEl.outerHTML;
          if (
            !this.isFirstAndNullContent &&
            filterElOuterHtml == updateElOuterHtml
          ) {
            isReturn = false; // 값이 동일하다면 보내지 않음
          }
        }

        // 삭제 method를 보내지 않았다면
        if (!isReturn) {
          return false;
        }

        this.localHTML = this.editor.getHTML();
        this.localJSON = this.editor.getJSON();

        this.nodeLength = this.localJSON.content.length;

        // element 위치 감지
        const searchElAndPrevEl = this.selectedNodePrevAndNext(
          this.localJSON.content,
          updateBlockID
        );

        if (searchElAndPrevEl == undefined) {
          return false;
        }

        // const previousId = searchElAndPrevEl.prevBlockId;
        // const targetElType = searchElAndPrevEl.type;

        // console.error("➡️prev➡️➡️", previousId);

        const parentId = null;

        // 여기서 감지해서 보내기
        this.$parent.updateBlock(
          updateBlockID,
          searchElAndPrevEl.type,
          updateElOuterHtml,
          searchElAndPrevEl.prevBlockId,
          searchElAndPrevEl.nextBlockId,
          parentId,
          updateBlockIndent
        );

        this.lastSendMsgObj.blockFeId = updateBlockID;
        this.lastSendMsgObj.blockIndent = updateBlockIndent;
        this.lastSendMsgObj.blockContents = updateElOuterHtml;
      },
      content:
        this.defaultContent == "" ||
        this.defaultContent?.length <= 0 ||
        this.defaultContent == undefined
          ? ""
          : this.defaultContent.join(""),
    });

    this.editor.on("create", ({ editor }) => {
      // The editor is ready.
      this.nodeLength =
        editor.view.state.selection.$anchor.path[0].content.content.length;
      this.localHTML = editor.getHTML();
      this.localJSON = editor.getJSON();
      if (this.$route?.query?.blockFeId) {
        this.routeQueryBlockFeId = this.$route.query.blockFeId;
        this.focusBlockFromBlockFeId();
      }
    });

    // if (typeof window !== "undefined") {
    //   }
    window.addEventListener("indentExecuted", this.onIndentExecuted);
    window.addEventListener("outdentExecuted", this.onOutdentExecuted);

    console.error("this.defaultContent >>> ",this.defaultContent, this.defaultContent.join(""))

    if (this.defaultContent.length > 1) {
      setTimeout(() => {
        const plel = document.getElementById("editorPlaceholder");
        if (plel) {
          plel.classList.add("hidden");
        }
      }, 100);
    }
  },
  methods: {
    ...mapActions([
      "pushBlockFeIdsActions",
      "deleteBlockTargetFeIdActions",
      "appendBlockFeIdsAfterPrevActions",

      // tcd용
    ]),
    updateDataEditorAfterEvent(
      updateBlockID,
      updateElOuterHtml,
      updateBlockIndent
    ) {
      // editor onupdate 이벤트와 동일하게 복사해옴
      let isReturn = true;

      if (this.localJSON.content == undefined) {
        this.isFirstAndNullContent = true;
        this.localJSON = this.editor.getJSON(); // 이 부분 때문에 첫 로딩 시 updateElOuterHtml 값 비교 시 무조건 같은 값
      }

      const filterEl = document.querySelector("updateBlockID");
      if (filterEl) {
        const filterElOuterHtml = filterEl.outerHTML;
        if (
          !this.isFirstAndNullContent &&
          filterElOuterHtml == updateElOuterHtml
        ) {
          isReturn = false; // 값이 동일하다면 보내지 않음
        }
      }

      // 삭제 method를 보내지 않았다면
      if (!isReturn) {
        return false;
      }

      this.localHTML = this.editor.getHTML();
      this.localJSON = this.editor.getJSON();

      this.nodeLength = this.localJSON.content.length;

      // element 위치 감지
      const searchElAndPrevEl = this.selectedNodePrevAndNext(
        this.localJSON.content,
        updateBlockID
      );

      if (searchElAndPrevEl == undefined) {
        return false;
      }

      // const previousId = searchElAndPrevEl.prevBlockId;
      // const targetElType = searchElAndPrevEl.type;

      console.error("➡️➡️➡️➡️prev➡️➡️", searchElAndPrevEl);
      // alert(JSON.stringify(searchElAndPrevEl))

      const parentId = null;

      // 여기서 감지해서 보내기
      this.$parent.updateBlock(
        updateBlockID,
        searchElAndPrevEl.type,
        updateElOuterHtml,
        searchElAndPrevEl.prevBlockId,
        searchElAndPrevEl.nextBlockId,
        parentId,
        updateBlockIndent
      );

      this.lastSendMsgObj.blockFeId = updateBlockID;
      this.lastSendMsgObj.blockIndent = updateBlockIndent;
      this.lastSendMsgObj.blockContents = updateElOuterHtml;
    },
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
        // if (item.content && Array.isArray(item.content)) {
        //   const found = this.recursiveSearch(
        //     item.content,
        //     targetId,
        //     previousId
        //   );
        //   if (found) {
        //     return found; // 값을 찾았으면 반환
        //   }
        // }
      }

      return null; // 찾지 못했을 때
    },
    onContentChanged(newContent) {
      console.log(
        "부모 컴포넌트로부터 새로운 content를 받았습니다:",
        newContent
      );
      this.isRecvUpdate = newContent.isRecvMessage;

      this.localHTML = this.editor.getHTML();
      this.localJSON = this.editor.getJSON();

      let targetElements = document.querySelectorAll(
        `#editorArea [data-id="${newContent.blockFeId}"]`
      ); // 이거 querySelector라서 첫번째 하나만 갖고와서 문제

      if (
        newContent.method == "DELETE_BLOCK" ||
        newContent.method == "DEEP_DELETE_BLOCK"
      ) {
        console.error("삭제합니다. :: 부모 컴포넌트로부터 받은 값");
        // 삭제한 경우
        console.error("⭐⭐targetElements⭐⭐", targetElements);
        if (targetElements.length > 0) {
          // ⭐ 자식 생각 필요
          targetElements.forEach((element) => {
            // p -> ul 변경 시, p에도 하나, ul 내부 p 에도 동일 id가 발생하여 for로 진행
            console.error("실제 삭제 중");
            element.parentNode.removeChild(element); // 부모 노드에서 해당 element 삭제
            console.error("실제 삭제 완료");
          });
        }
        // defaultFeId 중 해당 아이디 삭제
        this.deleteBlockTargetFeIdActions(newContent.blockFeId).then(
          (isDeleteBlock) => {
            console.log("isDeleteBlock newContent.feId :: ", isDeleteBlock);
            console.error(
              "이전 nodeLength :: DELETE_BLOCK ::",
              this.nodeLength
            );
            this.nodeLength = this.localJSON.content.length;
            console.error(
              "이후 nodeLength :: DELETE_BLOCK ::",
              this.nodeLength
            );
            if (this.nodeLength <= 0) {
              const plel = document.querySelector("#editorPlaceholder");
              if (plel) {
                if (plel.classList.contains("hidden")) {
                  plel.classList.remove("hidden");
                }
              }
            }
          }
        );
      } else if (
        newContent.method == "UPDATE_INDENT_BLOCK" ||
        newContent.method == "HOT_UPDATE_CONTENTS_BLOCK"
      ) {
        console.error(
          "인덴트를 바꾸거나, 내용만 변경합니다. :: 부모 컴포넌트로부터 받은 값"
        );
        const changeNode = document.querySelector(
          `[data-id="${newContent.blockFeId}"]`
        );
        if (!changeNode) {
          return false;
        }

        if (newContent.method == "UPDATE_INDENT_BLOCK") {
          // 새로운 요소 생성
          const newElement = changeNode.cloneNode(true); // 기존 요소를 복사
          // margin-left 스타일만 새롭게 추가
          newElement.style.marginLeft = `${newContent.blockIndent}px`;
          // 기존 요소를 교체
          changeNode.parentNode.replaceChild(newElement, changeNode);
        } else if (newContent.method == "HOT_UPDATE_CONTENTS_BLOCK") {
          const newElement = document.createElement("div"); // 새로운 div 요소 생성
          newElement.innerHTML = newContent.blockContents; // HTML 문자열을 DOM 요소로 변환

          // 변환된 DOM 요소의 첫 번째 자식을 기존 노드와 교체
          changeNode.parentNode.replaceChild(
            newElement.firstElementChild,
            changeNode
          );
        }
      } else if (newContent.method == "CHANGE_ORDER_BLOCK") {
        console.error("순서변경합니다. :: 부모 컴포넌트로부터 받은 값");
        // 순서변경의 경우
        const changeNode = document.querySelector(
          `[data-id="${newContent.blockFeId}"]`
        );
        const targetDataId =
          newContent.prevBlockId == null
            ? newContent.nextBlockId
            : newContent.prevBlockId;
        const appendType =
          newContent.prevBlockId != null
            ? "prev"
            : newContent.nextBlockId != null
            ? "next"
            : null;

        console.log(
          "appendType >> ",
          appendType,
          newContent.prevBlockId,
          newContent.nextBlockId
        );
        const targetNode = document.querySelector(
          `[data-id="${targetDataId}"]`
        );
        // 이동 실행: changeNode가 targetNode 앞에 이동
        if (changeNode) {
          if (appendType == "prev") {
            // targetNode 뒤에 changeNode 추가
            console.log(`${targetDataId} [뒤에] 추가`);
            targetNode.insertAdjacentElement("afterend", changeNode);
          } else if (appendType == "next") {
            // targetNode 앞에 changeNode 추가
            console.log(`${targetDataId} [앞에] 추가`);
            targetNode.insertAdjacentElement("beforebegin", changeNode);
          } else {
            console.error("prev, next 모두 null. 첫줄 drag 이동한 상황");
          }
        }
      } else {
        // 생성이나, 현재 targetElement가 없는 update의 경우
        console.error(
          "생성이나, targetElement가 없는 update :: 부모 컴포넌트로부터 받은 값"
        );
        console.error("💻💻💻💻💻", newContent.blockContents);
        if (targetElements.length > 0) {
          console.error("💻💻💻💻💻💻 이미 있는 내용 변경", targetElements);
          // 이미 있는 내용 변경
          // 해당 요소의 html을 전체 변경

          // 부모가 따로 없는지 확인하고, 태그가 p>ul로 변경된것이 아닌지 확인 후 내용 변경

          targetElements[0].outerHTML = newContent.blockContents;
          console.error(
            "@@@ newContent.blockContents",
            targetElements[0].outerHTML,
            newContent.blockContents
          );
          const targetEl2 = document.querySelector(
            `#editorArea [data-id="${newContent.blockFeId}"]`
          );
          if (targetEl2.outerHTML != newContent.blockContents) {
            targetEl2.outerHTML = newContent.blockContents;
          }
        } else {
          console.error("💻💻💻💻💻💻 222", newContent.method);
          const newElement = newContent.blockContents;
          console.error(newElement);
          if (newContent.method == "CREATE_BLOCK") {
            // 생성인 경우 store 개수 늘리기
            this.appendBlockFeIdsAfterPrevActions(
              newContent.blockFeId,
              newContent.prevBlockId
            );
            this.nodeLength = this.localJSON.content.length;
          }

          if (newContent.prevBlockId != null) {
            let prevElement = document.querySelector(
              `#editorArea [data-id="${newContent.prevBlockId}"]`
            );
            prevElement.insertAdjacentHTML("afterend", newElement);
            return false;
          } else if (newContent.nextBlockId != null) {
            let nextElement = document.querySelector(
              `#editorArea [data-id="${newContent.nextBlockId}"]`
            );
            nextElement.insertAdjacentHTML("beforebegin", newElement);
            return false;
          } else if (newContent.parentBlockId != null) {
            let parentElement = document.querySelector(
              `#editorArea [data-id="${newContent.parentBlockId}"]`
            );
            parentElement.appendChild(newElement);
            return false;
          } else {
            // parent, prev null 이어서 insert
            let elementString = newElement;
            this.editor.commands.insertContent(elementString);
          }
        }
      }

      this.localHTML = this.editor.getHTML();
      this.localJSON = this.editor.getJSON();
    },

    // drag 시, 변경된 순서 갖고오는 메소드
    getIdOrder(json) {
      return json.map((item) => ({
        id: item.attrs.id,
        content: item.content,
      }));
    },

    // 두 JSON의 ID 순서를 비교하는 함수
    compareIdOrders(oldEditorJson, recentEditorJson) {
      let firstChangedId = null;

      // 두 번째 JSON의 id들이 첫 번째 JSON과 같은 순서에 있는지 비교
      for (let i = 0; i < oldEditorJson.length; i++) {
        if (recentEditorJson[i].id !== oldEditorJson[i].id) {
          // 변경된 ID와 콘텐츠를 찾기
          firstChangedId = {
            previousPosition: i,
            previousId: oldEditorJson[i].id,
            currentId: recentEditorJson[i].id,
            previousOfCurrentId: i > 0 ? recentEditorJson[i - 1].id : null, // 현재 ID의 앞에 있는 ID
            previousContent: oldEditorJson[i].content, // 이전 ID의 콘텐츠
            currentContent: recentEditorJson[i].content, // 현재 ID의 콘텐츠
          };
          break; // 첫 번째 변경된 ID를 찾으면 반복 종료
        }
      }

      return firstChangedId;
    },

    // 선택자의 앞 뒤 값 갖고오기
    selectedNodePrevAndNext(editorJson, targetId) {
      const idGroupObj = {
        prevBlockId: null,
        nextBlockId: null,
        feId: targetId,
        parentBlockId: null, // 부모블록. 사용X
        type: null,
      };
      for (let i = 0; i < editorJson.length; i++) {
        if (editorJson[i].attrs?.id == targetId) {
          idGroupObj.prevBlockId = i > 0 ? editorJson[i - 1].attrs.id : null;
          idGroupObj.nextBlockId =
            i < editorJson.length - 1 ? editorJson[i + 1].attrs.id : null;

          idGroupObj.contents = editorJson[i]?.content?.text;
          idGroupObj.type = editorJson[i]?.content?.type;
          break;
        }
      }
      return idGroupObj;
    },

    // S3 Presigned URL 생성 및 파일 업로드
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.fileList.push(file);

      // Presigned URL 요청
      try {
        const presignedUrls = await this.getPresignedURL(file.name);
        const s3Url = await this.uploadFileToS3(file, presignedUrls[file.name]);

        // 성공적으로 업로드된 파일의 URL에서 ? 이전 부분만 추출
        const uploadedUrl = this.extractS3Url(s3Url);

        // 업로드된 파일의 URL을 메타데이터로 저장
        await this.saveFileMetadata([uploadedUrl]);
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    },

    async getPresignedURL(fileName) {
      const reqFiles = [{ fileName }];
      const response = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/files/presigned-urls`,
        reqFiles
      );
      return response.data.result;
    },

    async uploadFileToS3(file, presignedUrl) {
      try {
        const config = {
          headers: {
            "Content-Type": file.type,
          },
        };
        await axios.put(presignedUrl, file, config);
        return presignedUrl;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }
    },

    extractS3Url(presignedUrl) {
      return presignedUrl.split("?")[0];
    },

    // 서버에 파일 메타데이터 저장
    async saveFileMetadata(uploadedFileUrls) {
      const metadataDto = {
        // mapGetters로 channelId 가져와야 될것 같은데....
        channelId: this.$store.getters.getChannelId,
        fileType: "CANVAS", // FileType Enum으로 'CANVAS' 지정
        fileSaveListDto: uploadedFileUrls.map((url, index) => ({
          fileName: this.fileList[index].name, // 파일 이름
          fileUrl: url, // S3 URL
        })),
      };
      const response = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/files/metadata`,
        metadataDto
      );

      this.tempFilesRes = response.data.result[0].fileUrl;
      // 에디터에 이미지 삽입
      this.insertImageToEditor(this.tempFilesRes);
    },

    // TipTap 에디터에 이미지 삽입
    insertImageToEditor(imageUrl) {
      if (this.editor) {
        if (imageUrl) {
          const isSetImage = this.editor
            .chain()
            .focus()
            .setImage({
              src: imageUrl,
            })
            .run();
          if (isSetImage) {
            // 이미지 editor 추가 완료

            // editor에서 존재하는 image 태그 돌아서, src가 매개변수인 imageUrl과 같은지 확인

            const editorEl = document.getElementById("editorArea"); // 검색 영역
            const imageEls = editorEl.querySelectorAll("img"); // image el 전체 검색

            const foundImageEl = Array.from(imageEls).find(
              (img) => img.getAttribute("src") === imageUrl
            );

            if (foundImageEl != undefined && foundImageEl != "") {
              // 여기서 parent update 메소드 호출 -> image는 update 시, 기존 update 로직 활성화 X
              const imagePrevNode = foundImageEl.previousSibling;
              const imageNextNode = foundImageEl.nextSibling;
              const foundImageElOuterHtml = foundImageEl.outerHTML;
              // const imageNextNode = foundImageEl.nextSibling;
              this.$parent.updateBlock(
                foundImageEl.getAttribute("data-id"),
                "image",
                foundImageElOuterHtml,
                imagePrevNode != null
                  ? imagePrevNode.getAttribute("data-id")
                  : null,
                imageNextNode != null
                  ? imageNextNode.getAttribute("data-id")
                  : null,
                null,
                null
              );
            }
          }
        }
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    focusBlockFromBlockFeId() {
      const el = document.querySelector(
        `[data-id="${this.routeQueryBlockFeId}"]`
      );
      // const $el = this.editor.$node(`[data-id="${this.routeQueryBlockFeId}"]`)
      const $p = this.editor.$node("paragraph");

      console.error("@@@@@@@@@@@@@@@@@", $p);
      if (el) {
        el.classList.add("has-focus");
        el.setAttribute("tabindex", "-1");
        this.editor.commands.focus(50);
        el.focus();
        // el.removeAttribute("tabindex");
      }
    },
    // noneContentFunc() {
    //   const thisuuId = this.generateUUID();
    //   this.$parent.updateBlock(
    //     thisuuId,
    //     "paragraph",
    //     "", // updateElOuterHtml
    //     null,
    //     null
    //   );
    //   return `<p class='is-empty is-editor-empty' data-placeholder='내용을 작성하세요.' data-id='${thisuuId}'></p>`;
    // },
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    },
    onIndentExecuted(event) {
      console.log("Indent 실행됨:", event.detail);
      const node = event.detail.selection.$anchor.path[3];
      // const node = options?.nodes[0];
      const nodeDataId = node.attrs?.id;
      let nodeIndent = node.attrs?.indent;
      nodeIndent = nodeIndent < 210 ? nodeIndent + 30 : 0; // 변경된 indent 값이 넘어오지 않아 강제로 작업
      const nodeEl = document.querySelector(`[data-id="${nodeDataId}"]`);

      if (nodeEl) {
        const nodeElOuterHtml = nodeEl.outerHTML;
        this.$parent.updateIndentBlock(nodeDataId, nodeElOuterHtml, nodeIndent);
      }
    },
    onOutdentExecuted(event) {
      console.log("Outdent 실행됨:", event);
      const node = event.detail.selection.$anchor.path[3];
      // const node = options?.nodes[0];
      const nodeDataId = node.attrs?.id;
      let nodeIndent = node.attrs?.indent;
      nodeIndent = nodeIndent > 0 ? nodeIndent - 30 : 0; // 변경된 indent 값이 넘어오지 않아 강제로 작업
      const nodeEl = document.querySelector(`[data-id="${nodeDataId}"]`);

      if (nodeEl) {
        const nodeElOuterHtml = nodeEl.outerHTML;
        this.$parent.updateIndentBlock(nodeDataId, nodeElOuterHtml, nodeIndent);
      }
    },

    // drag용 이벤트
    async handleDrop(event) {
      event.preventDefault();
      const droppedData = event.dataTransfer.getData("items");

      // 드롭된 데이터 로그 출력
      console.log("드롭된 데이터2222(raw):", droppedData);

      // 드롭된 데이터가 유효한지 확인합니다.
      if (droppedData && droppedData.trim() !== "") {
        try {
          const parsedData = JSON.parse(droppedData);
          console.log(
            "드롭된 데이터(parsed): canvas <<<<<<<<<<<<<<<<<<<<",
            parsedData
          );

          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const dragedFile = parsedData[0]; // 배열의 첫 번째 항목 사용
            if (dragedFile.type === "drive") {
              if (dragedFile.driveType == "file") {
                console.log("드롭된 파일 ID:", dragedFile.fileId);
                // 파일 업로드나 추가 작업을 수행할 로직 작성

                // 에디터에 이미지 삽입
                this.insertImageToEditor(dragedFile.fileUrl);
              } else {
                alert("드라이브에서는 [파일]만 drop할 수 있습니다.");
              }
            }
          } else if (parsedData?.type === "canvas") {
            alert("캔버스 끼리는 drop 할 수 없습니다.");
          } else if (parsedData?.type === "thread") {
            console.error("thread drop");
            this.addThreadInTipTap(parsedData);
          } else {
            alert("옳지 않은 drop 방식 입니다.");
          }
        } catch (error) {
          console.error("JSON 파싱 오류:", error);
        }
      } else {
        console.log("드롭된 데이터가 없습니다.");
      }

      this.tcdDroppedData = null;
    },
    // tiptap에 thread drag 요소 추가하는 용도
    addThreadInTipTap(threadData) {
      const threadId = threadData.id; // threadData에서 ID 가져오기
      const content = `<p><a href="/channel/${this.$store.getters.getChannelId}/thread/view?threadId=${threadId}" data-thread-id="${threadId}">${threadData.content}</a></p>`; // HTML 문자열 생성

      // Tiptap의 `commands`를 사용하여 HTML을 삽입
      this.editor.commands.insertContent(content);
    },
  },
  beforeUnmount() {
    // 컴포넌트 제거 시 이벤트 리스너 제거
    this.editor.destroy();
    // indent 용 이벤트 추가
    window.removeEventListener("indentExecuted", this.onIndentExecuted);
    window.removeEventListener("outdentExecuted", this.onOutdentExecuted);
    // if (typeof window !== "undefined") {

    // }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/tiptapCustom.scss";
</style>

<style lang="scss">
.tiptapWrap {
  position: relative;

  .tcd-drop-area {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba($color: #000000, $alpha: 0.5);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: bold;
    z-index: 3;
  }
}
</style>
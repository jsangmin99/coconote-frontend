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
    <!-- 이미지 업로드 버튼 -->
    <div class="image-upload-container">
      <input type="file" ref="fileInput" @change="handleImageUpload" hidden />
      <v-btn @click="triggerFileInput" color="primary">이미지 업로드</v-btn>
    </div>
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
import axios from "axios";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";
import CustomBlock from "@/components/tiptab/CustomBlock"; // CustomBlock 가져오기

import UniqueID from "@tiptap-pro/extension-unique-id";
import DragHandle from "@tiptap-pro/extension-drag-handle";
import NodeRange from "@tiptap-pro/extension-node-range";
// import { isChangeOrigin } from "@tiptap/extension-collaboration";
import DraggableItem from "@/components/tiptab/DraggableItem";
import Image from "@tiptap/extension-image"; // 이미지 추가용
// import { NodePos } from '@tiptap/core';

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
      "getAllBlockFeIds",
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

      dragCheckEditorJson: null,

      dragCheckSelectionNode: null,
      tempDragCheckSelectionNode: null,

      // image 업로드 용
      fileList: [], // 업로드할 파일 리스트
      tempFilesRes: null, // 서버에 저장된 파일 메타데이터 응답

      // 삭제체크용
      nodeLength: null,
    };
  },
  watch: {
    // 부모에서 전달받은 content 값이 변경될 때 실행할 함수
    parentUpdateEditorContent(newVal) {
      this.onContentChanged(newVal);
    },
  },
  mounted() {
    this.editor = new Editor({
      extensions: [
        Image.configure({
          HTMLAttributes: {
            class: "my-image",
          },
        }),
        StarterKit.configure({
          bulletList: false, // ol, ul, li 형식 허용 X
          orderedList: false,
          listItem: false,
        }),
        CustomBlock,
        DraggableItem,
        UniqueID.configure({
          types: ["heading", "paragraph", "image"],
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

              // const result = this.compareIdOrders(
              //   this.dragCheckEditorJson,
              //   prevJson
              // );

              // const tempBlock = [
              //   result.currentId,
              //   "paragraph",
              //   result.currentContent[0].text == ""
              //     ? ""
              //     : result.currentContent[0].text,
              //   result.previousOfCurrentId,
              //   null,
              // ];
              // console.log("tempBlock", tempBlock, result);

              // this.$parent.changeOrderBlock(
              //   result.currentId,
              //   result.previousOfCurrentId,
              //   result.nextBlockId,
              //   null
              // );
              // this.dragCheckEditorJson = null;
              // this.dragCheckSelectionNode = null;
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
      ],
      onUpdate: () => {
        const selectedNode = this.editor.state.selection;
        let isReturn = true;

        if (!selectedNode) {
          return false;
        }

        // 삭제 check용
        if (this.dragCheckSelectionNode == null) {
          //drag 중이 아닐 때 가능
          const updateAfterNodes = selectedNode.$anchor.path[0].content.content;
          console.log("ㅠㅠㅠㅠㅠㅠㅠㅠㅠ", this.nodeLength, updateAfterNodes.length)
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

            // return removedIds; // 사라진 ID 반환
            this.$parent.deleteBlock(removedIds[0]);

            // this.nodeLength = updateAllFeIds.length;
          }
        }

        const updateBlockID = selectedNode?.$head?.path[3]?.attrs?.id;
        if (!updateBlockID) {
          return false;
        }
        const updateContent =
          selectedNode?.$head?.path[3]?.content?.content[0]?.text;

        // console.log(
        //   "⭐ Node:",
        //   updateBlockID,
        //   updateContent,
        //   this.editor.view?.trackWrites?.dataset?.id,
        //   updateContent == "",
        //   this.editor.view?.trackWrites?.data,
        //   updateContent == undefined
        // );

        if (this.localJSON.content == undefined) {
          this.localJSON = this.editor.getJSON();
        }

        // 내용 차이 확인
        const filteredItems = this.localJSON?.content.filter(
          (item) => item.attrs.id === updateBlockID
        );

        if (filteredItems.length > 0) {
          if (
            filteredItems[0].content != undefined &&
            filteredItems[0].content[0].text == updateContent
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
        const searchElAndPrevEl = this.findPreviousId(
          this.localJSON.content,
          updateBlockID
        );

        console.log("444", searchElAndPrevEl);

        if (searchElAndPrevEl == undefined || searchElAndPrevEl.length <= 0) {
          return false;
        }

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
      },
      content: this.defaultContent,
    });

    this.editor.on("create", ({ editor }) => {
      // The editor is ready.
      this.nodeLength =
        editor.view.state.selection.$anchor.path[0].content.content.length;
      this.localHTML = editor.getHTML();
      this.localJSON = editor.getJSON();
    });
  },
  methods: {
    ...mapActions([
      "pushBlockFeIdsActions",
      "deleteBlockTargetFeIdActions",
      "appendBlockFeIdsAfterPrevActions",
    ]),
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
      console.log("부모 컴포넌트로부터 새로운 content를 받았습니다:");

      let targetElement = document.querySelector(
        `#editorArea [data-id="${newContent.feId}"]`
      );

      if (newContent.method == "delete") {
        // 삭제한 경우
        if (targetElement) {
          // ⭐ 자식 생각 필요
          targetElement.remove();
        }
        // defaultFeId 중 해당 아이디 삭제
        this.deleteBlockTargetFeIdActions(newContent.feId).then((isDeleteBlock) => {
          console.log("isDeleteBlock newContent.feId :: ", isDeleteBlock);
          this.nodeLength = this.nodeLength - 1;
        });
      } else if (newContent.method == "changeOrder") {
        // 순서변경의 경우
        console.log("부모로부터 순서변경 감지!!! ");
        const changeNode = document.querySelector(
          `[data-id="${newContent.feId}"]`
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

        console.log("appendType >> ",appendType, newContent.prevBlockId, newContent.nextBlockId)
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
          }else{
            console.error("prev, next 모두 null. 첫줄 drag 이동한 상황")
          }
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
            image: "img",
          };

          let elTagType = typeEl[newContent.type];
          if (elTagType === "h") {
            elTagType += "1";
          }

          let newElement = document.createElement(elTagType);
          newElement.setAttribute("data-id", newContent.feId);
          if (elTagType == "img") {
            newElement.src = newContent.contents;
          } else {
            newElement.textContent = newContent.contents;
          }

          if(newContent.method == "create"){
            // 생성인 경우 store 개수 늘리기
            this.appendBlockFeIdsAfterPrevActions(newContent.feId , newContent.prevBlockId);
            this.nodeLength = this.nodeLength + 1;
            console.log("zzz>> ",newContent.method, this.nodeLength)
          }

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
          } else {
            // parent, prev null 이어서 insert
            let elementString = newElement.outerHTML;
            console.error("editor에 추가", newElement, elementString);
            this.editor.commands.insertContent(elementString);
          }
        }
        return false;
      }
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
      };
      for (let i = 0; i < editorJson.length; i++) {
        if (editorJson[i].attrs?.id == targetId) {
          idGroupObj.prevBlockId = i > 0 ? editorJson[i - 1].attrs.id : null;
          idGroupObj.nextBlockId =
            i < editorJson.length - 1 ? editorJson[i + 1].attrs.id : null;

          idGroupObj.contents = editorJson[i]?.content?.text;
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
              // const imageNextNode = foundImageEl.nextSibling;
              this.$parent.updateBlock(
                foundImageEl.getAttribute("data-id"),
                "image",
                foundImageEl.getAttribute("src"),
                imagePrevNode != null
                  ? imagePrevNode.getAttribute("data-id")
                  : null,
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
  },
  beforeUnmount() {
    // 컴포넌트 제거 시 이벤트 리스너 제거
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

  /* image styles */
  img {
    display: block;
    height: auto;
    margin: 1.5rem 0;
    max-width: 100%;

    &.ProseMirror-selectednode {
      outline: 3px solid var(--purple);
    }
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
  padding: 1rem 3rem 1rem 3rem;

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

<template>
  <div class="canvasDetailComponentContainer">
    <!-- <h2>{{ room.title }}</h2> -->
    <v-row class="canvasTitleContainer">
      <v-col class="p-0">
        <v-text-field
          color="primary"
          density="compact"
          class="canvasTitle"
          variant="plain"
          v-model="room.title"
          @keyup.enter="changeCanvasName"
        ></v-text-field>
      </v-col>
      <v-col class="p-0" style="text-align: right">
        <v-icon icon="mdi-delete" @click="deleteCanvas" />
      </v-col>
    </v-row>
    <hr />
        <!-- 이미지 업로드 버튼 -->
        <div class="image-upload-container">
      <input type="file" ref="fileInput" @change="handleImageUpload" hidden />
      <v-btn @click="triggerFileInput" color="primary">이미지 업로드</v-btn>
    </div>

    <div>
      <TipTabEditor
        v-if="this.editorContent != null"
        :initialContent="editorContent"
        :parentUpdateEditorContent="parentUpdateEditorContent"
        v-model="content"
      />
    </div>
  </div>
</template>

<script>
import TipTabEditor from "@/components/tiptab/TipTabEditor.vue";
import axios from "axios";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "CanvasDetailComponent",
  props: {
    canvasId: {
      type: Number,
      required: true,
    },
  },
  watch: {
    canvasId(newId) {
      this.handleCanvasIdChange(newId);
    },
  },
  components: {
    TipTabEditor,
  },
  computed: {
    ...mapGetters([
      "getBlockFeId",
      "getBlockFeIdIndex",
      "getTargetBlockPrevFeId",
      "getTargetBlockPrevFeIdIndex",
    ]),
  },
  data() {
    return {
      room: {},
      sender: "",
      member: "",
      message: "",
      messages: [],
      ws: null,
      wsBlock: null,
      sock: null,
      sockBlock: null,
      reconnect: 0,

      detailCanvasId: null,
      canvas: {},
      blocks: [],

      activeBlockId: null,
      editorContent: null,
      parentUpdateEditorContent: "초기 값",
      fileList: [], // 업로드할 파일 리스트
      filesRes: null, // 서버에 저장된 파일 메타데이터 응답
    };
  },
  mounted() {
    console.error("생성중...");
    this.sender = localStorage.getItem("wschat.sender");

    this.handleCanvasIdChange(this.canvasId);
  },
  methods: {
    ...mapActions([
      "setDefaultBlockFeIdsActions",
      "pushBlockFeIdsActions",
      "deleteBlockTargetFeIdActions",
    ]),
    handleCanvasIdChange(newCanvasId) {
      console.error("생성중...222 >>", newCanvasId);
      this.detailCanvasId = newCanvasId;
      this.member = localStorage.getItem("wschat.sender");
      this.getCanvasAndBlockInfo();
      this.connect();
    },
    async getCanvasAndBlockInfo() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/canvas/${this.detailCanvasId}`
      );

      this.room = response.data.result;

      // console.log("####", response.data.result);

      const blockResponse = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/block/${this.detailCanvasId}/list`
      );
      this.blocks = blockResponse.data.result;

      this.setDefaultBlockFeIdsActions(
        blockResponse.data.result.map((el) => {
          return el.feId;
        })
      );

      this.settingEditorContent();
      // this.editorContent = ``;
    },
    settingEditorContent() {
      let blockToEditorContentArr = [];
      for (const block of this.blocks) {
        // console.log(block);
        let tempBlockObj = {
          type: block.type,
          attrs: {
            id: block.feId,
          },
        };
        if (block.content != null) {
          tempBlockObj.content = [
            {
              type: "text",
              text: block.content == null ? "" : block.content,
            },
          ];
        }

        blockToEditorContentArr.push(tempBlockObj);
      }

      this.editorContent = {
        type: "doc",
        content: blockToEditorContentArr,
      };
    },
    sendMessage() {
      if (this.ws && this.ws.connected) {
        this.ws.send(
          `/pub/block/message`,
          {},
          JSON.stringify({
            type: "CANVAS",
            roomId: this.detailCanvasId,
            sender: this.sender,
            message: JSON.stringify(this.message),
          })
        );
        this.message = "";
      } else {
        // console.log("WebSocket is not connected.");
      }
    },
    recvMessage(recv) {
      if (recv.type === "CANVAS") {
        const blockJson = JSON.parse(recv.message);
        // console.log("blockJson", blockJson);
        if (this.activeBlockId == blockJson.feId) {
          // if (this.member == blockJson.member) {
          console.log(
            "현 focus 부분이랑 같은 block 수정 중인 부분.. => block Id 동일함"
          );
        } else {
          console.log("다른 block Id 수정 중!~");
          this.parentUpdateEditorContent = blockJson;
        }
      } else {
        this.messages.unshift({
          type: recv.type,
          member: recv.type === "ENTER" ? "[알림]" : recv.member,
          message: recv.message,
        });
      }
    },
    connect() {
      // this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
      this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
      this.ws = Stomp.over(this.sock);
      this.ws.connect(
        {},
        () => {
          this.ws.subscribe(
            `/sub/canvas/room/${this.detailCanvasId}`,
            (message) => {
              const recv = JSON.parse(message.body);
              this.recvMessage(recv);
            }
          );
          this.ws.send(
            `/pub/canvas/message`,
            {},
            JSON.stringify({
              type: "ENTER",
              roomId: this.detailCanvasId,
              sender: this.sender,
            })
          );
        },
        () => {
          if (this.reconnect++ <= 5) {
            setTimeout(() => {
              this.sock = new SockJS(
                `${process.env.VUE_APP_API_BASE_URL}/ws-stomp`
              );
              this.ws = Stomp.over(this.sock);
              this.connect();
            }, 10 * 1000);
          }
        }
      );
      // block 용 websocket
      this.sockBlock = new SockJS(
        `${process.env.VUE_APP_API_BASE_URL}/ws-stomp`
      );
      this.wsBlock = Stomp.over(this.sockBlock);
      this.wsBlock.connect(
        {},
        () => {
          this.wsBlock.subscribe(
            `/sub/block/room/${this.detailCanvasId}`,
            (message) => {
              const recv = JSON.parse(message.body);
              this.recvMessage(recv);
            }
          );
          this.wsBlock.send(
            `/pub/block/message`,
            {},
            JSON.stringify({
              type: "ENTER",
              roomId: this.detailCanvasId,
              member: this.member,
            })
          );
        },
        () => {
          if (this.reconnect++ <= 5) {
            setTimeout(() => {
              this.sockBlock = new SockJS(
                `${process.env.VUE_APP_API_BASE_URL}/ws-stomp`
              );
              this.wsBlock = Stomp.over(this.sockBlock);
              this.connect();
            }, 10 * 1000);
          }
        }
      );
    },
    beforeRouteLeave() {
      // 컴포넌트가 파괴되기 전에 구독 해제 및 WebSocket 연결 종료
      if (this.subscription) {
        this.subscription.unsubscribe(); // 구독 해제
        console.log("WebSocket subscription unsubscribed.");
      }
      if (this.ws) {
        this.ws.disconnect(() => {
          console.log("WebSocket connection closed.");
        });
      }
    },

    // tiptabEditor method
    deleteBlock(blockFeId) {
      const prevBlockId = this.$store.getters.getTargetBlockPrevFeId(blockFeId); //삭제전 prev block id 검색
      console.log("prevBlockId :: ", prevBlockId)
      this.deleteBlockTargetFeIdActions(blockFeId).then((isDeleteBlock) => {
        console.log("isDeleteBlock :: ", isDeleteBlock);
        if (isDeleteBlock) {
          // 기존 값에 있어서 삭제했다면
          this.message = {
            method: "delete",
            canvasId: this.canvasId,
            prevBlockId: prevBlockId,
            parentBlockId: null,
            contents: "z",
            type: "paragraph", //삭제여서 타입 관계 X
            feId: blockFeId,
            member: this.sender, // 현재 접속한 user ⭐ 추후 변경
          };

          this.sendMessage();
        }
      });
    },
    updateBlock(blockFeId, blockElType, blockContent, previousId, parentId) {
      if (!blockFeId) {
        return false;
      }
      console.log("⭐⭐⭐⭐⭐⭐editor에서 호출⭐⭐⭐⭐⭐");
      console.log(
        blockFeId,
        blockContent,
        `  previousId >> ${previousId}  \n parentId >> ${parentId}`
      );

      this.activeBlockId = blockFeId;

      const blockMethod = this.checkBlockMethod(blockFeId, blockContent);
      this.message = {
        method: blockMethod,
        canvasId: this.canvasId,
        prevBlockId: previousId,
        parentBlockId: parentId,
        contents: blockContent,
        type: blockElType,
        feId: blockFeId,
        member: this.sender, // 현재 접속한 user ⭐ 추후 변경
      };

      this.sendMessage();
    },
    checkBlockMethod(targetBlockFeId) {
      const found = this.getBlockFeId(targetBlockFeId);

      if (found) {
        // block의 생성, 수정, 삭제 (create, update, delete)
        // console.error("찾은거 하기...", this.recentKeyboardKey);
        return "update";
      } else {
        this.pushBlockFeIdsActions(targetBlockFeId);
        return "create";
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
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

        // 에디터에 이미지 삽입
        this.insertImageToEditor(uploadedUrl);
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
        fileType: 'CANVAS', // FileType Enum으로 'CANVAS' 지정
        fileSaveListDto: uploadedFileUrls.map((url, index) => ({
          fileName: this.fileList[index].name, // 파일 이름
          fileUrl: url, // S3 URL
        })),
      };
      const response = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/files/metadata`,
        metadataDto
      );
      console.log(response.data.result);
      this.filesRes = response.data.result;
    },

    // TipTap 에디터에 이미지 삽입
    insertImageToEditor(imageUrl) {
      if (this.$refs.editor && this.$refs.editor.editor) {
        this.$refs.editor.editor.chain().focus().setImage({ src: imageUrl }).run();
      }
    },

    changeCanvasName() {
      console.error(this.room.title);
    },
    deleteCanvas() {
      console.log("canvas 삭제 예정");
    },
  },
  beforeUnmount() {
    this.beforeRouteLeave();
  },
};
</script>

<style lang="scss">
.canvasDetailComponentContainer {
  display: flex;
  flex-direction: column;
  padding: 24px;
  .canvasTitleContainer {
    align-items: center;
  }
  .canvasTitle {
    input {
      font-size: 2em;
      font-weight: bold;
    }
    .v-input__details {
      display: none;
    }
  }
}
.image-upload-container {
    margin: 10px 0;
  }
</style>

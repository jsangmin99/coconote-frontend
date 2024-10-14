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
    <div>
      <TipTabEditor
        v-if="this.editorContent != null"
        :initialContent="editorContent"
        :parentUpdateEditorContent="parentUpdateEditorContent"
        v-model="content"
      />
    </div>
    <div class="readonlyPage" v-if="isReadonly">
      삭제된 페이지 입니다. 작업하실 수 없습니다.
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
    getCanvasAllInfo: {
      handler(newVal) {
        console.log("Canvas Info Updated @@@@@@@@@@@@@@ :", newVal);
        // canvasInfo 변경 시 동작할 코드 작성
        if (newVal.method == "update") {
          if (newVal.title && newVal.title != this.room.title) {
            // 이름변경
            this.room.title = newVal.title;
          }
        } else if (newVal.method == "delete") {
          console.error("삭제된 캔버스#####", newVal.canvasId, this.canvasId);
          if (newVal.canvasId && newVal.canvasId == this.canvasId) {
            // 캔버스 삭제
            console.error("삭제된 캔버스!!");
            this.isReadonly = true;
          }
        }
      },
      deep: true, // 깊은 상태 변화를 감지
    },
  },
  components: {
    TipTabEditor,
  },
  computed: {
    ...mapGetters([
      "getChannelId",
      "getBlockFeId",
      "getBlockFeIdIndex",
      "getTargetBlockPrevFeId",
      "getTargetBlockPrevFeIdIndex",

      // canvas용 vuex
      "getCanvasAllInfo",
    ]),
  },
  data() {
    return {
      room: {},
      sender: "",
      member: "",
      message: "",
      messages: [],
      wsBlock: null,
      sockBlock: null,
      reconnect: 0,

      detailCanvasId: null,
      isReadonly: false,
      canvas: {},
      blocks: [],

      activeBlockId: null,
      editorContent: null,
      parentUpdateEditorContent: "초기 값",
    };
  },
  mounted() {
    console.error("생성중...");
    this.sender = localStorage.getItem("wschat.sender");
    async () => {
      this.beforeRouteLeave();
    }
    this.handleCanvasIdChange(this.canvasId);
  },
  methods: {
    ...mapActions([
      "setDefaultBlockFeIdsActions",
      "pushBlockFeIdsActions",
      "appendBlockFeIdsAfterPrevActions",
      "deleteBlockTargetFeIdActions",

      // canvas용 vuex
      "setCanvasAllInfoAction",
    ]),
    handleCanvasIdChange(newCanvasId) {
      console.error("생성중...222 >>", newCanvasId);
      this.detailCanvasId = newCanvasId;
      this.member = localStorage.getItem("wschat.sender");
      this.getCanvasAndBlockInfo();
      this.connect();
    },
    async getCanvasAndBlockInfo() {
      try {
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
      } catch (error) {
        console.error(error);
      }
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
          if (block.type == "image") {
            tempBlockObj.attrs.src = block.content;
          } else {
            tempBlockObj.content = [
              {
                type: "text",
                text: block.content,
              },
            ];
          }
        }

        blockToEditorContentArr.push(tempBlockObj);
      }

      this.editorContent = {
        type: "doc",
        content: blockToEditorContentArr,
      };
    },
    sendMessage() {
      if (this.wsBlock && this.wsBlock.connected) {
        this.wsBlock.send(
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
      console.error(recv.type);
      if (recv.type === "CANVAS") {
        const blockJson = JSON.parse(recv.message);
        console.error("blockJson >> ", blockJson);
        if (
          this.activeBlockId == blockJson.feId &&
          blockJson.method === "update"
        ) {
          // if (this.member == blockJson.member) {
          console.log(
            "현 focus 부분이랑 같은 block 수정 중인 부분..인데! update여서 보냄! => block Id 동일함"
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
      // block 용 websocket
      if(this.sockBlock != null && this.wsBlock != null){
        return false;
      }
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
      if (this.sockBlock) {
        this.sockBlock.close(); // SockJS 연결을 닫음
        this.sockBlock = null;
        console.log("WebSocket subscription unsubscribed.");
      }
      if (this.wsBlock) {
        this.wsBlock.disconnect(() => {
          console.log("WebSocket wsBlock connection closed.");
        });
      }
    },
    // tiptabEditor method
    deleteBlock(blockFeId) {
      const prevBlockId = this.$store.getters.getTargetBlockPrevFeId(blockFeId); //삭제전 prev block id 검색
      console.log("prevBlockId :: ", prevBlockId);
      this.deleteBlockTargetFeIdActions(blockFeId).then((isDeleteBlock) => {
        console.log("isDeleteBlock :: ", isDeleteBlock);
        if (isDeleteBlock) {
          // 기존 값에 있어서 삭제했다면
          this.message = {
            method: "delete",
            canvasId: this.canvasId,
            prevBlockId: prevBlockId,
            parentBlockId: null,
            contents: "",
            type: "paragraph", //삭제여서 타입 관계 X
            feId: blockFeId,
            member: this.sender, // 현재 접속한 user ⭐ 추후 변경
          };

          console.log(this.message);

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
        feId: blockFeId, // block id
        prevBlockId: previousId,
        canvasId: this.canvasId,
        // parentBlockId: parentId,
        contents: blockContent,
        type: blockElType,
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
    changeOrderBlock(changeOrderObj) {
      const { prevBlockId, nextBlockId, feId, contents, parentBlockId } =
        changeOrderObj;
      console.log(
        "changeOrderBlock >> ",
        prevBlockId,
        nextBlockId,
        feId,
        contents,
        parentBlockId
      );

      this.activeBlockId = feId;

      this.message = {
        canvasId: this.canvasId,
        method: "changeOrder",
        ...changeOrderObj,
        member: this.sender, // 현재 접속한 user ⭐ 추후 변경
      };

      this.sendMessage();
    },
    async changeCanvasName() {
      console.error(this.room.title);
      const params = {
        title: this.room.title,
        parentCanvasId: null,
        canvasId: this.canvasId,
        channelId: this.getChannelId,
      };
      try {
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/canvas/${this.canvasId}`,
          params
        );
        console.log(response);
        const updateCanvasTitle = response.data.result.title;
        this.room.title = updateCanvasTitle;
        this.updateCanvasInfo();
      } catch (error) {
        console.log(error);
      }
    },
    updateCanvasInfo() {
      this.$store.dispatch("setCanvasAllInfoAction", {
        method: "nameChange",
        canvasId: this.canvasId,
        title: this.room.title,
      });
    },
    deleteCanvasView() {
      // 지워졌다고 보이게 하는 용도
      // this.canvasMessage = {
      //   method: "delete",
      //   canvasId: this.canvasId,
      //   member: this.sender, // 현재 접속한 user ⭐ 추후 변경
      // };
      // this.sendMessageCanvas();
      this.$store.dispatch("setCanvasAllInfoAction", {
        method: "delete",
        canvasId: this.canvasId,
        member: this.sender,
      });
      this.isReadonly = true;
    },
    async deleteCanvas() {
      console.log("canvas 삭제 예정");
      try {
        const response = await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/canvas/${this.canvasId}`
        );
        console.log(response);
        this.deleteCanvasView();
      } catch (error) {
        console.log(error);
      }
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
  position: relative;
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
  .readonlyPage {
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    background: rgba($color: #ffffff, $alpha: 0.7);
    color: red;
    align-items: center;
    justify-content: center;
  }
}
.image-upload-container {
  margin: 10px 0;
}
</style>

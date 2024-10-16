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
    getPageInfoForComponent: {
      handler(newVal) {
        console.error("캔버스 페이지 변경 감지 @@@@@@@@@@@@@@ :", newVal);
        // canvasInfo 변경 시 동작할 코드 작성
        if (newVal == "LIST&DETAIL" || newVal == "DETAIL") {
          console.log(newVal, " type 추가가@@@ 예정");
          this.getCanvasAllInfo_inDetail = this.getCanvasAllInfo;

          if (this.getCanvasAllInfo_inDetail.method == "UPDATE_CANVAS") {
            this.onCanvasInfoChanged();
          } else if (this.getCanvasAllInfo_inDetail.method == "DELETE_CANVAS") {
            if(this.getCanvasAllInfo_inDetail.canvasId == this.canvasId){
              console.log("detail canvas id >> ",this.getCanvasAllInfo_inDetail.canvasId, this.canvasId)
              this.deleteCanvasView();
            }
          } else {
            console.error("detail 에서는 사용 X 혹은 잘못된 method");
          }
        }
        // if (newVal.method == "update") {
        //   if (newVal.title && newVal.title != this.room.title) {
        //     // 이름변경
        //     this.room.title = newVal.title;
        //   }
        // } else if (newVal.method == "delete") {
        //   console.error("삭제된 캔버스#####", newVal.canvasId, this.canvasId);
        //   if (newVal.canvasId && newVal.canvasId == this.canvasId) {
        //     // 캔버스 삭제
        //     console.error("삭제된 캔버스!!");
        //     this.isReadonly = true;
        //   }
        // }
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
      "getPageInfoForComponent",
    ]),
  },
  data() {
    return {
      room: {},
      sender: "",
      member: "",
      message: "",
      messages: [],

      getCanvasAllInfo_inDetail: null,

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
    this.sender = localStorage.getItem("wschat.sender");
    async () => {
      this.beforeRouteLeave();
    };
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
      this.detailCanvasId = newCanvasId;
      this.getCanvasAndBlockInfo();
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
      // Vuex action 호출
      const pageSetObj = {
        postMessageType: "BLOCK", // 현 이벤트가 canvas 인지 block인지 구분
        page: "VIEW", // 이 이벤트를 받아야하는 타겟 페이지
        postEventPage: "DETAIL", // 이 이벤트를 호출한 페이지
        ...this.message,
      };
      this.$store.dispatch("setInfoMultiTargetAction", pageSetObj);
      // if (this.wsBlock && this.wsBlock.connected) {
      //   this.wsBlock.send(
      //     `/pub/block/message`,
      //     {},
      //     JSON.stringify({
      //       type: "CANVAS",
      //       roomId: this.detailCanvasId,
      //       sender: this.sender,
      //       message: JSON.stringify(this.message),
      //     })
      //   );
      //   this.message = "";
      // } else {
      //   // console.log("WebSocket is not connected.");
      // }
    },
    // recvMessage(recv) {
    // console.error(recv.type);
    // const blockJson = JSON.parse(recv.message);
    //   console.error("blockJson >> ", blockJson);
    //   if (
    //     this.activeBlockId == blockJson.blockFeId &&
    //     blockJson.method === "UPDATE_BLOCK"
    //   ) {
    //     // if (this.member == blockJson.member) {
    //     console.log(
    //       "현 focus 부분이랑 같은 block 수정 중인 부분..인데! update여서 보냄! => block Id 동일함"
    //     );
    //   } else {
    //     console.log("다른 block Id 수정 중!~");
    //     this.parentUpdateEditorContent = blockJson;
    //   }
    // if (recv.type === "CANVAS") {

    // } else {
    // this.messages.unshift({
    //   type: recv.type,
    //   member: recv.type === "ENTER" ? "[알림]" : recv.member,
    //   message: recv.message,
    // });
    // }
    // },
    // tiptabEditor method
    deleteBlock(blockFeId) {
      const prevBlockId = this.$store.getters.getTargetBlockPrevFeId(blockFeId); //삭제전 prev block id 검색
      console.log("prevBlockId :: ", prevBlockId);
      this.deleteBlockTargetFeIdActions(blockFeId).then((isDeleteBlock) => {
        console.log("isDeleteBlock :: ", isDeleteBlock);
        if (isDeleteBlock) {
          // 기존 값에 있어서 삭제했다면
          this.message = {
            postMessageType: "BLOCK", // 고정
            method: "DELETE_BLOCK",
            canvasId: this.canvasId,
            prevBlockId: prevBlockId,
            parentBlockId: null,
            blockContents: "",
            blockType: "paragraph", //삭제여서 타입 관계 X
            blockFeId: blockFeId,
            // member: this.sender, // 현재 접속한 user ⭐ 추후 변경
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
        blockFeId: blockFeId, // block id
        prevBlockId: previousId,
        canvasId: this.canvasId,
        // parentBlockId: parentId,
        blockContents: blockContent,
        blockType: blockElType,
        // member: this.sender, // 현재 접속한 user ⭐ 추후 변경
      };

      this.sendMessage();
    },
    checkBlockMethod(targetBlockFeId) {
      const found = this.getBlockFeId(targetBlockFeId);

      if (found) {
        // block의 생성, 수정, 삭제 (create, update, delete)
        // console.error("찾은거 하기...", this.recentKeyboardKey);
        return "UPDATE_BLOCK";
      } else {
        this.pushBlockFeIdsActions(targetBlockFeId);
        return "CREATE_BLOCK";
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
        method: "CHANGE_ORDER_BLOCK",
        blockFeId: changeOrderObj.feId,
        prevBlockId: changeOrderObj.prevBlockId,
        nextBlockId: changeOrderObj.nextBlockId,
        parentBlockId: null,
        blockContents: changeOrderObj.contents,
      };

      this.sendMessage();
    },
    async changeCanvasName() {
      console.error(this.room.title);
      const pageSetObj = {
        postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
        page: "VIEW", // 이 이벤트를 받아야하는 타겟 페이지
        postEventPage: "DETAIL", // 이 이벤트를 호출한 페이지
        method: "UPDATE_CANVAS",
        canvasId: this.canvasId,
        canvasTitle: this.room.title,
      };
      this.$store.dispatch("setInfoMultiTargetAction", pageSetObj);
    },
    onCanvasInfoChanged() {
      // 캔버스 정보가 변경되었을 때 실행할 로직
      if (this.room.title != this.getCanvasAllInfo_inDetail.canvasTitle) {
        this.room.title = this.getCanvasAllInfo_inDetail.canvasTitle; // 리스트 항목의 title을 업데이트
      }
    },
    deleteCanvasView() {
      // 지워졌다고 보이게 하는 용도
      this.isReadonly = true;
    },
    async deleteCanvas() {
      console.log("canvas 삭제 예정");
      const pageSetObj = {
        postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
        page: "VIEW", // 이 이벤트를 받아야하는 타겟 페이지
        postEventPage: "DETAIL", // 이 이벤트를 호출한 페이지
        method: "DELETE_CANVAS",
        canvasId: this.canvasId,
      };
      this.$store.dispatch("setInfoMultiTargetAction", pageSetObj);
      this.deleteCanvasView();
    },
  },
  beforeUnmount() {},
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

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
    <div class="tiptapEditorContainer">
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
// import { debounce } from "lodash";

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
        // canvasInfo 변경 시 동작할 코드 작성
        if (newVal == "LIST&DETAIL" || newVal == "DETAIL") {
          this.getCanvasAllInfo_inDetail = this.getCanvasAllInfo;

          if (this.getCanvasAllInfo_inDetail.method == "UPDATE_CANVAS") {
            this.onCanvasInfoChanged();
          } else if (this.getCanvasAllInfo_inDetail.method == "DELETE_CANVAS") {
            if (this.getCanvasAllInfo_inDetail.canvasId == this.canvasId) {
              this.deleteCanvasView();
            }
          } else if (
            this.getCanvasAllInfo_inDetail.method == "CREATE_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "UPDATE_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "UPDATE_INDENT_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "CHANGE_ORDER_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "CHANGE_ORDER_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "DELETE_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "DEEP_DELETE_BLOCK"
          ) {
            this.recvMessage();
          } else {
            console.error(
              "detail 에서는 사용 X 혹은 잘못된 method",
              this.getCanvasAllInfo_inDetail.method
            );
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
      "getWorkspaceId",
      "getWorkspaceMemberId",
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
      debounceMessage: "", // timer 걸고 보낼 메시지 용 (업데이트 용)
      timeoutSendFun: null, // timer function 담을 용
      messages: [],

      getCanvasAllInfo_inDetail: null,

      detailCanvasId: null,
      isReadonly: false,
      canvas: {},
      blocks: [],

      activeBlockId: null,
      editorContent: null,
      parentUpdateEditorContent: "초기 값",

      // router용 쿼리파라미터
      routeQueryBlockFeId: null,
    };
  },
  mounted() {
    this.sender = localStorage.getItem("wschat.sender");
    async () => {
      this.beforeRouteLeave();
    };
    this.handleCanvasIdChange(this.canvasId);
    if (this.$route?.query?.blockFeId) {
      this.routeQueryBlockFeId = this.$route.query.blockFeId;
    }
  },
  methods: {
    ...mapActions([
      "setDefaultBlockFeIdsActions",
      "pushBlockFeIdsActions",
      "appendBlockFeIdsAfterPrevActions",
      "deleteBlockTargetFeIdActions",

      // canvas용 vuex
      "setCanvasAllInfoAction",
      "setInfoMultiTargetAction",
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
      } catch (error) {
        console.error(error);
      }
    },
    settingEditorContent() {
      let blockToEditorContentArr = [];
      for (const block of this.blocks) {
        let tempBlockHtml = block.content;
        // if (block.content != null) {
        //   if (block.type == "image") {
        //     tempBlockObj.attrs.src = block.content;
        //   } else {
        //     tempBlockObj.content = [
        //       {
        //         type: "text",
        //         text: block.content,
        //       },
        //     ];
        //   }
        // }

        blockToEditorContentArr.push(tempBlockHtml);
      }

      this.editorContent = blockToEditorContentArr;
    },
    async sendMessage() {
      const blockFeId = this.message.blockFeId;
      const method = this.message.method;
      if (
        method == "CREATE_BLOCK" ||
        method == "CHANGE_ORDER_BLOCK" ||
        method == "DELETE_BLOCK" ||
        method == "DEEP_DELETE_BLOCK"
      ) {
        console.error("✖️✖️✖️✖️ type 1");
        await this.clearTimeDebounceFun();
        await this.postSendMessage();
        this.debounceMessage = { ...this.message };
        await this.postSendMessage();
      } else if (
        this.debounceMessage.blockFeId &&
        blockFeId != this.debounceMessage.blockFeId
      ) {
        console.error("✖️✖️✖️✖️ type 2");
        await this.postSendMessage();
        await this.clearTimeDebounceFun();
        await this.timerSendMessage();
      } else if (
        this.timeoutSendFun &&
        blockFeId == this.debounceMessage.blockFeId &&
        method == this.debounceMessage.method
      ) {
        console.error("✖️✖️✖️✖️ type 3");
        this.debounceMessage = { ...this.message };
      } else {
        console.error("✖️✖️✖️✖️ type 4");
        if(this.timeoutSendFun){
          this.clearTimeDebounceFun();
        }
        await this.timerSendMessage();
      }
    },
    timerSendMessage() {
      this.debounceMessage = { ...this.message };
      this.timeoutSendFun = setTimeout(() => {
        this.postSendMessage();
        this.clearTimeDebounceFun();
        // 원하는 작업을 수행
      }, 500); // 0.5초 후에 실행
    },
    postSendMessage() {
      const pageSetObj = {
        workspaceId: this.getWorkspaceId,
        postMessageType: "BLOCK", // 현 이벤트가 canvas 인지 block인지 구분
        page: "VIEW", // 이 이벤트를 받아야하는 타겟 페이지
        postEventPage: "DETAIL", // 이 이벤트를 호출한 페이지
        ...this.debounceMessage,
      };
      this.$store.dispatch("setInfoMultiTargetAction", pageSetObj);
    },
    clearTimeDebounceFun() {
      clearTimeout(this.timeoutSendFun);
      this.timeoutSendFun = null;
    },
    recvMessage() {
      const blockJson = this.getCanvasAllInfo_inDetail;
      if (this.getWorkspaceMemberId == blockJson.workspaceMemberId) {
        console.error("수정 X");
      } else {
        blockJson.isRecvMessage = true;
        this.parentUpdateEditorContent = Object.assign({}, blockJson);
      }
    },
    // tiptabEditor method
    deleteBlock(blockFeId) {
      const prevBlockId = this.$store.getters.getTargetBlockPrevFeId(blockFeId); //삭제전 prev block id 검색
      this.deleteBlockTargetFeIdActions(blockFeId).then((isDeleteBlock) => {
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

          this.sendMessage();
        }
      });
    },
    deepDeleteBlock(blockFeId) {
      const prevBlockId = this.$store.getters.getTargetBlockPrevFeId(blockFeId); //삭제전 prev block id 검색
      this.deleteBlockTargetFeIdActions(blockFeId).then((isDeleteBlock) => {
        if (isDeleteBlock) {
          // 기존 값에 있어서 삭제했다면
          this.message = {
            postMessageType: "BLOCK", // 고정
            method: "DEEP_DELETE_BLOCK",
            canvasId: this.canvasId,
            prevBlockId: prevBlockId,
            parentBlockId: null,
            blockContents: "",
            blockType: "paragraph", //삭제여서 타입 관계 X
            blockFeId: blockFeId,
          };

          this.sendMessage();
        }
      });
    },
    updateBlock(
      blockFeId,
      blockElType,
      blockContents,
      previousId,
      parentId,
      blockIndent
    ) {
      if (!blockFeId) {
        return false;
      }
      console.info(parentId);

      this.activeBlockId = blockFeId;

      const blockMethod = this.checkBlockMethod(blockFeId, blockContents);
      this.message = {
        method: blockMethod,
        blockFeId: blockFeId, // block id
        prevBlockId: previousId,
        canvasId: this.canvasId,
        // parentBlockId: parentId,
        blockContents: blockContents,
        blockType: blockElType,
        // member: this.sender, // 현재 접속한 user ⭐ 추후 변경
        blockIndent: blockIndent,
      };

      this.sendMessage();
    },
    checkBlockMethod(targetBlockFeId) {
      const found = this.getBlockFeId(targetBlockFeId);
      console.error("found >>>>> ",found)
      if (found) {
        // block의 생성, 수정, 삭제 (create, update, delete)
        return "UPDATE_BLOCK";
      } else {
        this.pushBlockFeIdsActions(targetBlockFeId);
        return "CREATE_BLOCK";
      }
    },
    updateIndentBlock(nodeDataId, nodeElOuterHtml, nodeIndent) {
      console.error("⭐⭐⭐⭐⭐", nodeDataId, nodeIndent);
      this.message = {
        canvasId: this.canvasId,
        method: "UPDATE_INDENT_BLOCK",
        blockFeId: nodeDataId,
        blockIndent: nodeIndent,
        blockContents: nodeElOuterHtml
      };
      this.sendMessage();
    },
    changeOrderBlock(changeOrderObj) {
      this.activeBlockId = changeOrderObj.feId;

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
      const pageSetObj = {
        workspaceId: this.getWorkspaceId,
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
  height: 100%;
  .canvasTitleContainer {
    align-items: center;
    flex: 0;
  }
  .tiptapEditorContainer {
    height: 100%;
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

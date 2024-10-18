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
import { debounce } from "lodash";

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
            this.getCanvasAllInfo_inDetail.method == "CHANGE_ORDER_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "CHANGE_ORDER_BLOCK" ||
            this.getCanvasAllInfo_inDetail.method == "DELETE_BLOCK"
          ) {
            this.recvMessage();
          } else {
            console.error("detail 에서는 사용 X 혹은 잘못된 method");
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

      debounceMap: {}, // 각 blockFeId별 debounce 함수를 저장할 객체
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
      const blockFeId = this.message.blockFeId;
      const method = this.message.method;

      // 이전에 저장된 정보가 있는지 확인
      const existingEntry = this.debounceMap[blockFeId];

      if (existingEntry) {
        // 만약 기존에 저장된 method와 현재 method가 다르면 기존 이벤트를 보냄
        if (existingEntry.method !== method || method == "CHANGE_ORDER_BLOCK" || method == "DELETE_BLOCK") {
          // 기존에 있는 이벤트를 즉시 호출
          existingEntry.debounceFunction.flush();

          // 기존 내용을 보내고, 새로운 debounce를 설정
          this.setupDebounce(blockFeId, method, this.message);
        }else{
          // 기존에 저장된 값이라면, 덮어씌우기
          this.setupDebounce(blockFeId, method, this.message);
        }
      } else {
        // blockFeId에 해당하는 debounce가 없을 때 새로 설정
        this.setupDebounce(blockFeId, method, this.message);
      }

      // debounce 함수를 호출
      this.debounceMap[blockFeId].debounceFunction();
    },

    setupDebounce(blockFeId, method, contentObj) {
      // debounce 함수 생성 및 저장
      const debounceFunction = debounce(() => {
        const pageSetObj = {
          postMessageType: "BLOCK",
          page: "VIEW",
          postEventPage: "DETAIL",
          ...contentObj,
        };

        // Vuex action 호출
        this.$store
          .dispatch("setInfoMultiTargetAction", pageSetObj)
          .then(() => {
            // 메시지를 보낸 후 debounceMap에서 해당 blockFeId를 삭제
            delete this.debounceMap[blockFeId];
          });
      }, 300);

      // debounceMap에 blockFeId, method, debounceFunction 저장
      this.debounceMap[blockFeId] = {
        method, // 현재 method 저장
        debounceFunction, // debounce 함수 저장
      };
    },

    clearDebounceForBlockFeId(newBlockFeId) {
      // 새로운 blockFeId가 들어오면 기존에 있던 다른 blockFeId의 debounce를 제거
      Object.keys(this.debounceMap).forEach((id) => {
        if (id !== newBlockFeId) {
          // 새로운 blockFeId가 아닐 경우 이전 debounce를 취소함
          delete this.debounceMap[id];
        }
      });
    },
    recvMessage() {
      const blockJson = this.getCanvasAllInfo_inDetail;
      if (
        this.activeBlockId == blockJson.blockFeId &&
        blockJson.method === "UPDATE_BLOCK"
      ) {
        console.error("ws에서 내려온 내용으로 수정 X");
      } else {
        this.parentUpdateEditorContent = Object.assign({}, blockJson);
        // this.parentUpdateEditorContent = blockJson;
      }
      // if (recv.type === "CANVAS") {
      // } else {
      //   this.messages.unshift({
      //     type: recv.type,
      //     member: recv.type === "ENTER" ? "[알림]" : recv.member,
      //     message: recv.message,
      //   });
      // }
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
    updateBlock(blockFeId, blockElType, blockContent, previousId, parentId) {
      if (!blockFeId) {
        return false;
      }
      console.info(parentId);

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
      console.error("found >> ", found);
      if (found) {
        // block의 생성, 수정, 삭제 (create, update, delete)
        return "UPDATE_BLOCK";
      } else {
        this.pushBlockFeIdsActions(targetBlockFeId);
        return "CREATE_BLOCK";
      }
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
zz
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

<template>
  <div class="channelInsideContainer">
    <ChannelCommonMenu
      v-if="
        this.$route.name == 'CanvasView' ||
        this.$route.name == 'CanvasEmptyView'
      "
      :menu="'canvas'"
      :channelId="channelId"
    />
    <div class="channelInsideContentWrap">
      <v-alert
        v-if="isCanvasDelete"
        color="error"
        icon="$error"
        title="안내"
        text="현재 캔버스는 삭제된 캔버스 입니다."
      ></v-alert>
      <v-row class="canvasContatiner ma-0">
        <v-col cols="2" class="canvasListContainer pa-0">
          <CanvasListComponent @updateCanvasId="updateCanvasId" />
          <!-- <v-list class="h-100">
            <v-list-item prepend-icon="mdi-home">Home</v-list-item>

            Users 그룹
            <v-list-group v-model="open[0]" value="Users">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-account-circle">
                  Users
                </v-list-item>
              </template>

              Admin 그룹 
              <v-list-group v-model="open[1]" value="Admin">
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props"> Admin </v-list-item>
                </template>

                <v-list-item
                  v-for="([title, icon], i) in admins"
                  :key="i"
                  :prepend-icon="icon"
                >
                  {{ title }}
                </v-list-item>
              </v-list-group>

              Actions 그룹
              <v-list-group v-model="open[2]" value="Actions">
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props"> Actions </v-list-item>
                </template>

                <v-list-item
                  v-for="([title, icon], i) in cruds"
                  :key="i"
                  :prepend-icon="icon"
                >
                  {{ title }}
                </v-list-item>
              </v-list-group>
            </v-list-group>
          </v-list> -->
        </v-col>
        <v-col class="canvasDetailContainer pa-0">
          <v-progress-circular
            v-if="isLoading && canvasId == null"
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="nodataWrap" v-else-if="canvasId == null">
            <div>
              <img src="@/assets/images/logo_coconote.png" alt="coconote logo" />
              <h1>캔버스가 없습니다.</h1>
            </div>
          </div>
          <CanvasDetailComponent v-else :canvasId="canvasId" :key="canvasId" />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import CanvasListComponent from "@/components/canvas/CanvasListComponent.vue";
import CanvasDetailComponent from "@/components/canvas/CanvasDetailComponent.vue";

import { mapGetters } from "vuex";

// socket용 import
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

export default {
  props: {
    splitCanvasId: {
      type: String,
      required: true,
    },
  },
  components: {
    ChannelCommonMenu,
    CanvasListComponent,
    CanvasDetailComponent,
  },
  computed: {
    ...mapGetters([
      "getWorkspaceMemberId",
      // socket용 vuex
      "getCanvasAllInfo",
      "getPageInfoForComponent",
    ]),
  },
  async created() {
    this.channelId = this.$route.params.channelId;
    if (this.channelId == "" || this.channelId == undefined) {
      alert("잘못된 접근입니다.");
      return false;
    }
    this.authToken = localStorage.getItem("accessToken");
    if (this.$route.name === "CanvasView") {
      // URL에서 canvasId를 가져옴
      this.canvasId = this.$route.params.canvasId;
    } else if(this.splitCanvasId) {
      // props로 전달된 splitCanvasId 사용
      this.canvasId = this.splitCanvasId;
    }

    this.connect();
  },
  watch: {
    getCanvasAllInfo: {
      handler(newVal) {
        if (newVal.page != "VIEW") {
          return false;
        }

        if (newVal.postMessageType == "CANVAS") {
          if (newVal.method == "CREATE_CANVAS") {
            this.sendMessageCanvas();
          } else if (newVal.method == "UPDATE_CANVAS") {
            this.sendMessageCanvas();
          } else if (newVal.method == "CHANGE_ORDER_CANVAS") {
            this.sendMessageCanvas();
          } else if (newVal.method == "DELETE_CANVAS") {
            //삭제 캔버스
            this.isCanvasDelete = true;
            this.sendMessageCanvas();
          } else {
            console.error("잘못된 canvas method 입니다.", newVal);
          }
        } else if (newVal.postMessageType == "BLOCK") {
          if (newVal.canvasId != this.canvasId) {
            return false;
          }

          let isReturn = true; // 같은 event 실행 안하기 위한 조건문 추가

          if (
            this.latestWatchBlockMsg.blockFeId == newVal.blockFeId &&
            this.latestWatchBlockMsg.method == newVal.method &&
            this.latestWatchBlockMsg.blockContents == newVal.blockContents
          ) {
            if(newVal.method == "UPDATE_INDENT_BLOCK"){
              if(newVal.blockIndent == this.latestWatchBlockMsg.blockIndent){
                console.error("🤔🤔🤔🤔🤔 3333", this.latestWatchBlockMsg, newVal);
                isReturn = false;
              }
            }else{
              console.error("🤔🤔🤔🤔🤔", this.latestWatchBlockMsg, newVal);
              isReturn = false;
            }
          }

          this.latestWatchBlockMsg.blockFeId = newVal.blockFeId;
          this.latestWatchBlockMsg.method = newVal.method;
          this.latestWatchBlockMsg.blockContents = newVal.blockContents;
          this.latestWatchBlockMsg.blockIndent = newVal.blockIndent;

          console.error(
            "🤔🤔🤔🤔🤔22222",
            this.latestWatchBlockMsg,
            newVal,
            isReturn
          );

          if (!isReturn) {
            return false;
          }

          if (!newVal.blockFeId) {
            return false;
          }

          if (newVal.method == "CREATE_BLOCK") {
            this.sendMessageCanvas();
          } else if (newVal.method == "HOT_UPDATE_CONTENTS_BLOCK") {
            this.sendMessageCanvas();
          } else if (newVal.method == "UPDATE_BLOCK") {
            this.sendMessageCanvas();
          } else if (newVal.method == "UPDATE_INDENT_BLOCK") {
            this.sendMessageCanvas();
          } else if (newVal.method == "CHANGE_ORDER_BLOCK") {
            console.log("CHANGE_ORDER_BLOCK 예정");
            this.sendMessageCanvas();
          } else if (newVal.method == "DELETE_BLOCK") {
            //삭제 캔버스
            this.sendMessageCanvas();
          } else if (newVal.method == "DEEP_DELETE_BLOCK") {
            //삭제 캔버스
            this.sendMessageCanvas();
          } else {
            console.error("잘못된 block method 입니다.", newVal);
          }
        } else {
          console.log("잘못된 postMessageType 입니다.", newVal);
        }
      },
      deep: true, // 깊은 상태 변화를 감지
    },
  },
  data() {
    return {
      isLoading: false,
      isCanvasDelete: false,
      channelId: null,
      canvasId: null, // 초기 canvasId 값
      canvasUpdateObj: null,
      latestWatchBlockMsg: {
        blockFeId: "",
        method: "",
        blockContents: "",
        blockIndent: "",
      }, // 중복 보냄을 방지하기 위해 마지막으로 보낸 block id와 block method 저장

      // websocket용도
      ws: null,
      sock: null,
      reconnect: 0,
      authToken: null,
    };
  },
  methods: {
    // 자식요소에게 전달해주는 메소드 -------- 시작
    updateCanvasId(newCanvasId) {
      this.isLoading = true;
      this.canvasId = newCanvasId;
      this.isCanvasDelete = false;
    },
    updateCanvasInfo(obj) {
      this.canvasUpdateObj = obj; // CanvasDetail에서 전달된 이름으로 업데이트
      if (obj.method && obj.method == "delete") {
        this.isCanvasDelete = true;
      }
    },
    // 자식요소에게 전달해주는 메소드 -------- 종료
    connect() {
      if (!this.channelId) {
        return false;
      }
      this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
      this.ws = Stomp.over(this.sock);
      this.ws.connect(
        { Authorization: this.authToken },
        () => {
          this.ws.subscribe(`/sub/canvas/room/${this.channelId}`, (message) => {
            const recv = JSON.parse(message.body);
            this.recvCanvasMessage(recv);
          });
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
    },
    // 실제 socket에 message를 전송하는 영역
    sendMessageCanvas() {
      if (this.ws && this.ws.connected) {
        const postMessage = {...this.getCanvasAllInfo};
        postMessage.channelId = this.channelId;
        if(postMessage.workspaceMemberId){
          postMessage.workspaceMemberId = this.getWorkspaceMemberId;
        }
        this.ws.send(
          `/pub/canvas/message`,
          { Authorization: this.authToken },
          JSON.stringify(postMessage)
        );
        this.canvasMessage = "";
      }
    },

    // socket에서 메시지를 전달받는 부분
    async recvCanvasMessage(recv) {
      let setInfoObj = {};
      const pageReset = {
        page: "",
      };
      await this.$store.dispatch("setInfoMultiTargetAction", pageReset); // 값을 보내기 위해 page null로 초기화

      if (recv.method == "CREATE_CANVAS") {
        setInfoObj = {
          postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
          page: "LIST", // 이 이벤트를 받아야하는 타겟 페이지
          postEventPage: "VIEW", // 이 이벤트를 호출한 페이지
          method: "CREATE_CANVAS",

          canvasId: recv.canvasId,
          channelId: recv.channelId,
          canvasTitle: recv.canvasTitle,
          parentCanvasId: recv.parentCanvasId,
          prevCanvasId: recv.prevCanvasId,
          nextCanvasId: recv.nextCanvasId,
        };
      } else if (recv.method == "UPDATE_CANVAS") {
        setInfoObj = {
          postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
          page: "LIST&DETAIL", // 이 이벤트를 받아야하는 타겟 페이지
          postEventPage: "VIEW", // 이 이벤트를 호출한 페이지
          method: "UPDATE_CANVAS",

          canvasId: recv.canvasId,
          channelId: recv.channelId,
          canvasTitle: recv.canvasTitle,
          parentCanvasId: recv.parentCanvasId,
          prevCanvasId: recv.prevCanvasId,
          nextCanvasId: recv.nextCanvasId,
        };
      } else if (recv.method == "CHANGE_ORDER_CANVAS") {
        console.error("recv", "CHANGE_ORDER_CANVAS");
      } else if (recv.method == "DELETE_CANVAS") {
        setInfoObj = {
          postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
          page: "LIST&DETAIL", // 이 이벤트를 받아야하는 타겟 페이지
          postEventPage: "VIEW", // 이 이벤트를 호출한 페이지
          method: "DELETE_CANVAS",

          canvasId: recv.canvasId,
        };
        if (recv.canvasId == this.canvasId) {
          this.isCanvasDelete = true;
        }
      } else if (
        recv.method == "CREATE_BLOCK" ||
        recv.method == "HOT_UPDATE_CONTENTS_BLOCK" || // content만 변경
        recv.method == "UPDATE_BLOCK" ||
        // recv.method == "PATCH_BLOCK" || // 일부 정보만 업데이트
        recv.method == "UPDATE_INDENT_BLOCK" ||
        recv.method == "CHANGE_ORDER_BLOCK" ||
        recv.method == "DELETE_BLOCK" || 
        recv.method == "DEEP_DELETE_BLOCK" 
      ) {
        if (recv.canvasId != this.canvasId) {
          return false;
        }
        if (!recv.blockFeId) {
          return false;
        }
        setInfoObj = {
          postMessageType: "BLOCK",
          page: "DETAIL",
          postEventPage: "VIEW", // 이 이벤트를 호출한 페이지
          method: recv.method,

          workspaceMemberId: recv.workspaceMemberId,
          channelId: recv.channelId,
          canvasId: recv.canvasId,

          blockId: recv.blockId,
          blockFeId: recv.blockFeId,
          prevBlockId: recv.prevBlockId,
          nextBlockId: recv.nextBlockId, // changeOrder 용도 전용
          parentBlockId: recv.parentBlockId,
          blockContents: recv.blockContents,
          blockType: recv.blockType,
          blockIndent: recv.blockIndent,
        };
      } else {
        return false;
      }

      this.$store.dispatch("setInfoMultiTargetAction", setInfoObj);
      // blockContents
      // blockFeId
      // blockId
      // blockType
      // canvasId
      // canvasTitle
      // channelId
      // isDeleted
      // method
      // nextBlockId
      // nextCanvasId
      // parentBlockId
      // parentCanvasId
      // postMessageType
      // prevBlockId
      // prevCanvasId
      // senderId
    },

    beforeRouteLeave() {
      if (this.sock) {
        this.sock.close(); // SockJS 연결을 닫음
        this.sock = null;
      }
      if (this.ws) {
        this.ws.disconnect(() => {});
        this.ws = null;
      }
    },
  },
  beforeUnmount() {
    if (this.ws) {
      this.ws.disconnect(() => {
        console.log("WebSocket ws connection closed.");
      });
    }
    this.beforeRouteLeave();
  },
};
</script>

<style lang="scss">
.canvasContatiner {
  height: 100%;

  .canvasListContainer {
    display: flex;
    flex-direction: column;
    height: 100%;
    > * {
      background: #f7f7f7;
    }
    .v-list-item__content {
      overflow: visible;
    }
  }
  .canvasDetailContainer {
    height: 100%;
    overflow: auto;
  }
  .nodataWrap{
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    height: 100%;
    color: #435088;
    text-align: center;
    img{
      width: 80vw;
      max-width: 120px;
    }
  }
}
</style>

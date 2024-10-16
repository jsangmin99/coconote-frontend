<template>
  <div class="channelInsideContainer">
    <ChannelCommonMenu :menu="'canvas'" :channelId="channelId" />
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
          <CanvasListComponent
            @updateCanvasId="updateCanvasId"
          />
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
          <div v-else-if="canvasId == null">
            <h1>캔버스가 없습니다.</h1>
          </div>
          <CanvasDetailComponent
            v-else
            :canvasId="canvasId"
            :key="canvasId"
          />
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
    channelId: {
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
      // socket용 vuex
      "getCanvasAllInfo",
    ]),
  },
  async created() {
    this.channelId = this.$route.params.channelId;
    if (this.channelId == "" || this.channelId == undefined) {
      alert("잘못된 접근입니다.");
      return false;
    }
    this.canvasId = this.$route.params.canvasId;
    await this.beforeRouteLeave();
    this.connect();
  },
  watch: {
    getCanvasAllInfo: {
      handler(newVal) {
        console.error("store가 업데이트 되어서 view.vue 에서 수정해야하 : ", newVal);
        // canvasInfo 변경 시 동작할 코드 작성
        // if (newVal.method == "update") {
        //   this.updateCanvasInfo(newVal);
        // }else if(newVal.method == "delete"){
        //   this.updateCanvasInfo(newVal);
        // }
      },
      deep: true, // 깊은 상태 변화를 감지
    },
  },
  data() {
    return {
      isLoading: false,
      isCanvasDelete: false,
      canvasId: null, // 초기 canvasId 값
      canvasUpdateObj: null,

      // websocket용도
      ws: null,
      sock: null,
      reconnect: 0,
    };
  },
  methods: {
    // 자식요소에게 전달해주는 메소드 -------- 시작
    updateCanvasId(newCanvasId) {
      this.isLoading = true;
      console.log("canvasId 변경!", newCanvasId);
      this.canvasId = newCanvasId;
      this.isCanvasDelete = false;
    },
    updateCanvasInfo(obj) {
      console.log("canvas 정보!! 변경!", obj);
      this.canvasUpdateObj = obj; // CanvasDetail에서 전달된 이름으로 업데이트
      if (obj.method && obj.method == "delete") {
        this.isCanvasDelete = true;
      }
    },
    // 자식요소에게 전달해주는 메소드 -------- 종료
    connect() {
      this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
      this.ws = Stomp.over(this.sock);
      this.ws.connect(
        {},
        () => {
          this.ws.subscribe(
            `/sub/canvas/room/${this.canvasId}`,
            (message) => {
              const recv = JSON.parse(message.body);
              console.error("sub!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", recv);
              this.recvCanvasMessage(recv);
            }
          );
          this.ws.send(
            `/pub/canvas/message`,
            {},
            JSON.stringify({
              type: "ENTER",
              roomId: this.canvasId,
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
    },

    // 실제 socket에 message를 전송하는 영역
    sendMessageCanvas() {
      if (this.ws && this.ws.connected) {
        const postMessage = 
        this.ws.send(
          `/pub/canvas/message`,
          {},
          JSON.stringify({
            type: "CANVAS",
            roomId: this.canvasId,
            sender: this.sender,
            message: JSON.stringify(this.canvasMessage),
          })
        );
        this.canvasMessage = "";
      } else {
        // console.log("WebSocket is not connected.");
      }
    },
    
    // socket에서 메시지를 전달받는 부분
    recvCanvasMessage(recv) {
      console.error("recv >>> ", recv);
      
    },


    beforeRouteLeave() {
      console.error("before 테스트 1")
      if (this.sock) {
        this.sock.close(); // SockJS 연결을 닫음
        this.sock = null;
        console.log("WebSocket subscription unsubscribed.");
      }
      if (this.ws) {
        this.ws.disconnect(() => {
          console.log("WebSocket ws connection closed.");
        });
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
}
</style>

<template>
  <v-list class="h-100">
    <v-list-item
      prepend-icon="mdi-note-text-outline"
      v-for="item in chatrooms"
      :key="item.id"
      :data-id="item.id"
      @click="changeCanvasId(item.id)"
    >
      {{ item.title }}
    </v-list-item>
    <v-list-item class="list-create">
      <v-text-field
        color="primary"
        density="compact"
        class="form-control"
        variant="underlined"
        v-model="canvasName"
        @keyup.enter="createCanvas"
      ></v-text-field>
    </v-list-item>
  </v-list>
</template>

<script>
import axios from "axios";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

export default {
  name: "CanvasListComponent",
  props: {
    canvasUpdateObj: Object, // 부모로부터 전달받은 값 사용
  },
  watch: {
    // canvasName의 변화를 감지
    canvasUpdateObj(obj) {
      this.onCanvasInfoChanged(obj);
    },
  },
  created() {
    this.channelId = this.$route.params.channelId;
    if (this.channelId == "" || this.channelId == undefined) {
      alert("잘못된 접근입니다.");
      return false;
    }
    this.findAllRoom();
  },
  data() {
    return {
      canvasName: "",
      canvasIdInList: null,
      channelId: null,
      chatrooms: [],

      // socket 통신용

      ws: null,
      sock: null,
    };
  },
  methods: {
    findAllRoom() {
      axios
        .get(
          `${process.env.VUE_APP_API_BASE_URL}/canvas/${this.channelId}/list`
        )
        .then((response) => {
          this.chatrooms = response.data.result.content;
          if (this.chatrooms.length > 0) {
            this.changeCanvasId(response.data.result.content[0].id); // 첫번째 id 자동선택
          }
        });
    },
    createCanvas() {
      if (this.canvasName === "") {
        alert("캔버스 제목을 입력해 주십시요.");
        return;
      } else {
        const params = {
          title: this.canvasName,
          parentCanvasId: null,
          channelId: this.$route.params.channelId,
        };
        axios
          .post(`${process.env.VUE_APP_API_BASE_URL}/canvas/create`, params)
          .then(() => {
            this.canvasName = "";
            this.findAllRoom();
          })
          .catch(() => {
            alert("채팅방 개설에 실패하였습니다.");
          });
      }
    },
    changeCanvasId(canvasId) {
      const sender = "테스트유저 " + Date.now();
      if (sender) {
        console.log("changeCanvasId!!", canvasId);
        this.canvasIdInList = canvasId;
        this.$emit("updateCanvasId", canvasId);
      }
    },
    onCanvasInfoChanged(obj) {
      // 캔버스 정보가 변경되었을 때 실행할 로직
      console.log("obj >> ", obj);
      if (obj.name) {
        const targetCanvas = this.chatrooms.find(
          (item) => item.id === this.canvasIdInList
        );

        if (targetCanvas) {
          targetCanvas.title = obj.name; // 리스트 항목의 title을 업데이트
        }
      } else if (obj.method && obj.method == "deleteCanvas") {
        const targetIndex = this.chatrooms.findIndex(
          (item) => item.id === obj.canvasId
        );

        if (targetIndex !== -1) {
          // 해당 인덱스의 항목을 배열에서 삭제
          this.chatrooms.splice(targetIndex, 1);
          console.log(`Canvas ID ${obj.canvasId}가 목록에서 삭제되었습니다.`);
        }
      }
    },
    connect() {
      // 캔버스 소켓 연결
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
        const canvasJson = JSON.parse(recv.message);
        console.error("canvasJson >> ", canvasJson);
      }
    },
    beforeRouteLeave() {
      // 컴포넌트가 파괴되기 전에 구독 해제 및 WebSocket 연결 종료
      if (this.sock) {
        this.sock.close(); // SockJS 연결을 닫음
        this.sock = null;
        console.log("WebSocket subscription unsubscribed.");
      }
      if (this.ws) {
        this.ws.disconnect(() => {
          console.log("WebSocket connection closed.");
        });
      }
    },
  },
  beforeUnmount() {
    this.beforeRouteLeave();
  },
};
</script>

<style scoped>
[v-cloak] {
  display: none;
}
</style>

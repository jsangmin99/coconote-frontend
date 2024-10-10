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
// import { useRouter } from "vue-router";

export default {
  name: "CanvasListComponent",
  props: {
    canvasUpdateName: String, // 부모로부터 전달받은 값 사용
  },
  watch: {
    // canvasName의 변화를 감지
    canvasUpdateName(newName) {
      this.onCanvasNameChanged(newName);
    },
  },
  created() {
    this.channelId = this.$route.params.channelId;
    console.error();
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
    onCanvasNameChanged(newName) {
      // 캔버스 이름이 변경되었을 때 실행할 로직
      const targetCanvas = this.chatrooms.find((item) => item.id === this.canvasIdInList);

      if (targetCanvas) {
        targetCanvas.title = newName; // 리스트 항목의 title을 업데이트
      }
    },
  },
};
</script>

<style scoped>
[v-cloak] {
  display: none;
}
</style>

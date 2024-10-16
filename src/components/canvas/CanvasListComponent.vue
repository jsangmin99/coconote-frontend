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
import { mapGetters, mapActions } from "vuex";

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
    getPageInfoForComponent: {
      handler(newVal) {
        console.error(
          "페이지 변경 list에서 감지!!!!!!!!!!!!!!!!!! :",
          newVal,
        );
        // canvasInfo 변경 시 동작할 코드 작성
        // if (newVal.method == "create") {
        //   console.log("create 예정");
        //   this.findAllRoom();
        // } else if (newVal.method == "update") {
        //   console.log("update 예정");
        //   this.sendMessageUpdate();
        // } else if (newVal.method == "changeOrder") {
        //   console.log("순서변경 예정");
        //   this.findAllRoom();
        // } else if (newVal.method == "delete") {
        //   console.log("삭제 예정");
        //   this.sendMessageDelete(newVal);
        // } else {
        //   console.error("잘못된 method로 접근했습니다.");
        // }
      },
      deep: true, // 깊은 상태 변화를 감지
    },
  },
  computed: {
    ...mapGetters([
      "getChannelId",
      // canvas용 vuex
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
    console.error("before 테스트 2")
    this.isFirst = true;
    this.findAllRoom();
  },
  data() {
    return {
      canvasName: "",
      canvasIdInList: null,
      channelId: null,
      chatrooms: [],
      isFirst: true,
      sender: null,

      canvasMessage: "",
      canvasMessages: [],
    };
  },
  methods: {
    ...mapActions(["setCanvasAllInfoAction", "setInfoMultiTargetAction"]),
    findAllRoom() {
      axios
        .get(
          `${process.env.VUE_APP_API_BASE_URL}/canvas/${this.channelId}/list`
        )
        .then((response) => {
          this.chatrooms = response.data.result.content;
          if (this.chatrooms.length > 0 && this.isFirst) {
            if (
              this.$route.params.canvasId &&
              this.$route.params.canvasId > 0
            ) {
              this.changeCanvasId(this.$route.params.canvasId); // url id 선택
            } else {
              this.changeCanvasId(response.data.result.content[0].id); // 첫번째 id 자동선택
            }
            this.isFirst = false;
          }
        });
    },
    async createCanvas() {
      if (this.canvasName === "") {
        alert("캔버스 제목을 입력해 주십시요.");
        return;
      } else {
        let prevCanvasId = null;
        if (this.chatrooms && this.chatrooms.length > 0) {
          prevCanvasId = this.chatrooms[this.chatrooms.length - 1].id;
        }
        const params = {
          title: this.canvasName,
          parentCanvasId: null,
          prevCanvasId: prevCanvasId,
          channelId: this.$route.params.channelId,
        };

        try {
          const response = await axios.post(
            `${process.env.VUE_APP_API_BASE_URL}/canvas/create`,
            params
          );
          console.log(response);
          const targetRes = response.data.result;
          this.canvasName = "";

          // this.$store.dispatch("setCanvasAllInfoAction", {
          //   method: "create",
          //   title: targetRes.title,
          //   canvasId: targetRes.canvasId,
          //   parentCanvasId: targetRes.parentCanvasId,
          //   prevCanvasId: targetRes.prevCanvasId,
          //   nextCanvasId: targetRes.nextCanvasId,
          //   member: targetRes.member,
          // });

          this.$store.dispatch("setInfoTargetAction", {

          });

          // this.findAllRoom();
        } catch (error) {
          alert("채팅방 개설에 실패하였습니다.");
        }
      }
    },
    changeCanvasId(canvasId) {
      const sender = "테스트유저 " + Date.now();
      if (sender) {
        console.log("changeCanvasId!!", canvasId);
        this.canvasIdInList = canvasId;
        this.$emit("updateCanvasId", canvasId);
        this.$router.push(
          `/channel/${this.getChannelId}/canvas/view/${canvasId}`
        );
      }
    },
    onCanvasInfoChanged(obj) {
      // 캔버스 정보가 변경되었을 때 실행할 로직
      console.log("obj >> ", obj);
      if (obj.method == "nameChange") {
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
      } else if (obj.method && obj.method == "update") {
        this.findAllRoom();
      }
    },
    
    sendMessageUpdate(obj) {
      // 이름이 변경되었을 때
      console.error("canvas update component >> ", obj, obj.canvasId);
      this.canvasMessage = {
        channelId: this.$route.params.channelId,
        method: "update",
        canvasId: this.$route.params.canvasId,
        title: obj.title,
      };
      console.log(this.canvasMessage);
    },
    sendMessageDelete(obj) {
      console.error("list component >> ", obj, obj.canvasId);
      this.canvasMessage = {
        channelId: this.$route.params.channelId,
        method: "delete",
        canvasId: this.$route.params.canvasId,
      };
      console.log(this.canvasMessage);
      // channelId;
      // parentCanvasId = null;
      // prevCanvasId = null;
      // nextCanvasId = null;
      // method;
      // canvasId;
      // title = null;
      // member;

    },
  },
};
</script>

<style scoped>
[v-cloak] {
  display: none;
}
</style>

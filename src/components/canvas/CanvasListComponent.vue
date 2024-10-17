<template>
  <v-list class="h-100">
    <v-list-item
      prepend-icon="mdi-note-text-outline"
      v-for="item in chatrooms"
      :key="item.id"
      :data-id="item.id"
      @click="changeCanvasId(item.id)"
      :class="{ active: this.canvasIdInList === item.id }"
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
    // canvasUpdateObj(obj) {
    //   this.onCanvasInfoChanged(obj);
    // },
    getPageInfoForComponent: {
      handler(newVal) {
        // canvasInfo 변경 시 동작할 코드 작성
        if (newVal == "LIST&DETAIL" || newVal == "LIST") {
          this.getCanvasAllInfo_inList = this.getCanvasAllInfo;
          if (this.getCanvasAllInfo_inList.method == "CREATE_CANVAS") {
            setTimeout(() => {
              this.findAllRoom();
              this.canvasName = "";
            }, 1000);
          } else if (this.getCanvasAllInfo_inList.method == "UPDATE_CANVAS") {
            this.onCanvasInfoChanged();
          } else if (this.getCanvasAllInfo_inList.method == "CHANGE_ORDER_CANVAS") {
            this.changeOrderInList();
          } else if (this.getCanvasAllInfo_inList.method == "DELETE_CANVAS") {
            this.canvasDeleteInList();
          } else {
            console.error("List 에서는 사용 X 혹은 잘못된 method");
          }
        }
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
      getCanvasAllInfo_inList: null,
    };
  },
  methods: {
    ...mapActions(["setCanvasAllInfoAction", "setInfoMultiTargetAction"]),
    findAllRoom() {
      axios
        .get(`${process.env.VUE_APP_API_BASE_URL}/canvas/${this.channelId}/list`)
        .then((response) => {
          this.chatrooms = response.data.result.content;
          if (this.chatrooms.length > 0 && this.isFirst) {
            if (this.$route.params.canvasId && this.$route.params.canvasId > 0) {
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
        // let prevCanvasId = null;
        // if (this.chatrooms && this.chatrooms.length > 0) {
        //   prevCanvasId = this.chatrooms[this.chatrooms.length - 1].id;
        // }
        // const params = {
        //   canvasTitle: this.canvasName,
        //   parentCanvasId: null,
        //   prevCanvasId: prevCanvasId,
        //   channelId: this.$route.params.channelId,
        // };

        try {
          // const response = await axios.post(
          //   `${process.env.VUE_APP_API_BASE_URL}/canvas/create`,
          //   params
          // );
          // console.log(response);
          // const targetRes = response.data.result;
          // this.canvasName = "";

          // this.$store.dispatch("setCanvasAllInfoAction", {
          //   method: "create",
          //   title: targetRes.title,
          //   canvasId: targetRes.canvasId,
          //   parentCanvasId: targetRes.parentCanvasId,
          //   prevCanvasId: targetRes.prevCanvasId,
          //   nextCanvasId: targetRes.nextCanvasId,
          //   member: targetRes.member,
          // });
          let prevCanvasId = null;
          if (this.chatrooms && this.chatrooms.length > 0) {
            prevCanvasId = this.chatrooms[this.chatrooms.length - 1].id;
          }
          const setInfoObj = {
            postMessageType: "CANVAS", // 현 이벤트가 canvas 인지 block인지 구분
            page: "VIEW", // 이 이벤트를 받아야하는 타겟 페이지
            postEventPage: "LIST", // 이 이벤트를 호출한 페이지
            method: "CREATE_CANVAS",

            // canvasId: targetRes.canvasId,
            channelId: this.$route.params.channelId,
            canvasTitle: this.canvasName,
            parentCanvasId: null,
            prevCanvasId: prevCanvasId,
            nextCanvasId: null,
          };

          this.$store.dispatch("setInfoMultiTargetAction", setInfoObj);

          // this.findAllRoom();
        } catch (error) {
          alert("채팅방 개설에 실패하였습니다.");
        }
      }
    },
    changeCanvasId(canvasId) {
      const sender = "테스트유저 " + Date.now();
      if (sender) {
        this.canvasIdInList = canvasId;
        this.$emit("updateCanvasId", canvasId);
        if(this.$route.name == "CanvasView" || this.$route.name == "CanvasEmptyView"){
          this.$router.push(`/channel/${this.getChannelId}/canvas/view/${canvasId}`);
        }
      }
    },
    onCanvasInfoChanged() {
      // 캔버스 정보가 변경되었을 때 실행할 로직
      const targetCanvas = this.chatrooms.find(
        (item) => item.id === this.getCanvasAllInfo_inList.canvasId
      );
      if (targetCanvas) {
        targetCanvas.title = this.getCanvasAllInfo_inList.canvasTitle; // 리스트 항목의 title을 업데이트
      }
    },
    changeOrderInList() {
      console.log("change order... ⭐");
    },
    canvasDeleteInList() {
      const targetIndex = this.chatrooms.findIndex(
        (item) => item.id === this.getCanvasAllInfo_inList.canvasId
      );

      if (targetIndex !== -1) {
        // 해당 인덱스의 항목을 배열에서 삭제
        this.chatrooms.splice(targetIndex, 1);
      }
    },
  },
};
</script>

<style lang="scss">
[v-cloak] {
  display: none;
}
.canvasListContainer{
  .active{
    background-color: #e3e3e3;
  }
}
</style>

<template>
  <div class="channelInsideContainer">
    <div class="channelInsideContentWrap">
      <h1>channel View Test</h1>
      <div>
        <h2>
          id : <span>{{ this.$store.getters.getChannelId }}</span>
        </h2>
        <v-btn @click="channelMemberCreate">채널 참여</v-btn>
        <v-btn
          @click="
            this.$router.push(
              `/channel/${this.$store.getters.getChannelId}/thread/view`
            )
          "
          >쓰레드로 이동</v-btn
        >
        <v-btn
          @click="
            this.$router.push(
              `/channel/${this.$store.getters.getChannelId}/canvas/view`
            )
          "
          >캔버스로 이동</v-btn
        >
        <v-btn
          @click="
            this.$router.push(
              `/channel/${this.$store.getters.getChannelId}/drive/view`
            )
          "
          >드라이브로 이동</v-btn
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import axios from "@/services/axios";
import { fetchChannelMemberInfo } from "@/services/channelService"; // 모듈 import

export default {
  components: {},
  data() {
    return {};
  },
  channelId(newVal) {
    if (newVal) {
      console.log("channelId가 설정되었습니다:!!", newVal);
      // 여기서 채널 상태가 설정된 이후 작업을 진행
    }
  },
  computed: {
    ...mapGetters(["getChannelId", "getChannelName"]), // Vuex getter 매핑
  },
  mounted() {
    const isJoinCheck = this.$route.query.isJoin;
    console.error("@@@@@isJoinCheck", isJoinCheck); // isJoinCheck 출력
    if (isJoinCheck == undefined || isJoinCheck == null || isJoinCheck == "") {
      // isJoin을 체크 안한 것 (채널과 채널 이동을 안한 것)
      this.checkMemberIsJoin();
    }
    if (!this.getChannelId) {
      console.log("없다...");
      // 처음 로딩 시점에 channelId가 없다면 로직 실행
    }
  },
  methods: {
    ...mapActions([
      "setChannelRoleInfoActions",
    ]),
    // 채널 참여 메서드
    async channelMemberCreate() {
      this.loading = true;
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/channel/member/create/${this.getChannelId}`
        );
        alert(response.data.status_message); // 성공 메시지 출력
      } catch (error) {
        console.error("채널 가입 실패:", error);
        alert("채널 가입에 실패했습니다.");
      } finally {
        this.loading = false;
      }
    },
    async checkMemberIsJoin() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/channel/${this.getChannelId}/isjoin`
      );

      const isJoin = response.data.result;
      if (isJoin) {
        const result = await fetchChannelMemberInfo(this.getChannelId);
        if (result) {
          this.setChannelRoleInfoActions(result.channelRole);
        }
        this.$router.push(`/channel/${this.getChannelId}/thread/view`);
      }
    },
  },
};
</script>

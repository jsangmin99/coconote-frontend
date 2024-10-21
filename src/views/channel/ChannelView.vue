<template>
  <div class="channelInsideContainer">
    <div class="channelInsideContentWrap">
      <div class="channelViewContainer">
        <div class="inner">
          <div class="img_area">
            <img src="@/assets/images/logo_coconote.png" alt="coconote logo" />
          </div>
          <h1>환영합니다!</h1>
          <p class="desc">
            <v-chip color="grey-lighten-3" variant="flat">
              <span>{{ this.$store.getters.getChannelName }}</span> 채널
            </v-chip>
            참여하시겠습니까?
          </p>
          <div class="btn_area">
            <v-btn
              rounded="xl"
              size="x-large"
              block
              variant="flat"
              @click="channelMemberCreate"
              style="width:50vw;"
              color="blue-lighten-4"
              >채널 참여</v-btn
            >
          </div>
        </div>
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
    return {
      isJoin: null,
    };
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
    ...mapActions(["setChannelRoleInfoActions", "setMemberInfoActions"]),
    // 채널 참여 메서드
    async channelMemberCreate() {
      this.loading = true;
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/channel/member/create/${this.getChannelId}`
        );
        const result = response.data.result;
        console.log("[ChannelView] channelMemberCreate() result : ", result);
        this.setChannelRoleInfoActions(result.channelRole);
        this.setMemberInfoActions(
          {
            nickname : result.memberInfo.nickname,
            workspaceMemberId : result.memberInfo.workspaceMemberId,
            profileImage : result.memberInfo.profileImage,
            wsRole : result.memberInfo.wsRole
          });
        // this.$router.push(`/channel/${this.getChannelId}/thread/view`);
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

<style lang="scss">
.channelViewContainer {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  .inner {
    text-align: center;
  }
  h1 {
    font-size: 3rem;
    color: #435088;
    margin-bottom: 24px;
  }
  p.desc {
    margin-bottom: 32px;
    span {
      margin-right: 4px;
    }
  }
  .img_area {
    img {
      width: 90%;
      max-width: 15vw;
      min-width: 150px;
    }
  }
  .h1 {
  }
}
</style>
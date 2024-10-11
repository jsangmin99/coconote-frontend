<template>
  <v-dialog v-model="dialog" width="auto" persistent>
    <v-card
      max-width="400"
      text="입장하고자 하는 워크스페이스의 정보가 존재하지 않습니다."
      title="워크스페이스 없음"
    >
      <template v-slot:actions>
        <v-btn class="ms-auto" text="확인" @click="locationToHomeRouter"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  components: {},
  data() {
    return {
      workspaceId: null,
      dialog: false,
    };
  },
  computed: {},
  created() {
    this.getMyFirstWorkspace();
  },
  methods: {
    ...mapActions([
      "setWorkspaceInfoActions",
      "setWorkspaceNameInfoActions",
      "setMemberInfoActions", // 추가: 멤버 정보를 저장하는 Vuex 액션
      "setChannelInfoActions",
      "setChannelNameInfoActions",
      "setChannelDescInfoActions",
      "setChannelRoleInfoActions",
    ]),

    // 워크스페이스 정보를 가져오는 메소드
    async getMyFirstWorkspace() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/workspace/first`
      );
      console.log(response);
      if (!response.data.result) {
        // 해당 유저의 workspace가 존재하지 않을 때
        this.dialog = true;
        return false;
      }
      const firstData = response.data.result;
      this.workspaceId = firstData.workspaceId;

      // Vuex store에 워크스페이스 정보 업데이트
      this.setWorkspaceInfoActions(firstData.workspaceId);
      this.setWorkspaceNameInfoActions(firstData.name);

      // 멤버 정보 가져오기 추가
      await this.getMemberInfo();

      // 첫 번째 채널 정보 가져오기
      this.getMyFirstChannelInWorkspace();
    },

    // 멤버 정보를 가져와 Vuex에 저장하는 메소드 추가
    async getMemberInfo() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/member/${this.workspaceId}`
        );

        if (response.data.result) {
          const memberInfo = {
            workspaceMemberId: response.data.result.workspaceMemberId,
            profileImage: response.data.result.profileImage,
            nickname: response.data.result.nickname,
            name: response.data.result.name,
            wsRole: response.data.result.wsRole,
          };
          this.setMemberInfoActions(memberInfo); // Vuex에 멤버 정보 저장
        }
      } catch (error) {
        console.error("Error fetching member info:", error);
      }
    },

    // 채널 정보를 가져오는 메소드
    async getMyFirstChannelInWorkspace() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/${this.workspaceId}/channel/first` // 채널 정보 API
      );
      this.setChannelInfoActions(response.data.result.channelId);
      this.setChannelNameInfoActions(response.data.result.channelName);
      this.setChannelDescInfoActions(response.data.result.channelInfo);


      const chMember = await axios.get( // 채널 권한 정보
      `${process.env.VUE_APP_API_BASE_URL}/member/me/channel/${response.data.result.channelId}` 
      );
      this.setChannelRoleInfoActions(chMember.data.result.channelRole);

      this.$router.push(`/channel/${response.data.result.channelId}`);

    },

    // 홈으로 리다이렉트
    locationToHomeRouter() {
      this.$router.push(`/`);
    },
  },
};
</script>

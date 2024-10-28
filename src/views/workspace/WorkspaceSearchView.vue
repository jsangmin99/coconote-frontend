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
import { fetchChannelMemberInfo } from "@/services/channelService"; // 모듈 import

export default {
  components: {},
  data() {
    return {
      workspaceId: null,
      dialog: false,
    };
  },
  computed: {},
  mounted() {
    this.searchMyWorkspace();
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
    async searchMyWorkspace() {
      // localStorage에 ws 정보 체크 후 분기처리
      const lsWsId = localStorage.getItem("workspaceId");
      // console.log("[WorkspaceSearchView] 생성 후 workspace로 이동 완료 >> ", lsWsId);
      if (lsWsId != "" && lsWsId != undefined && lsWsId != null) {
        // console.log("[WorkspaceSearchView] 이미 workspace가 있음!!");
        this.workspaceId = lsWsId;
        const lsWsName = localStorage.getItem("workspaceName");
        await this.setWorkspaceInfoActions(lsWsId);
        await this.setWorkspaceNameInfoActions(lsWsName);
        await this.getMyFirstChannelInWorkspace();
        await this.getWorkspaceMemberInfo(this.workspaceId);
      } else {
        console.error("새로운 workspace~~");
        this.getMyFirstWorkspace();
      }
    },
    // 워크스페이스 정보를 가져오는 메소드
    async getMyFirstWorkspace() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/workspace/first`
      );
      // console.error("[WorkspaceSearchView] getMyFirstWorkspace().response", response);
      if (!response.data.result) {
        // 해당 유저의 workspace가 존재하지 않을 때
        this.dialog = true;
        return false;
      }
      const firstData = response.data.result;
      this.workspaceId = firstData.workspaceId;
      console.error(
        "[WorkspaceSearchView] getMyFirstWorkspace(). firstData.workspaceId : ",
        firstData.workspaceId
      );

      // Vuex store에 워크스페이스 정보 업데이트
      await this.setWorkspaceInfoActions(this.workspaceId);
      await this.setWorkspaceNameInfoActions(firstData.name);

      // 워크스페이스 멤버 정보 가져오기 추가
      await this.getWorkspaceMemberInfo(this.workspaceId);

      // 첫 번째 채널 정보 가져오기
      this.getMyFirstChannelInWorkspace();
    },

    // 멤버 정보를 가져와 Vuex에 저장하는 메소드 추가
    async getWorkspaceMemberInfo(workspaceId) {
      try {
        console.log(
          "[WorkspaceSearchView] getWorkspaceMemberInfo()./member/me/workspace/workspaceId : "
        );
        if(!workspaceId || workspaceId == undefined || workspaceId == ""){
          return false;
        }
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/member/me/workspace/${workspaceId}`
        );
        console.log(
          "[WorkspaceSearchView] getWorkspaceMemberInfo().response : ",
          response
        );
        if (response.data.result) {
          const memberInfo = {
            workspaceMemberId: response.data.result.workspaceMemberId,
            profileImage: response.data.result.profileImage,
            nickname: response.data.result.nickname,
            wsRole: response.data.result.wsRole,
          };
          console.log(
            "[WorkspaceSearchView] getMemberInfo() profileImage: ",
            response.data.result.profileImage
          );
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
      await this.setChannelInfoActions(response.data.result.channelId);
      await this.setChannelNameInfoActions(response.data.result.channelName);
      await this.setChannelDescInfoActions(response.data.result.channelInfo);
      this.channelId = response.data.result.channelId;
      //     this.$router.push({
      //   path: `/channel/${response.data.result.channelId}`,
      //   query: { t: response.data.result.channelId }, // 새로운 query 추가로 새로운 key처럼 작동
      // });
    },
    async getChannelMemberInfo(channelId) {
      const result = await fetchChannelMemberInfo(channelId); // 모듈로 함수 호출
      await this.setChannelRoleInfoActions(result.channelRole);
    },

    // 홈으로 리다이렉트
    locationToHomeRouter() {
      this.$router.push(`/`);
    },
  },
};
</script>

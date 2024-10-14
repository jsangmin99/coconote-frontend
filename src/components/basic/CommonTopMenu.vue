<template>
  <v-app-bar :elevation="2" class="topMenu" height="40">
    <v-app-bar-title class="title"> COCONOTE </v-app-bar-title>
    <template v-slot:append>
      <v-form @submit.prevent="emitSelected">
        <v-row>
          <v-col cols="auto">
            <v-select
              v-model="selectedValue"
              :items="items"
              item-title="name"
              item-value="workspaceId"
              outlined
              single-line
              hide-details
              dense
              class="inline"
              style="font-size: 0.9rem"
            ></v-select>
          </v-col>
          <v-col cols="auto">
            <v-btn type="submit">이동</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn icon @click="showWorkspaceModal">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </v-app-bar>
  <CreateWorkspaceModal
    v-model="createWorkspace"
    @update:dialog="createWorkspace = $event"
  >
  </CreateWorkspaceModal>
</template>

<script>
import axios from "axios";
import CreateWorkspaceModal from "@/components/basic/CreateWorkspaceModal.vue";
import { mapGetters, mapActions } from "vuex";

export default {
  computed: {
    ...mapGetters(["getWorkspaceId", "getWorkspaceName"]), // Vuex getter 매핑
  },
  name: "CommonTopMenu",
  components: {
    CreateWorkspaceModal,
  },
  data() {
    return {
      items: [],
      selectedValue: null,
      createWorkspace: false,
      isLoading: false,
      workspaceInfo: [],
    };
  },
  created() {
    this.selectedValue = this.$store.getters.getWorkspaceId;
    console.log("selectedValue >> ", this.selectedValue);
    this.fetchMyWorkspaceList();
  },
  methods: {
    ...mapActions([
      "setWorkspaceInfoActions",
      "setWorkspaceNameInfoActions",
      "setMemberInfoActions",
      "setChannelInfoActions",
      "setChannelNameInfoActions",
      "setChannelDescInfoActions",
      "setChannelRoleInfoActions",
    ]),
    async fetchMyWorkspaceList() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/list`
        );
        this.items = response.data.result; // 내 워크스페이스 목록 가져오기
        if (this.items.length > 0 && (this.selectedValue == "" || this.selectedValue == null)) {
          this.selectedValue = this.items[0].workspaceId; // 첫 번째 워크스페이스 ID 할당
          
        }
        this.emitSelected();
        this.isLoading = true;
      } catch (e) {
        console.log(e);
      }
    },
    async fetchWorkspaceInfo() {
      try {
        const wsInfo = await axios.get(
          // 워크스페이스 정보
          `${process.env.VUE_APP_API_BASE_URL}/workspace/info/${this.selectedValue}`
        );
        this.setWorkspaceInfoActions(wsInfo.data.result.workspaceId);
        this.setWorkspaceNameInfoActions(wsInfo.data.result.name);

        const response = await axios.get(
          // 내 워크스페이스 회원 정보
          `${process.env.VUE_APP_API_BASE_URL}/member/me/workspace/${this.selectedValue}`
        );
        const myInfo = {
          nickname: response.data.result.nickname,
          workspaceMemberId: response.data.result.workspaceMemberId,
          profileImage: response.data.result.profileImage,
          wsRole: response.data.result.wsRole,
        };
        this.setMemberInfoActions(myInfo);

        const chInfo = await axios.get(
          // 채널 정보
          `${process.env.VUE_APP_API_BASE_URL}/${this.selectedValue}/channel/first`
        );
        this.setChannelInfoActions(chInfo.data.result.channelId);
        this.setChannelNameInfoActions(chInfo.data.result.channelName);
        this.setChannelDescInfoActions(chInfo.data.result.channelInfo);


        const chMember = await axios.get( // 채널 권한 정보
        `${process.env.VUE_APP_API_BASE_URL}/member/me/channel/${chInfo.data.result.channelId}` 
        );
        this.setChannelRolerInfoActions(chMember.data.result.channelRole);

      this.isLoading = true;
      } catch (e) {
        console.log(e);
      }
    },
    async emitSelected() {
      this.$emit("selected", this.selectedValue);
      this.fetchWorkspaceInfo();
      // window.location.reload();
    },
    showWorkspaceModal() {
      this.createWorkspace = true;
      console.log(this.createWorkspace);
    },
  },
};
</script>

<style lang="scss">
.topMenu {
  &.v-toolbar {
    background-color: #383f4a !important;
    * {
      color: #fff;
    }
  }
  .title {
    font-size: 0.9rem; /* v-app-bar-title의 폰트 크기 설정 */
  }
  .v-select * {
    font-size: 0.8rem;
  }
}
</style>

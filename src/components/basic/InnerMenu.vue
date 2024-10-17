<template>
  <v-navigation-drawer class="innerMenu" theme="dark" permanent rail>
    <v-list density="compact" nav class="menu-container">
      <!-- 현재 접속해 있는 워크스페이스 -->
      <v-list-item
        prepend-icon="mdi-alpha-w-box"
        title="workspace"
        @click="toggleDropdown"
      ></v-list-item>
      <!-- 홈 하위 메뉴 버튼 -->
      <v-list-item
        prepend-icon="mdi-home"
        title="home"
        @click="changeSelectedMenu('home')"
        :class="{ 'selected-item': selectedMenu === 'home' }"
      ></v-list-item>

      <!-- 워크스페이스 멤버 리스트 하위 메뉴 버튼 -->
      <v-list-item
        prepend-icon="mdi-account-group"
        title="member"
        @click="changeSelectedMenu('member')"
        :class="{ 'selected-item': selectedMenu === 'member' }"
      ></v-list-item>

      <v-list-item
        prepend-icon="mdi-magnify"
        title="search"
        @click="changeSelectedMenu('search')"
        :class="{ 'selected-item': selectedMenu === 'search' }"
      ></v-list-item>

      <!-- Spacer로 나머지 공간 확보 -->
      <div style="flex-grow: 2"></div>

      <!-- 드롭다운 메뉴 -->
      <div v-if="isDropdownOpen" class="workspace-dropdown-menu" @click.stop>
        <ul v-for="workspace in workspaceList" :key="workspace.workspaceId">
          <li @click="selectWorkspace(workspace.workspaceId)">
            {{ workspace.name }}
          </li>
        </ul>
        <ul>
          <li @click="showWorkspaceModal">+</li>
        </ul>
      </div>

      <!-- 프로필 및 로그아웃 버튼을 하단에 배치 -->
      <div
        ref="profileButton"
        class="profile-logout-section"
        @click="toggleDialog($event)"
      >
        <!-- <img :src="profileImageUrl" alt="Profile Image" class="avatar-image" /> -->
        <img
          :src="
            getProfileImage && getProfileImage !== 'null'
              ? getProfileImage
              : require('@/assets/images/profileImage.png')
          "
          alt="Profile Image"
          class="avatar-image"
        />
      </div>
    </v-list>

    <!-- ModalProfileLogout 컴포넌트 호출 -->
    <ModalProfileLogout
      :dialog="dialog"
      @update:dialog="dialog = $event"
      :modalPosition="modalPosition"
    />
  </v-navigation-drawer>
  <CreateWorkspaceModal
    v-model="createWorkspace"
    @update:dialog="createWorkspace = $event"
  >
  </CreateWorkspaceModal>

  <!-- 하위 메뉴 컴포넌트 -->
  <InnerRelatedMenuHome
    v-if="selectedMenu === 'home'"
    :selectedValue="selectedValue"
  />
  <InnerRelatedMenuMember
    v-if="selectedMenu === 'member'"
    :selectedValue="selectedValue"
  />
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from "vuex";

import InnerRelatedMenuHome from "@/components/basic/InnerRelatedMenuHome.vue";
import InnerRelatedMenuMember from "@/components/basic/InnerRelatedMenuMember.vue";
import ModalProfileLogout from "@/views/member/ModalProfileLogout.vue"; // 모달 컴포넌트 import
import CreateWorkspaceModal from "@/components/basic/CreateWorkspaceModal.vue";

export default {
  props: {
    selectedValue: {
      type: Number,
    },
  },
  computed: {
    ...mapGetters([
      "getWorkspaceId",
      "getWorkspaceName",
      "getNickname",
      "getProfileImage",
    ]),
  },
  name: "InnerMenu",
  components: {
    InnerRelatedMenuHome,
    InnerRelatedMenuMember,
    ModalProfileLogout,
    CreateWorkspaceModal,
  },
  data() {
    return {
      menu: false,
      dialog: false,
      selectedMenu: "home",
      profileImageUrl: "", // 프로필 이미지 URL 저장
      modalPosition: { top: 0, left: 0 }, // 모달의 위치 저장
      isDropdownOpen: false,
      workspaceList: [],
      channelId: null,
      createWorkspace: false,
    };
  },
  mounted() {
    this.fetchMyWorkspaceList();

    const profileImage = this.$store.getters.getProfileImage;
    const nickname = this.$store.getters.getNickname;

    // 프로필 이미지 설정 로직
    if (profileImage !== "null") {
      this.profileImageUrl = profileImage;
    } else {
      this.generateAvatar(nickname);
    }
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
    toggleDropdown() {
      // 드롭다운이 열리고 닫히는지 로그 확인
      console.log("Dropdown toggle");
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    async fetchMyWorkspaceList() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/list`
        );
        this.workspaceList = response.data.result; // 내 워크스페이스 목록 가져오기
      } catch (e) {
        console.log(e);
      }
    },
    async selectWorkspace(workspaceId) {
      console.error("selectWorkspace >> ", workspaceId)
      try {
        const wsInfo = await axios.get(
          // 워크스페이스 정보
          `${process.env.VUE_APP_API_BASE_URL}/workspace/info/${workspaceId}`
        );
        await this.setWorkspaceInfoActions(wsInfo.data.result.workspaceId);
        await this.setWorkspaceNameInfoActions(wsInfo.data.result.name);
        this.$router.push("/workspace");
      } catch (e) {
        console.log(e);
      }
    },
    changeSelectedMenu(name) {
      this.selectedMenu = name;
      switch (this.selectedMenu) {
        case "home":
          this.locationHome();
          break;
        case "member":
          this.$router.push(`/member/${this.getWorkspaceId}`);
          break;
        case "search":
          this.$router.push(`/workspace/${this.getWorkspaceId}/search`);
          break;
      }
    },
    async locationHome() {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/${this.getWorkspaceId}/channel/first`
      );
      this.$router.push(`/channel/${response.data.result.channelId}`);
    },
    setModalPosition() {
      const button = this.$refs.profileButton; // 버튼 요소 참조
      const rect = button.getBoundingClientRect(); // 버튼 위치 정보 가져오기
      this.modalPosition = {
        top: rect.top - 90, // 버튼 위쪽으로 50px 위에 모달 위치
        left: rect.right + 10, // 버튼 오른쪽에 모달 위치
      };
    },
    toggleDialog(event) {
      event.stopPropagation(); // 클릭 이벤트 전파를 막습니다.
      this.dialog = !this.dialog;
      if (this.dialog) {
        this.setModalPosition(); // 모달의 위치 설정
        document.addEventListener("keydown", this.handleEscKey);
        document.addEventListener("click", this.handleOutsideClick);
      } else {
        document.removeEventListener("click", this.handleOutsideClick);
      }
    },
    handleOutsideClick(event) {
      // 클릭이 모달 외부인지 확인
      if (!this.$refs.profileButton.contains(event.target)) {
        this.dialog = false; // 모달 닫기
        document.removeEventListener("click", this.handleOutsideClick); // 리스너 제거
      }
    },
    handleEscKey(event) {
      if (event.key === "Escape" || event.keyCode === 27) {
        // Check for ESC key
        this.dialog = false;
        document.removeEventListener("click", this.handleOutsideClick);
        document.removeEventListener("keydown", this.handleEscKey);
      }
    },
    showWorkspaceModal() {
      (this.isDropdownOpen = false), (this.createWorkspace = true);
      console.log(this.createWorkspace);
    },
  },
  beforeUnmount() {
    if (this.dialog) {
      document.removeEventListener("click", this.handleOutsideClick);
    }
    document.removeEventListener("keydown", this.handleEscKey);
  },
};
</script>

<style lang="scss">
.innerMenu {
  background: #32446e !important;
  position: static !important;
  height: 100% !important;
  display: flex;
  flex-direction: column;
  position: static !important;
}

.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  /* 상단 메뉴와 하단 프로필 버튼 분리 */
}

.profile-logout-section {
  display: flex;
  justify-content: center;
  /* 중앙 정렬 */
  position: relative;
  /* 버튼이 레이아웃 안에서 이동할 수 있도록 */
  bottom: 40px;
  /* 하단에서 40px 위로 설정 */
  margin-top: 40px;
  /* 프로필 버튼과 위쪽 버튼 사이에 간격 */
  transition: bottom 0.3s ease-in-out;
  /* 부드럽고 매끄러운 이동 */
}

.avatar-image {
  width: 45px;
  /* 이미지 크기 45px x 45px로 설정 */
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: block;
  cursor: pointer;
  /* 손 모양 커서 설정 */
  transition: bottom 0.3s ease-in-out;
  /* 부드럽고 매끄러운 이동 */
}

.workspace-dropdown-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  z-index: 1005;
  top: 75px;
}

.workspace-dropdown-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.workspace-dropdown-menu ul li {
  padding: 8px 12px;
  color: black;
  cursor: pointer;
}

.workspace-dropdown-menu ul li:hover {
  background-color: #f3f3f3;
}
</style>
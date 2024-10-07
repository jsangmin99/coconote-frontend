<template>
  <v-navigation-drawer class="innerMenu" theme="dark" permanent rail>
    <v-list density="compact" nav>
      <!-- 기존 메뉴 항목 -->

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

      <!-- 프로필 & 로그아웃 버튼 -->
      <v-list-item
        prepend-icon="mdi-account"
        title="Profile & Logout"
        @click="dialog = true"
        :class="{ 'selected-item': selectedMenu === 'profile' }"
      >
      </v-list-item>

      <!-- ModalProfileLogout 컴포넌트 호출 -->
      <ModalProfileLogout :dialog="dialog" @update:dialog="dialog = $event" />
    </v-list>
  </v-navigation-drawer>

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
import { mapGetters } from "vuex";

import InnerRelatedMenuHome from "@/components/basic/InnerRelatedMenuHome.vue";
import InnerRelatedMenuMember from "@/components/basic/InnerRelatedMenuMember.vue";
import ModalProfileLogout from "@/components/basic/ModalProfileLogout.vue"; // 모달 컴포넌트 import

export default {
  props: {
    // workspaceId
    selectedValue: {
      type: Number,
    },
  },
  computed: {
    ...mapGetters(["getWorkspaceId", "getWorkspaceName"]), // Vuex getter 매핑
  },
  name: "InnerMenu",
  components: {
    InnerRelatedMenuHome,
    InnerRelatedMenuMember,
    ModalProfileLogout, // 모달 컴포넌트 등록
  },

  data() {
    return {
      menu: false, // 작은 모달의 상태 관리
      dialog: false, // 모달의 상태 관리
      selectedMenu: "home", // 기본값
    };
  },

  methods: {
    changeSelectedMenu(name) {
      this.selectedMenu = name;
      switch (this.selectedMenu) {
        case "home":
          this.locationHome()
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
        `${process.env.VUE_APP_API_BASE_URL}/${this.getWorkspaceId}/channel/first` // ⭐ 추후 API 수정
      );
      this.$router.push(`/channel/${response.data.result.channelId}`);
    },
  },
};
</script>

<style lang="scss">
.innerMenu {
  background: #32446e !important;
  position: static !important;
  height: 100% !important;

  .selected-item {
    background-color: #7280a2; /* 선택된 항목의 배경 색상 */
  }
}
</style>
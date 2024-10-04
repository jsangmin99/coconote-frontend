<template>
  <v-navigation-drawer class="innerMenu" theme="dark" permanent rail>
    <v-list density="compact" nav>
      <!-- 기존 메뉴 항목 -->
      <v-list-item
        prepend-icon="mdi-home"
        title="home"
        @click="selectedMenu = 'home'"
        :class="{ 'selected-item': selectedMenu === 'home' }"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-group"
        title="member"
        @click="selectedMenu = 'member'"
        :class="{ 'selected-item': selectedMenu === 'member' }"
      ></v-list-item>
      <!-- 프로필 & 로그아웃 버튼 -->
      <v-list-item prepend-icon="mdi-account" title="Profile & Logout">
        <template v-slot:default="{ toggle }">
          <v-btn icon @click="toggle" class="cursor-pointer">
            <v-icon>mdi-account</v-icon>
          </v-btn>

          <!-- v-menu로 작은 팝업 메뉴 생성 -->
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            activator="parent"
            offset-y
            min-width="200"
          >
            <v-card>
              <v-card-title>Profile & Logout</v-card-title>
              <v-card-text>
                <v-btn @click="viewProfile" block>View Profile</v-btn>
                <v-btn color="red" @click="logout" block>Logout</v-btn>
              </v-card-text>
            </v-card>
          </v-menu>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <InnerRelatedMenuHome v-if="selectedMenu === 'home'" :selectedValue="selectedValue" />
  <InnerRelatedMenuMember
    v-if="selectedMenu === 'member'"
    :selectedValue="selectedValue"
  />
</template>

<script>
import InnerRelatedMenuHome from "@/components/basic/InnerRelatedMenuHome.vue";
import InnerRelatedMenuMember from "@/components/basic/InnerRelatedMenuMember.vue";

export default {
  props: {
    selectedValue: {
      type: Number,
    },
  },
  name: "InnerMenu",
  components: {
    InnerRelatedMenuHome,
    InnerRelatedMenuMember,
  },
  data() {
    return {
      selectedMenu: "home", // 기본값
      menu: false, // 작은 모달의 상태 관리
    };
  },
  methods: {
    viewProfile() {
      // 프로필 보기 로직 구현
      alert("View Profile Clicked");
    },
    logout() {
      // 로그아웃 로직 구현
      alert("Logout Clicked");
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

  .cursor-pointer {
    cursor: pointer !important;
  }
}
</style>

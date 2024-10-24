<template>
  <v-app class="app global_bg" style="height: 100%">
    <v-sheet style="height: 100%">
      <v-row no-gutters>
        <v-col cols="12" class="CommonTopContainer" v-if="!isHiddenPage">
          <!-- CommonTopMenu에서 selected 이벤트 수신 -->
          <CommonTopMenu v-if="!isHiddenPage" />
        </v-col>
      </v-row>
      <v-row no-gutters style="height: 100%">
        <v-col
          :cols="!isInnerMenuOnlyOutsidePage ? 2 : 'auto'"
          v-if="!isHiddenPage"
        >
          <div class="d-flex innerMenuContainer">
            <InnerMenu v-if="!isHiddenPage" />
          </div>
        </v-col>
        <v-col :cols="showHeaderAndSidebar ? 10 : 12">
          <LoadingComponent v-if="loading" />
          <v-sheet v-if="!loading" class="main-content">
            <router-view :key="$route.fullPath" />
          </v-sheet>
        </v-col>
      </v-row>
    </v-sheet>
  </v-app>
</template>

<script>
import CommonTopMenu from "@/components/basic/CommonTopMenu.vue";
import InnerMenu from "@/components/basic/InnerMenu.vue";
import LoadingComponent from "./components/basic/LoadingComponent.vue";

export default {
  computed: {
    showHeaderAndSidebar() {
      const value = this.$route.meta.showHeaderAndSidebar !== false;
      console.log("[App.vue]showHeaderAndSidebar:", value); // 추가
      return value;
    },
    isHiddenPage() {
      // 보이지 않아야 할 페이지 목록
      const hiddenPages = ["/login", "/", "/invite"];
      // 현재 경로가 목록에 포함되어 있는지 확인
      return hiddenPages.includes(this.$route.path);
    },
    isInnerMenuOnlyOutsidePage() {
      // 좌측 메뉴 중 1번째 메뉴만 보이는 화면인지 확인 (좌측메뉴 사이즈 조정용)
      // router 이름으로 검색
      const routePageNames = ["SEARCH", "MemberView"];
      return routePageNames.includes(this.$route.name);
    },
  },
  name: "App",
  components: {
    CommonTopMenu,
    InnerMenu,
    LoadingComponent,
  },
  data() {
    return {
      workspaceInfo: [],
      loading: true,
    };
  },
  mounted() {
    this.$nextTick(() => {
      console.log("전체화면로드 완료");
      
      this.loading = false
    });
  },
  methods: {},
};
</script>

<style lang="scss">
.CommonTopContainer {
  height: 40px;
}
.innerMenuContainer {
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  height: 100%;
}
.main-content {
  height: calc(100% - 40px);
}
</style>

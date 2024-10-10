<template>
  <v-app class="app global_bg" style="height: 100%">
    <v-sheet style="height: 100%">
      <v-row no-gutters>
        <v-col cols="12" class="CommonTopContainer" v-if="!isHiddenPage">
          <!-- CommonTopMenu에서 selected 이벤트 수신 -->
          <CommonTopMenu v-if="!isHiddenPage" @selected="handleSelected" />
        </v-col>
      </v-row>
      <v-row no-gutters style="height: 100%">
        <v-col cols="2" v-if="!isHiddenPage">
          <div class="d-flex innerMenuContainer">
            <InnerMenu v-if="!isHiddenPage" :selectedValue="selectedValue" />
          </div>
        </v-col>
        <v-col :cols="showHeaderAndSidebar ? 10 : 12">
          <v-sheet class="main-content">
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

export default {
  computed: {
    showHeaderAndSidebar() {
      const value = this.$route.meta.showHeaderAndSidebar !== false;
      console.log("[App.vue]showHeaderAndSidebar:", value); // 추가
      return value;
    },
    isHiddenPage() {
      // 보이지 않아야 할 페이지 목록
      const hiddenPages = ["/login", "/","/invite"];
      // 현재 경로가 목록에 포함되어 있는지 확인
      return hiddenPages.includes(this.$route.path);
    },
  },
  name: "App",
  components: {
    CommonTopMenu,
    InnerMenu,
  },
  data() {
    return {
      selectedValue: null, // CommonTopMenu에서 전달받은 workspaceId 값을 저장
      workspaceInfo: [],
    };
  },
  methods: {
    handleSelected(value) {
      console.log("[App.vue]Selected Value from CommonTopMenu:", value); // 로그 출력
      this.selectedValue = value; // selectedValue에 값 할당
    },
  },
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

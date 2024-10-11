<template>
  <v-navigation-drawer permanent class="innerSubMenu" :width="220">
    <div>회원 목록</div>
  </v-navigation-drawer>
</template>

<script>
export default {
    props: {
  },
  name: "InnerRelatedMenuHome",
  data() {
    return {

    }
  },
};
</script>

<style lang="scss" scoped>
  @import "@/assets/css/innerRelated.scss"; /* SCSS 파일을 불러오기 */
</style>
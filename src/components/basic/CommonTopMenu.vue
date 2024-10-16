<template>
  <v-app-bar :elevation="2" class="topMenu" height="40">
    <v-app-bar-title class="title"> COCONOTE </v-app-bar-title>
    <template v-slot:append>
    <div class="d-flex align-center justify-end" style="width: 100%;">
    </div>
  </template>
  </v-app-bar>
</template>

<script>

export default {
  name: "CommonTopMenu",
  components: {
  },
  computed: {
  },
  data() {
    return {
      isLoading: false,
    };
  },
  created() {
  },
  watch: {
  },
  methods: {
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
    font-size: 0.9rem;
    /* v-app-bar-title의 폰트 크기 설정 */
  }
}
</style>

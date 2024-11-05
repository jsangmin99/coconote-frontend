<template>
  <v-app-bar :elevation="2" class="topMenu" height="40">
    <v-app-bar-title class="title apptitleCustom"> 
      <img src="@/assets/images/logo_coconote_w.png" alt="coconote icon" />
    </v-app-bar-title>
    <template v-slot:append>
      <div class="d-flex align-center justify-end" style="width: 100%;">
      </div>
    </template>
  </v-app-bar>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'YourComponentName', // 컴포넌트 이름
  computed: {
    ...mapGetters('notifications', ['allNotifications']),
  },
  methods: {
    ...mapActions([
      "connectToSSE",
      "disconnectSSE"
    ]),
  },
  created() {
    const workspaceId = localStorage.getItem('workspaceId');
    if (workspaceId) {
      // //console.log(`SSE 연결을 시작합니다. 워크스페이스 ID: ${workspaceId}`);
      this.connectToSSE({ workspaceId }); // workspaceId 전달
    } else {
      console.warn('워크스페이스 ID를 찾을 수 없습니다. SSE 연결을 시작할 수 없습니다.');
    }
  },
  beforeUnmount() {
    // //console.log('SSE 연결을 해제합니다.');
    this.disconnectSSE();
  },
  watch: {
    allNotifications: {
      deep: true,
      handler(newNotifications) {
        if (newNotifications.length > 0) {
          // //console.log('새로운 알림이 도착했습니다 @@@:', newNotifications[newNotifications.length - 1]);
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
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
    &.apptitleCustom{
      img{
        max-height: 11px;
      }
    }
  }
}
</style>

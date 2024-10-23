<template>
  <v-app-bar :elevation="2" class="topMenu" height="40">
    <v-app-bar-title class="title"> COCONOTE </v-app-bar-title>
    <template v-slot:append>
      <div class="d-flex align-center justify-end" style="width: 100%;">
      </div>
    </template>
  </v-app-bar>
</template>

<script setup>
import { useStore } from 'vuex';
import { onMounted, onBeforeUnmount, computed, watch } from 'vue';

// Vuex 스토어 가져오기
const store = useStore();

// Vuex의 getters와 actions를 사용하는 방식
const allNotifications = computed(() => store.getters['notifications/allNotifications']);
const connectToSSE = (payload) => store.dispatch('notifications/connectToSSE', payload);
const disconnectSSE = () => store.dispatch('notifications/disconnectSSE');

// 컴포넌트가 마운트되었을 때 SSE 연결을 시작합니다.
onMounted(() => {
  const workspaceId = localStorage.getItem('workspaceId');
  if (workspaceId) {
    console.log(`SSE 연결을 시작합니다. 워크스페이스 ID: ${workspaceId}`);
    connectToSSE({ workspaceId}); // workspaceId 전달
  } else {
    console.warn('워크스페이스 ID를 찾을 수 없습니다. SSE 연결을 시작할 수 없습니다.');
  }
});

// 컴포넌트가 언마운트되기 전에 SSE 연결을 해제합니다.
onBeforeUnmount(() => {
  console.log('SSE 연결을 해제합니다.');
  disconnectSSE();
});

// 알림 상태가 변경될 때마다 로그를 출력합니다.
watch(allNotifications, (newNotifications) => {
  console.log('새로운 알림이 도착했습니다:', newNotifications[newNotifications.length - 1]);
});
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
  }
}
</style>

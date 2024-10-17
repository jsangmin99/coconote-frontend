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
import { onMounted, onBeforeUnmount, computed } from 'vue';

// Vuex 스토어 가져오기
const store = useStore();

// Vuex에서 getChannelId getter를 사용하여 채널 ID를 가져옴
const workspaceId = computed(() => store.getters['getWorkspaceId']);
console.log('qqqqqqqqqqqqqqqqqqqchannelId:', workspaceId.value);

// 컴포넌트가 마운트될 때 SSE 구독 시작
onMounted(() => {
    if (workspaceId.value) {
        store.dispatch('notifications/subscribeToNotifications', workspaceId.value);
    }
});

// // 채널 ID가 변경될 때마다 SSE 구독을 갱신
// watch(channelId, (newChannelId, oldChannelId) => {
//   if (newChannelId !== oldChannelId && newChannelId) {
//     store.dispatch('notifications/subscribeToNotifications', newChannelId);
//   }
// });

// 컴포넌트가 언마운트될 때 SSE 연결 닫기
onBeforeUnmount(() => {
  store.dispatch('notifications/closeEventSource'); // SSE 연결 닫기
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
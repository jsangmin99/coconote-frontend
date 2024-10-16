<template>
  <div class="splitViewContainer">
    <ChannelCommonMenu :menu="'split'" :channelId="channelId" />
    <div class="splitTabs">
      <div class="leftTabs">
        <p>왼쪽 탭</p>
        <button :class="{ active: leftTab === 'thread' }" @click="leftTab = 'thread'">쓰레드</button>
        <button :class="{ active: leftTab === 'canvas' }" @click="leftTab = 'canvas'">캔버스</button>
        <button :class="{ active: leftTab === 'drive' }" @click="leftTab = 'drive'">드라이브</button>
      </div>
      <div class="rightTabs">
        <p>오른쪽 탭</p>
        <button :class="{ active: rightTab === 'thread' }" @click="rightTab = 'thread'">쓰레드</button>
        <button :class="{ active: rightTab === 'canvas' }" @click="rightTab = 'canvas'">캔버스</button>
        <button :class="{ active: rightTab === 'drive' }" @click="rightTab = 'drive'">드라이브</button>
      </div>
    </div>
    <div class="splitContent">
      <div class="leftPane">
        <component :is="getComponentForTab(leftTab)" :id="channelId" :canvasId="canvasId" />
      </div>
      <div class="rightPane">
        <component :is="getComponentForTab(rightTab)" :id="channelId" :canvasId="canvasId" />
      </div>
    </div>
  </div>
</template>

<script>
import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import ThreadComponent from "@/components/thread/ThreadComponent.vue";
import CanvasDetailComponent from "@/components/canvas/CanvasDetailComponent.vue";
import FolderComponent from "@/components/drive/FolderComponent.vue";

export default {
  props: {
    channelId: {
      type: String,
      required: true,
    },
  },
  components: {
    ChannelCommonMenu,
    ThreadComponent,
    CanvasDetailComponent,
    FolderComponent,
  },
  data() {
    return {
      leftTab: 'thread', // 기본 왼쪽 탭
      rightTab: 'drive', // 기본 오른쪽 탭
      canvasId: null, // 초기 Canvas ID
    };
  },
  methods: {
    getComponentForTab(tab) {
      switch (tab) {
        case 'thread':
          return 'ThreadComponent';
        case 'canvas':
          return 'CanvasDetailComponent';
        case 'drive':
          return 'FolderComponent';
        default:
          return null;
      }
    },
    updateCanvasId(newCanvasId) {
      this.canvasId = newCanvasId;
    },
  },
};
</script>

<style scoped>
.splitViewContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.splitTabs {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #e6e6e6;
}

.leftTabs,
.rightTabs {
  display: flex;
  flex-direction: row; /* 가로로 정렬 */
  align-items: flex-start;
}

.splitTabs button {
  padding: 5px;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 14px;
}

.splitTabs button.active {
  font-weight: bold;
  text-decoration: underline;
}

.splitContent {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.leftPane,
.rightPane {
  flex: 1;
  overflow: auto;
  padding: 10px;
  border: 1px solid #e6e6e6;
}

.leftPane {
  border-right: none;
}

/* ::v-deep를 사용하여 .input-group 스타일 덮어씌우기 */
::v-deep .input-group {
  width: 35% !important;
}
::v-deep .list-group{
  max-height: calc(100vh - 330px);
}
</style>
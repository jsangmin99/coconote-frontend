<template>
  <div class="splitViewContainer">
    <ChannelCommonMenu :menu="'split'" :channelId="channelId" :splitActiveTab="activeTabs" />
    <div class="splitTabs">
      <div class="leftTabs">
        <div class="menuBtns" v-if="menu !== 'split'">
          <button
            :class="{ active: leftTab === 'thread' }"
            @click="changeTab('leftTab', 'thread')"
            v-if="activeTabs.rightTab != 'thread'"
          >
            쓰레드
          </button>
          <button
            :class="{ active: leftTab === 'canvas' }"
            @click="changeTab('leftTab', 'canvas')"
            v-if="activeTabs.rightTab != 'canvas'"
          >
            캔버스
          </button>
          <button
            :class="{ active: leftTab === 'drive' }"
            @click="changeTab('leftTab', 'drive')"
            v-if="activeTabs.rightTab != 'drive'"
          >
            드라이브
          </button>
        </div>
      </div>
      <div class="rightTabs">
        <div class="menuBtns" v-if="menu !== 'split'">
          <button
            :class="{ active: rightTab === 'thread' }"
            @click="changeTab('rightTab', 'thread')"
            v-if="activeTabs.leftTab != 'thread'"
          >
            쓰레드
          </button>
          <button
            :class="{ active: rightTab === 'canvas' }"
            @click="changeTab('rightTab', 'canvas')"
            v-if="activeTabs.leftTab != 'canvas'"
          >
            캔버스
          </button>
          <button
            :class="{ active: rightTab === 'drive' }"
            @click="changeTab('rightTab', 'drive')"
            v-if="activeTabs.leftTab != 'drive'"
          >
            드라이브
          </button>
        </div>
      </div>
    </div>
    <div class="splitContent">
      <div class="leftPane">
        <component
          :is="getComponentForTab(leftTab)"
          :id="channelId"
          :splitCanvasId="canvasId"
          @drag-start="emitDragStart"
        />
      </div>
      <div class="rightPane">
        <component
          :is="getComponentForTab(rightTab)"
          :id="channelId"
          :splitCanvasId="canvasId"
          @drag-start="emitDragStart"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { EventBus } from '@/eventBus/eventBus';

import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import ThreadComponent from "@/components/thread/ThreadComponent.vue";
import CanvasView from "@/views/canvas/CanvasView.vue";
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
    CanvasView,
    FolderComponent,
  },
  mounted(){
    // EventBus로 drag-start 이벤트 감지
    EventBus.on('drag-start', (data) => {
      this.draggedData = data;
    });
  },
  data() {
    return {
      leftTab: "thread", // 기본 왼쪽 탭
      rightTab: "drive", // 기본 오른쪽 탭
      canvasId: null, // 초기 Canvas ID
      activeTabs: {
        // active tab 확인용
        leftTab: "thread",
        rightTab: "drive",
      },

      // 드래그
      draggedData: null,
    };
  },
  methods: {
    changeTab(type, tabName){
      if(type === "leftTab"){
        this.activeTabs.leftTab = tabName;
        this.leftTab = tabName;
      }else if(type === "rightTab"){
        this.activeTabs.rightTab = tabName
        this.rightTab = tabName;
      }else{
        console.error("잘못된 type")
        return false;
      }
    },
    getComponentForTab(tab) {
      switch (tab) {
        case "thread":
          return "ThreadComponent";
        case "canvas":
          return "CanvasView";
        case "drive":
          return "FolderComponent";
        default:
          return null;
      }
    },
    updateCanvasId(newCanvasId) {
      this.canvasId = newCanvasId;
    },

    // drag 영역
    emitDragStart(data) {
      // left 컴포넌트에서 drag-start 이벤트 발생 시 실행
      this.draggedData = data;
      EventBus.emit('drag-start', data);
    },
    handleDrop() {
      // right 컴포넌트에서 drop 이벤트 발생 시 실행
      EventBus.emit('drop', this.draggedData);
      this.draggedData = null;
    },
  },
  beforeUnmount(){
    EventBus.off('drag-start');
  }
};
</script>

<style lang="scss">
.splitViewContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.splitTabs {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e6e6e6;

  .menuBtns {
    padding: 5px 24px 0 24px;
  }
  button {
    padding: 5px;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 14px;
    &.active {
      font-weight: bold;
      text-decoration: underline;
    }
  }
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
}

.leftPane {
  border-right: 1px solid #e6e6e6;
}
</style>

<style scoped>
/* ::v-deep를 사용하여 .input-group 스타일 덮어씌우기 */
::v-deep .input-group {
  width: 37% !important;
}
::v-deep .list-group {
  max-height: calc(100vh - 280px);
}
::v-deep .drive-container {
  height: calc(100vh - 240px); /* 뷰포트 전체 높이에서 60px을 뺀 값 */
}
</style>
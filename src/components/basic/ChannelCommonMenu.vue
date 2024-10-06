<template>
  <div class="channelMenuContainer">
    <div class="top">
      <div class="titleArea">
        <div class="col">
          <div>
            <v-icon icon="mdi-star" class="star active" @click="toggleBookmark" />
          </div>
          <h1>{{ getChannelName }}</h1>
          <div>
            <v-icon icon="mdi-pencil-outline" class="pencil" />
          </div>
        </div>
        <div class="col">
          <v-icon icon="mdi-plus" @click="openChannelMemberInviteModal">
          </v-icon>
          <v-icon icon="mdi-dots-vertical">
          </v-icon>
        </div>
      </div>
      <p>{{ getChannelDesc }}</p>
    </div>
    <div class="menuBtns">
      <button @click="moveMenu('thread')" :class="{ active: menu === 'thread' }">
        쓰레드
      </button>
      <button @click="moveMenu('canvas')" :class="{ active: menu === 'canvas' }">
        캔버스
      </button>
      <button @click="moveMenu('drive')" :class="{ active: menu === 'drive' }">
        드라이브
      </button>
      <button class="badge">
        2분할 보기 <v-icon icon="mdi-eye-outline" class="eye" />
      </button>
      <button class="invteChannelMember" @click="openChannelMemberInviteModal">멤버 초대</button>

    </div>

    <!-- 모달 컴포넌트 -->
    <ChannelMemberModal v-if="isChannelMemberModalOpen" :channelId="getChannelId" :workspaceId="getWorkspaceId"
      @closeModal="closeChannelMemberInviteModal" />
  </div>
</template>

<script>
import ChannelMemberModal from "@/components/ChannelMemberInviteModal.vue"; // 모달 컴포넌트 추가
import { mapGetters } from "vuex";
import axios from "axios";

export default {
  props: ["menu"],
  name: "ChannelCommonMenu",
  components: {
    ChannelMemberModal, // 모달 컴포넌트 등록
  },
  computed: {
    ...mapGetters([
      "getChannelId",
      "getChannelName",
      "getChannelDesc",
      "getWorkspaceId",
      "getWorkspaceName",
    ]),
  },
  data() {
    return {
      isChannelMemberModalOpen: false,
      toggleBookmarkIsLoading: false,
    };
  },
  methods: {
    moveMenu(name) {
      this.$router.push(
        `/channel/${this.$store.getters.getChannelId}/${name}/view`
      );
    },
    openChannelMemberInviteModal() {
      this.isChannelMemberModalOpen = false; // 일단 false로 설정하여 초기화
      this.$nextTick(() => {
        this.isChannelMemberModalOpen = true; // 모달 열기
        console.log("openInviteModal");
      });
    },
    closeChannelMemberInviteModal() {
      this.isChannelMemberModalOpen = false; // 모달 닫기
      console.log("closeInviteModal");
    },
    async toggleBookmark() {
      this.toggleBookmarkIsLoading = true;
      try {
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/channel/member/bookmark/${this.channelId}`
        );
        console.log("toggleBookmark", response);
      } catch (error) {
        console.error("bookmark 토글 중 오류 발생", error);
      } finally {
        this.toggleBookmarkIsLoading = false;
      }
    },
  },
};
</script>

<style lang="scss">
.channelMenuContainer {
  $gray_font: #a4a4a4;
  padding-top: 24px;

  .top {
    margin-bottom: 16px;
    padding: 0 24px;

    .titleArea {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .col {
        display: flex;
        align-items: center;
        color: #A4A4A4;
      }

      .star {
        color: $gray_font;
        font-size: 24px;

        &.active {
          color: #ffbb00;
        }
      }

      h1 {
        font-size: 24px;
        padding: 0 10px;
      }

      .pencil {
        color: $gray_font;
        font-size: 16px;
      }
    }

    p {
      color: $gray_font;
      font-size: 12px;
    }

    .right-buttons {
      display: flex;
      align-items: center;

      .invite-btn {
        margin-left: 16px;
        padding: 4px 12px;
        font-size: 12px;
        background-color: #69a0f2;
        color: white;
        border-radius: 30px;
        border: none;
      }
    }
  }

  .menuBtns {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    border-bottom: 1px solid #e6e6e6;
    padding: 0 24px;

    button {
      padding: 8px 16px;
      border-bottom: 1px solid #8b8b8b;
      background: none;
      margin-bottom: -1px;

      &.active {
        border-bottom: 3px solid #69a0f2;
      }

      &.badge {
        margin-left: 8px;
        border-bottom: none;
        font-size: 10px;
        background: #f3f3f3;
        border-radius: 30px;
        border: 1px solid #cecece;
        padding: 4px 8px;

        .eye {
          color: #919191;
        }
      }
    }
  }
}
</style>

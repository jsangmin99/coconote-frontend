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
          <v-icon icon="mdi-plus" @click="openChannelMemberInviteModal"></v-icon>
          <!-- 클릭 이벤트로 드롭다운 토글 -->
          <v-icon icon="mdi-dots-vertical" @click="toggleDropdown">
            <!-- 클릭 시 로깅 -->
            <span @click="console.log('dots clicked')"></span>
          </v-icon>
        </div>
      </div>
      <p>{{ getChannelDesc }}</p>
    </div>

    <!-- 드롭다운 메뉴 -->
    <div v-if="isDropdownOpen" class="dropdown-menu">
      <ul>
        <li @click="editChannel">채널 수정</li>
        <li @click="deleteChannel">채널 삭제</li>
      </ul>
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
import ChannelMemberModal from "@/components/ChannelMemberInviteModal.vue";
import { mapGetters } from "vuex";
import axios from "axios";

export default {
  props: ["menu"],
  name: "ChannelCommonMenu",
  components: {
    ChannelMemberModal,
  },
  data() {
    return {
      isChannelMemberModalOpen: false,
      isDropdownOpen: false, // 드롭다운 상태 관리
      toggleBookmarkIsLoading: false,
    };
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
  methods: {
    moveMenu(name) {
      this.$router.push(`/channel/${this.$store.getters.getChannelId}/${name}/view`);
    },
    openChannelMemberInviteModal() {
      this.isChannelMemberModalOpen = false; // 일단 false로 설정하여 초기화
      this.$nextTick(() => {
        this.isChannelMemberModalOpen = true; // 모달 열기
        console.log("openInviteModal");
      });
    },
    closeChannelMemberInviteModal() {
      this.isChannelMemberModalOpen = false;
    },
    toggleDropdown() {
      // 드롭다운이 열리고 닫히는지 로그 확인
      console.log("Dropdown toggle");
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    async deleteChannel() {
      try {
        // 섹션 리스트에서 전체 채널 목록을 가져오기
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/section/list/${this.getWorkspaceId}`
        );

        // 모든 섹션의 채널 리스트 합치기
        const allChannels = response.data.result.flatMap(section => section.channelList);

        if (allChannels.length <= 1) {
          alert("마지막 채널은 삭제할 수 없습니다.");
          return; // 마지막 채널이면 삭제를 중단
        }

        // 삭제 확인
        if (confirm("정말로 채널을 삭제하시겠습니까?")) {
          await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/channel/delete/${this.getChannelId}`);
          alert("채널이 성공적으로 삭제되었습니다.");
          this.$router.push("/workspace").then(() => {
            location.reload(); // URL 변경 후 페이지 새로고침
          });
        }
      } catch (error) {
        console.error("채널 리스트를 가져오거나 삭제하는 중 오류 발생", error);
      }
    },

    editChannel() {
      console.log("채널 수정 클릭됨");
    },
    async toggleBookmark() {
      this.toggleBookmarkIsLoading = true;
      try {
        const response = await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/channel/member/bookmark/${this.channelId}`);
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

  .dropdown-menu {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 10px;
    z-index: 100;
    top: 40px;
    /* 위치 조정 */
    right: 0px;
  }

  .dropdown-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .dropdown-menu ul li {
    padding: 8px 12px;
    cursor: pointer;
  }

  .dropdown-menu ul li:hover {
    background-color: #f3f3f3;
  }
}
</style>

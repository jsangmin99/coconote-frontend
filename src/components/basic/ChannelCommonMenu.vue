<template>
  <div class="channelMenuContainer">
    <div class="top">
      <div class="titleArea">
        <div class="col">
          <div>
            <v-icon @click.stop="toggleBookmark(getChannelId)" :color="isBookmarked ? '#ffbb00' : 'grey'" class="star active">mdi-star</v-icon>
          </div>
          <h1>{{ getChannelName }}</h1>
          <div>
            <v-icon icon="mdi-pencil-outline" class="pencil" />
          </div>
        </div>
        <div class="col">
          <!-- + 아이콘 -->
          <div class="icon-container" @click="openChannelMemberInviteModal">
            <!-- + 아이콘 -->
            <v-icon icon="mdi-plus" class="plus-icon"></v-icon>
            <!-- 첫 번째 프로필 이미지 -->
            <div v-if="channelMembers.length > 0" class="circle blue-circle">
              <img :src="channelMembers[0].profileImageUrl || defaultProfileImage" alt="Profile" />
            </div>
            <!-- 두 번째 프로필 이미지 (있을 경우) -->
            <div v-if="channelMembers.length > 1" class="circle green-circle">
              <img :src="channelMembers[1].profileImageUrl || defaultProfileImage" alt="Profile" />
            </div>
          </div>
          <!-- 클릭 이벤트로 드롭다운 토글 -->
          <v-icon icon="mdi-dots-vertical" @click="toggleDropdown">
            <span @click="console.log('dots clicked')"></span>
          </v-icon>
        </div>
      </div>
      <p>{{ getChannelDesc }}</p>
    </div>

    <!-- 드롭다운 메뉴 -->
    <div v-if="isDropdownOpen" class="dropdown-menu" @click.stop>
      <ul>
        <li @click="startEditingChannel">채널 수정</li>
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
    </div>

    <!-- 모달 컴포넌트 -->
    <ChannelMemberModal v-if="isChannelMemberModalOpen" :channelId="getChannelId" :workspaceId="getWorkspaceId"
      @closeModal="closeChannelMemberInviteModal" />

    <v-dialog v-model="channelDialog" width="auto" class="channelDialog">
    <v-card max-width="400">
      <v-card-title> 채널 수정 </v-card-title>
      <v-card-text>
        <p>채널의 이름을 입력하세요.</p>
        <v-text-field
          ref="channelNameInput"
          color="primary"
          density="compact"
          variant="underlined"
          v-model="updateChannelInfo.channelName"
          @keyup.enter="saveEditingChannel"
          placeholder="이름"
        ></v-text-field>
        <p>채널의 설명을 입력하세요.</p>
        <v-text-field
          color="primary"
          density="compact"
          variant="underlined"
          v-model="updateChannelInfo.channelInfo"
          @keyup.enter="saveEditingChannel"
          placeholder="이름"
        ></v-text-field>
        <v-radio-group
          inline
          label="채널종류"
          v-model="updateChannelInfo.isPublic"
        >
          <v-radio label="공개채널" value="1"></v-radio>
          <v-radio label="비공개 채널" value="0"></v-radio>
        </v-radio-group>
      </v-card-text>
      <template v-slot:actions>
        <v-btn class="" text="저장" @click="saveEditingChannel"></v-btn>
        <v-btn class="" text="닫기" @click="channelDialog = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>

  </div>
</template>

<script>
import ChannelMemberModal from "@/components/ChannelMemberInviteModal.vue";
import { mapGetters } from "vuex";
import axios from "axios";
import { fetchChannelMemberInfo } from '@/services/channelService'; // 모듈 import


export default {
  props: ["menu"],
  name: "ChannelCommonMenu",
  components: {
    ChannelMemberModal,
  },
  data() {
    return {
      channelMembers: [], // 채널 멤버 리스트를 위한 배열 초기화
      isChannelMemberModalOpen: false,
      isDropdownOpen: false, // 드롭다운 상태 관리
      toggleBookmarkIsLoading: false,
      defaultProfileImage: 'https://via.placeholder.com/40', // 기본 프로필 이미지 설정,
      isBookmarked: false,
      channelDialog: false,
      updateChannelInfo: {
        channelName: "",
        channelInfo: "",
        isPublic: "",
      },
      isPublic: "",
    };
  },
  computed: {
    ...mapGetters([
      "getChannelId",
      "getChannelName",
      "getChannelDesc",
      "getChannelRole",
      "getIsBookmark",
      "getWorkspaceId",
      "getWorkspaceName",
    ]),
  },
  mounted() {
    this.loadChannelMembers(); // 컴포넌트가 마운트되면 채널 멤버를 불러옴
    document.addEventListener('click', this.handleClickOutside); //드롭다운 메뉴 외부 클릭 시 닫기
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  created() {
    this.fetchChannelInfo(this.getChannelId);
  },
  methods: {

    handleClickOutside(event) {
      // 드롭다운 버튼을 클릭한 경우는 무시
      const dropdownToggle = this.$el.querySelector('.mdi-dots-vertical');
      const dropdown = this.$el.querySelector('.dropdown-menu');

      if ((dropdownToggle && dropdownToggle.contains(event.target)) || (dropdown && dropdown.contains(event.target))) {
        return;
      }

      this.isDropdownOpen = false;
    },

    async loadChannelMembers() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/channel/member/list/${this.getChannelId}`);
        this.channelMembers = response.data.result; // 채널 멤버 데이터 설정
      } catch (error) {
        console.error('채널 멤버 불러오기 중 오류 발생', error);
      }
    },
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
    startEditingChannel() {
      this.channelDialog = true;
      this.updateChannelInfo.channelName = this.getChannelName;
      this.updateChannelInfo.channelInfo = this.getChannelDesc;
    },
    async saveEditingChannel() {
        const data = {
        channelName: this.updateChannelInfo.channelName,
        channelInfo: this.updateChannelInfo.channelInfo,
        isPublic: Number(this.updateChannelInfo.isPublic),
        };
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/channel/update/${this.getChannelId}`,
          data
        );
        alert("채널 수정이 완료되었습니다.");
        this.$router.push("/workspace").then(() => {
            location.reload(); // URL 변경 후 페이지 새로고침
          });
      } catch (error) {
        console.error("채널 수정 에러", error);
      } 
    },
    async fetchChannelInfo(channelId) {
      const chInfo = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/channel/detail/${channelId}`);
      this.updateChannelInfo.isPublic = Number(chInfo.data.result.isPublic);
      console.log("기존 수정 전 공개범위", Number(chInfo.data.result.isPublic));

      const result = await fetchChannelMemberInfo(channelId); // 모듈로 함수 호출
      if(result.isBookmark) {
        this.isBookmarked = true;
      }else{
        this.isBookmarked = false;
      }
    },
    async toggleBookmark(channelId) {
      // this.toggleBookmarkIsLoading = true;
      try {
        const response = await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/channel/member/bookmark/${channelId}`);
        if(response.data.result) {
          this.isBookmarked = true;
        } else {
          this.isBookmarked = false;
        }
        console.log("toggleBookmark", response.data.result);
      } catch (error) {
        console.error("bookmark 토글 중 오류 발생", error);
      } finally {
        // this.toggleBookmarkIsLoading = false;
      }
    },
    isBookmark() {
      console.log("즐겨찾기 추가/해제 확인", this.isBookmarked);
      return this.isBookmarked;
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
    top: 75px;
    /* 위치 조정 */
    right: 40px;
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

  .icon-container {
    position: relative;
    display: flex;
    align-items: center;
    margin-right: 10px;
    cursor: pointer;

    .circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      position: relative;
      z-index: 2;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .blue-circle {
      background-color: #4285f4;
      margin-left: 10px;
    }

    .green-circle {
      background-color: #a4e4a9;
      margin-left: 5px;
    }
  }

  .plus-icon {
    font-size: 24px;
    color: #a4a4a4;
  }
}
</style>

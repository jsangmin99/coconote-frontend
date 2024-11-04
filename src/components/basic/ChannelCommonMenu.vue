<template>
  <div class="channelMenuContainer">
    <div class="top">
      <div class="titleArea">

        <!-- 즐겨찾기, 채널명, 채널정보수정 버튼 -->
        <div class="col">
          <div>
            <v-icon @click.stop="toggleBookmark(getChannelId)" :color="isBookmarked ? '#ffbb00' : 'grey'"
              class="star active">mdi-star</v-icon>
          </div>
          <h1>{{ getChannelName }}</h1>
          <div>
            <v-icon v-if="getChannelRole === 'MANAGER'" icon="mdi-pencil-outline" class="pencil"
              @click="startEditingChannel" />
          </div>
        </div>
        
        <!-- +, 프로필이미지, 채널 설정 아이콘 -->
        <div class="col">
          <!-- + 아이콘 -->
          <div class="icon-container"  @click="openChannelMemberInviteModal">
            <!-- + 아이콘 -->
            <v-icon icon="mdi-plus" class="plus-icon"></v-icon>
            <!-- 첫 번째 프로필 이미지 -->
            <div v-if="channelMembers.length > 0" class="circle blue-circle">
              <img :src="channelMembers[0].memberInfo.profileImage || require(`@/assets/images/profile/profile${channelMembers[0].memberInfo.workspaceMemberId % 10}.jpg`)" alt="Profile" />
            </div>
            <!-- 두 번째 프로필 이미지 (있을 경우) -->
            <div v-if="channelMembers.length > 1" class="circle green-circle">
              <img :src="channelMembers[1].memberInfo.profileImage || require(`@/assets/images/profile/profile${channelMembers[1].memberInfo.workspaceMemberId % 10}.jpg`)" alt="Profile" />
            </div>
          </div>

          <!-- 클릭 이벤트로 드롭다운 토글 -->
          <v-icon v-if="getChannelRole === 'MANAGER'" icon="mdi-dots-vertical" @click="toggleDropdown">
            <span @click="console.log('dots clicked')"></span>
          </v-icon>
        </div>
      </div>
      <p>{{ getChannelDesc }}</p>
    </div>

    <!-- 드롭다운 메뉴 -->
    <div class="modal-content" @click.stop>
      <div v-if="isDropdownOpen" class="dropdown-menu" @click.stop>
        <ul>
          <li @click="(channelAccessDialog = true)">채널 공개 범위 수정</li>
          <li @click="deleteChannel">채널 삭제</li>
        </ul>
      </div>
    </div>


    <!-- 화면 전환 버튼 -->
    <div class="menuBtns" v-if="menu !== 'split'">
      <button @click="moveMenu('thread')" :class="{ active: menu === 'thread' }">
        쓰레드
      </button>
      <button @click="moveMenu('canvas')" :class="{ active: menu === 'canvas' }">
        캔버스
      </button>
      <button @click="moveMenu('drive')" :class="{ active: menu === 'drive' }">
        드라이브
      </button>
      <button @click="moveMenu('tag')" :class="{ active: menu === 'tag' }">
        태그
      </button>
      <button class="badge" @click="goToSplitView">
        2분할 보기 <v-icon icon="mdi-eye-outline" class="eye" />
      </button>
    </div>

    <!-- 2분할 버튼 -->
    <div class="menuBtns" v-else>
      <button @click="closeSplitView('left')">
        1화면 <v-icon icon="mdi-close" class="icon-color" />
      </button>
      <button @click="closeSplitView('right')">
        2화면 <v-icon icon="mdi-close" class="icon-color" />
      </button>
    </div>

    <!-- 채널 멤버 모달 -->
    <ChannelMemberModal v-if="isChannelMemberModalOpen" :channelId="getChannelId" :workspaceId="getWorkspaceId"
      @closeModal="closeChannelMemberInviteModal" />

    <!-- 채널 이름, 설명 수정 모달 -->
    <v-dialog v-model="channelDialog" width="auto" class="channelDialog">
      <v-card max-width="400">
        <v-card-title> 채널 수정 </v-card-title>
        <v-card-text>
          <p>채널의 이름을 입력하세요.</p>
          <v-text-field ref="channelNameInput" color="primary" density="compact" variant="underlined"
            v-model="updateChannelInfo.channelName" @keyup.enter="saveEditingChannel" placeholder="이름" :rules="nameRules"></v-text-field>
          <p>채널의 설명을 입력하세요.</p>
          <v-text-field color="primary" density="compact" variant="underlined" v-model="updateChannelInfo.channelInfo"
            @keyup.enter="saveEditingChannel" placeholder="이름"></v-text-field>
        </v-card-text>
        <template v-slot:actions>
          <v-btn class="" text="저장" @click="saveEditingChannel"></v-btn>
          <v-btn class="" text="닫기" @click="channelDialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>


  <v-dialog v-model="channelAccessDialog" width="auto" class="channelAccessDialog">
    <v-card max-width="400">
      <v-card-title> 채널 관리 </v-card-title>
      <v-card-text>
        <v-radio-group inline label="채널 공개 범위" v-model="currentAccessLevel">
          <v-radio label="공개" value="1"></v-radio>
          <v-radio label="비공개" value="0"></v-radio>
        </v-radio-group>
      </v-card-text>
      <template v-slot:actions>
        <v-btn class="" text="저장" @click="changeChannelAccessLevel"></v-btn>
        <v-btn class="" text="닫기" @click="channelAccessDialog = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>


  </div>
</template>

<script>
import ChannelMemberModal from "@/components/ChannelMemberInviteModal.vue";
import { mapGetters, mapActions } from "vuex";
import axios from "axios";
import { fetchChannelMemberInfo } from "@/services/channelService"; // 모듈 import

export default {
  props: ["menu", "splitActiveTab"],
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
      isBookmarked: false,
      channelDialog: false,
      updateChannelInfo: {
        channelName: "",
        channelInfo: "",
      },
      rootFolderId: "",
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length >= 1) || 'Name must be at least 1 characters'
      ],
      channelAccessDialog: false,
      currentAccessLevel: null,

      // splitView 용도
      tcdTabs : null,
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

      // tcd splitview 용도
      "getTcdSplitTab",
    ]),
  },
  watch: {
    splitActiveTab: {
      handler() {
        // console.log("splitActiveTab 변경됨 >> ", newVal); // 값이 변경될 때마다 로그로 확인
      },
      deep: true,
    },
    getTcdSplitTab: {
      handler(newVal) {
        // console.error("tcd tab 변경~!~!~! >>> ", newVal)
        this.tcdTabs = newVal;
      },
      deep: true,
    }
  },
  mounted() {
    this.loadChannelMembers(); // 컴포넌트가 마운트되면 채널 멤버를 불러옴
    this.fetchRootFolderId(); // 루트 폴더 ID 가져오기
    document.addEventListener("click", this.handleClickOutside); //드롭다운 메뉴 외부 클릭 시 닫기
    // console.log("splitActiveTab 확인용 >> ", this.splitActiveTab);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  created() {
    this.fetchChannelInfo(this.getChannelId);
  },
  methods: {
    ...mapActions(["setWorkspaceInfoActions", "setChannelNameInfoActions", "setChannelDescInfoActions"]),
            handleClickOutside(event) {
      // 드롭다운 버튼을 클릭한 경우는 무시
      const dropdownToggle = this.$el.querySelector(".mdi-dots-vertical");
      const dropdown = this.$el.querySelector(".dropdown-menu");

      if (
        (dropdownToggle && dropdownToggle.contains(event.target)) ||
        (dropdown && dropdown.contains(event.target))
      ) {
        return;
      }

      this.isDropdownOpen = false;
    },

    async loadChannelMembers() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/channel/member/list/${this.getChannelId}`
        );
        this.channelMembers = response.data.result; // 채널 멤버 데이터 설정
      } catch (error) {
        console.error("채널 멤버 불러오기 중 오류 발생", error);
      }
    },
    moveMenu(name) {
      if (name === 'drive') {
        if (!this.rootFolderId) {
          alert("루트 폴더 ID를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
          return;
        }
        const folderId = this.rootFolderId;
        this.$router.push(`/channel/${this.getChannelId}/drive/view/${folderId}`);
      } else {
        this.$router.push(`/channel/${this.getChannelId}/${name}/view`);
      }
    },
    // rootFolderId를 불러오는 메서드 추가
    async fetchRootFolderId() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/channel/${this.getChannelId}/drive/folder/root-folder`
        );
        this.rootFolderId = response.data.result.nowFolderId; // 루트 폴더 ID를 설정
      } catch (error) {
        console.error("루트 폴더 ID를 불러오는 중 오류 발생", error);
      }
    },
    goToSplitView() {
      this.$router.push(`/channel/${this.getChannelId}/split-view`);
    },
    closeSplitView(splitName) {
      console.log(splitName, " 화면 닫으려고 함!!");
      console.log(this.tcdTabs, " 화면 닫으려고 함!!222");

      let objKey = "";
      if (splitName == "left") {
        // left를 닫아서 right 주소로 이동
        objKey = "rightTab";
      } else if (splitName == "right") {
        // right 닫아서 left 주소로 이동
        objKey = "leftTab";
      } else {
        console.error("잘못된 tab화면 닫음 요청입니다.");
        return false;
      }

      let routerUrl = "";
      let routeQuery = "";
      if (this.splitActiveTab[objKey] == "thread") {
        routerUrl = `/channel/${this.getChannelId}/thread/view`;
      } else if (this.splitActiveTab[objKey] == "canvas") {
        if(this.tcdTabs.canvasId){
          routeQuery = `/${this.tcdTabs.canvasId}`;
        }
        routerUrl = `/channel/${this.getChannelId}/canvas/view${routeQuery}`;
      } else if (this.splitActiveTab[objKey] == "drive") {
        if(this.tcdTabs && this.tcdTabs.driveFolderId){
          routeQuery = `/${this.tcdTabs.driveFolderId}`;
        }
        routerUrl = `/channel/${this.getChannelId}/drive/view${routeQuery}`;
      } else {
        console.error("잘못된 objKey 요청입니다.");
        return false;
      }
      this.$router.push(routerUrl);
    },
    openChannelMemberInviteModal() {
      this.isChannelMemberModalOpen = false; // 일단 false로 설정하여 초기화
      this.$nextTick(() => {
        this.isChannelMemberModalOpen = true; // 모달 열기
        // console.log("openInviteModal");
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
        if (
          !this.getWorkspaceId ||
          this.getWorkspaceId == undefined ||
          this.getWorkspaceId == ""
        ) {
          return false;
        }
        // 섹션 리스트에서 전체 채널 목록을 가져오기
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/section/list/${this.getWorkspaceId}`
        );

        // 모든 섹션의 채널 리스트 합치기
        const allChannels = response.data.result.flatMap(
          (section) => section.channelList
        );

        if (allChannels.length <= 1) {
          alert("마지막 채널은 삭제할 수 없습니다.");
          return; // 마지막 채널이면 삭제를 중단
        }

        // 삭제 확인
        if (confirm("정말로 채널을 삭제하시겠습니까?")) {
          await axios.delete(
            `${process.env.VUE_APP_API_BASE_URL}/channel/delete/${this.getChannelId}`
          );
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
      if (this.updateChannelInfo.channelName.length == 0) {
        return ;
      }
      const data = {
        channelName: this.updateChannelInfo.channelName,
        channelInfo: this.updateChannelInfo.channelInfo,
      };
      try {
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/channel/update/${this.getChannelId}`,
          data
        );
        alert("채널 수정이 완료되었습니다.");
        // this.$router.push("/workspace").then(() => {
        //   location.reload(); // URL 변경 후 페이지 새로고침
        // })
        const result = response.data.result;
        this.setChannelNameInfoActions(result.channelName);
        this.setChannelDescInfoActions(result.channelInfo);
        this.channelDialog = false;
        this.$router.push(`/channel/${this.getChannelId}/thread/view`);
      } catch (error) {
        console.error("채널 수정 에러", error);
      }
    },
    async fetchChannelInfo(channelId) {
      const chInfo = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/channel/detail/${channelId}`
      );
      this.updateChannelInfo.isPublic = Number(chInfo.data.result.isPublic);
      console.log("기존 수정 전 공개범위", Number(chInfo.data.result.isPublic));

      const result = await fetchChannelMemberInfo(channelId); // 모듈로 함수 호출
      if (result && result.isBookmark) {
        this.isBookmarked = true;
      } else {
        this.isBookmarked = false;
      }
    },
    async toggleBookmark(channelId) {
      // this.toggleBookmarkIsLoading = true;
      try {
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/channel/member/bookmark/${channelId}`
        );
        if (response.data.result) {
          this.isBookmarked = true;
        } else {
          this.isBookmarked = false;
        }
        const tempWsId = this.getWorkspaceId;
        this.setWorkspaceInfoActions(null).then(() => {
          this.setWorkspaceInfoActions(tempWsId); // workspaceId 재할당을 통한 좌측 영역만 리로드
        });
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
    async changeChannelAccessLevel() {
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/channel/access`, {
            channelId: this.getChannelId,
            isPublic: Number(this.currentAccessLevel),
          }
        );
        alert("공개범위가 변경되었습니다.");
        this.isDropdownOpen = false;
        this.currentAccessLevel = null;
        this.channelAccessDialog = false;

      window.location.reload();
      } catch (error) {
        console.error("채널 공개 범위 수정 중 오류 발생", error);
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
        color: #a4a4a4;
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
        color: #000000;
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
      overflow: hidden;
      border-radius: 10px;
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

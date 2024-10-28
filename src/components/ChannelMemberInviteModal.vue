<template>
  <div v-if="isModalOpen" class="modal channelMemeberModal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <!-- 검색창 헤더 -->
      <header>
          <h3># {{ getChannelName }} 멤버 초대</h3>
        <v-icon @click="closeModal" class="close-button">mdi-close</v-icon>
      </header>
      <br>
      <!-- 멤버 검색창 -->
      <div class="search-bar">
        <v-text-field
          v-model="searchKeyword"
          variant="outlined"
          placeholder="멤버 찾기"
          @input="debouncedSearchMembers"
          append-icon="mdi-magnify"
        ></v-text-field>
      </div>
      <div class="member-list">
        <!-- 현재 채널에 있는 멤버 목록 -->
        <h4>현재 채널 멤버</h4>
        <div v-if="isLoadingMembers">로딩 중...</div>
        <div v-else>
          <div v-for="member in channelMembers" :key="member.id" class="member-item">
            <img :src="member.memberInfo.profileImage || require(`@/assets/images/profile/profile${member.memberInfo.workspaceMemberId % 10}.jpg`)" alt="프로필 이미지" class="profile-image" />
            <div class="member-title" style="width: 100%; margin-left: 12px;">
              <v-list-item-title>{{ member.memberInfo.memberName || '이름 없음' }}<v-icon v-if="member.channelRole === 'MANAGER'" color="#ffbb00">mdi-crown</v-icon></v-list-item-title>
            </div>
            <div>
               <v-icon v-if="getChannelRole === 'MANAGER'" icon="mdi-dots-vertical" @click="toggleDropdown(member.id)">
          </v-icon>
            </div>
          </div>
        </div>    

        <v-divider class="my-3"></v-divider>

        <!-- 멤버 검색 결과 -->
          <h4>멤버 검색 결과</h4>
        <div v-if="isLoading">로딩 중...</div>
        <div v-else>
          <div v-for="member in filteredSearchResults" :key="member.workspaceMemberId" class="member-item">
            <img :src="member.profileImage || require(`@/assets/images/profile/profile${member.workspaceMemberId % 10}.jpg`)" alt="프로필 이미지" class="profile-image" />
            <div class="member-title"  style="width: 100%; margin-left: 12px;">
              <v-list-item-title>{{ member.memberName || '이름 없음' }}</v-list-item-title>
              <v-list-item-title style="font-size: 10px;">{{ member.email }}</v-list-item-title>
            </div>
            <div class="invite-button-wrap">
              <v-btn v-if="!isMemberInChannel(member)" @click="inviteMember(member.workspaceMemberId)" icon="mdi-account-plus" class="invite-button">
              </v-btn>
            </div>
          </div>
        </div>

    <div v-if="isDropdownOpen" class="dropdown-menu" @click.stop>
      <ul>
        <li @click="(channelRoleDialog = true)">권한 변경하기</li>
        <li @click="removeMember">회원 내보내기</li>
      </ul>
    </div>

  <v-dialog v-model="channelRoleDialog" width="auto" class="channelRoleDialog">
  <v-card max-width="400">
    <v-card-title>채널 회원 관리</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="changeRole">
              <v-select
                v-model="currentMemberRole"
                :items="roleOptions"
                item-title="text"
                item-value="value"
                dense
                outlined
                label="선택"
              ></v-select>
      <v-btn color="#3a8bcd" text="변경" type="submit"></v-btn>
      <v-btn text="닫기" @click="(channelRoleDialog = false)"></v-btn>
    </v-form>
      </v-card-text>
  </v-card>
</v-dialog>


      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { debounce } from 'lodash'; // lodash의 debounce를 import
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      isModalOpen: true,
      searchKeyword: '',
      searchResults: [],
      channelMembers: [], // 채널 멤버 목록 추가
      isLoading: false,
      isLoadingMembers: false, // 채널 멤버 로딩 상태
      isDropdownOpen: false, // 드롭다운 상태 관리
      currentMemberId: null,
      channelRoleDialog: false,
      currentMemberRole: null,
      roleOptions: [
      { text: '채널 매니저', value: 'MANAGER' },
      { text: '일반 회원', value: 'USER' },
    ],
    };
  },
  computed: {
    ...mapGetters(["getChannelId", "getChannelRole", "getChannelName", "getWorkspaceMemberId", ]),
    filteredSearchResults() {
      // 현재 채널에 속하지 않은 멤버만 필터링
      return this.searchResults.filter(member =>
        !this.channelMembers.some(channelMember => channelMember.memberInfo.memberId === member.workspaceMemberId)
      );
    }
  },
  methods: {
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
    closeModal() {
      this.isModalOpen = false;
    },
    async fetchChannelMembers() {
      this.isLoadingMembers = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/channel/member/list/${this.channelId}`);
        this.channelMembers = response.data.result;
        console.log('채널 멤버 목록:', this.channelMembers);
      } catch (error) {
        console.error('채널 멤버 목록을 불러오는 중 오류 발생', error);
      } finally {
        this.isLoadingMembers = false;
      }
    },
    async searchMembers() {
      if (this.searchKeyword.trim() === '') return;

      this.isLoading = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/search/members`, {
          params: {
            workspaceId: this.workspaceId,  // 워크스페이스 ID 전달
            keyword: this.searchKeyword,
            page: 0,
            size: 20
          }
        });
        this.searchResults = response.data.result.results;
        console.log('멤버 검색 결과:', this.searchResults);
      } catch (error) {
        console.error('멤버 검색 중 오류 발생', error);
      } finally {
        this.isLoading = false;
      }
    },
    // 현재 멤버가 채널에 있는지 확인하는 메서드
    isMemberInChannel(member) {
      return this.channelMembers.some(channelMember => {
        if (!channelMember.memberInfo) {
          console.warn(`memberInfo가 정의되지 않았습니다: ${channelMember}`);
          return false;
        }
        return channelMember.memberInfo.workspaceMemberId === member.workspaceMemberId;
      });
    },
    async inviteMember(memberId) {
      try {
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/channel/member/invite/${this.channelId}`, null, {
          params: {
            workspaceMemberId: memberId
          }
        });
        console.log('멤버 초대 응답:', response.data);

        alert('멤버가 성공적으로 초대되었습니다!');

        // 초대 후 채널 멤버 목록 다시 불러오기
        this.fetchChannelMembers();
      } catch (error) {
        console.error('멤버 초대 중 오류 발생', error);
      }
    },
    async changeRole() {
      try{
        await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/channel/member/role`,
          {
            id: this.currentMemberId,
            channelRole: this.currentMemberRole,
          }
        );
        alert("권한이 변경되었습니다.");
        this.isDropdownOpen = false;
        this.channelRoleDialog = false;
        this.currentMemberRole = null;
        this.currentMemberId = null;
        this.fetchChannelMembers();
      } catch (e) {
        console.error("실패", e);
        alert("권한 변경에 실패했습니다.");
      }
    },
    async removeMember() {
      try{
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/channel/member/delete/${this.currentMemberId}`);        
        alert("회원을 강제 퇴장시켰습니다.");
        this.currentMemberId = null;
        this.isDropdownOpen = false;
        this.channelRoleDialog = false;
        this.fetchChannelMembers();
      } catch (e) {
        console.error("실패", e);
        alert("회원 삭제에 실패했습니다.");
      }
    },
    toggleDropdown(chMemberId) {
      // 드롭다운이 열리고 닫히는지 로그 확인
      console.log("Dropdown toggle");
      this.isDropdownOpen = !this.isDropdownOpen;
      this.currentMemberId = chMemberId;
    },
  },
  created() {
    // searchMembers 메서드에 debounce 적용 (300ms 지연)
    this.debouncedSearchMembers = debounce(this.searchMembers, 300);
  },
  mounted() {
    this.fetchChannelMembers(); // 모달이 열릴 때 채널 멤버 목록 불러오기
  },
  props: {
    channelId: {
      type: Number,
      required: true
    },
    workspaceId: {
      type: Number,
      required: true
    }
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 5px;
  width: 400px;
  max-width: 90%;
  position: relative;
}

.modal-content header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}


.search-bar {
  display: flex; 
  justify-content: flex-start; 
  width: 100%; 
}

.member-list .member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px;
}

.member-list .member-item img {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

/* .member-info {
  flex-grow: 1;
  margin-left: 10px;
}

.member-info p {
  margin: 0;
} */

/* 초대 버튼과 가입됨 표시 스타일 */
.invite-button-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 20px;
}

.invite-button {
  padding: 5px 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.invite-button:hover {
  background-color: #45a049;
}

.search-bar input {
  padding: 10px; /* 내부 여백 */
  border: 1px solid #ccc; /* 테두리 설정 */
  border-radius: 4px; /* 모서리 둥글기 */
  outline: none; /* 포커스 시 기본 테두리 제거 */
}

</style>

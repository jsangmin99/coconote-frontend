<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <header>
        <h2>#멤버 초대</h2>
        <button @click="closeModal" class="close-button">X</button>
      </header>
      <div class="search-bar">
        <input type="text" v-model="searchKeyword" placeholder="멤버 찾기" @input="debouncedSearchMembers" />
      </div>
      <div class="member-list">
        <!-- 현재 채널에 있는 멤버 목록 -->
        <h3>현재 채널 멤버</h3>
        <div v-if="isLoadingMembers">로딩 중...</div>
        <div v-else>
          <div v-for="member in channelMembers" :key="member.id" class="member-item">
            <img :src="member.memberInfo.profileImage || defaultProfileImage" alt="프로필 이미지" class="profile-image" />
            <div class="member-info">
              <v-list-item-title>{{ member.memberInfo.nickname || '별명 없음' }}</v-list-item-title>
              <v-list-item-title>{{ member.memberInfo.memberName || '이름 없음' }}</v-list-item-title>
              <v-list-item-title>{{ member.memberInfo.workspaceMemberId }}</v-list-item-title>
              <v-list-item-title>역할: {{ member.channelRole }}</v-list-item-title>
            </div>
            <div v-if="getChannelRole === 'MANAGER'">
        <v-icon v-if="member.channelRole === 'USER'" @click="changeRole(member.id)">mdi-account-arrow-up</v-icon>
        <v-icon v-if="member.channelRole === 'MANAGER'" @click="changeRole(member.id)">mdi-account-arrow-down</v-icon>
        <v-icon @click="removeMember(member.id)">mdi-account-remove</v-icon>
            </div>
          </div>
        </div>    

        <!-- 멤버 검색 결과 -->
        <h3>멤버 검색 결과</h3>
        <div v-if="isLoading">로딩 중...</div>
        <div v-else>
          <div v-for="member in filteredSearchResults" :key="member.workspaceMemberId" class="member-item">
            <img :src="member.profileImage || defaultProfileImage" alt="프로필 이미지" class="profile-image" />
            <div class="member-info">
              <v-list-item-title>{{ member.nickname || '별명 없음' }}</v-list-item-title>
              <v-list-item-title>{{ member.memberName || '이름 없음' }}</v-list-item-title>
              <v-list-item-title>{{ member.email }}</v-list-item-title>
              <v-list-item-title>{{ member.workspaceMemberId }}</v-list-item-title>
            </div>
            <div class="invite-button-wrap">
              <button v-if="!isMemberInChannel(member)" @click="inviteMember(member.workspaceMemberId)" class="invite-button">
                초대
              </button>
              <span v-else>가입됨</span>
            </div>
          </div>
        </div>

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
      defaultProfileImage: 'https://via.placeholder.com/40' // 프로필 이미지 없을 때 기본 이미지
    };
  },
  computed: {
    ...mapGetters(["getChannelId", "getChannelRole"]),
    filteredSearchResults() {
      // 현재 채널에 속하지 않은 멤버만 필터링
      return this.searchResults.filter(member =>
        !this.channelMembers.some(channelMember => channelMember.memberInfo.memberId === member.workspaceMemberId)
      );
    }
  },
  methods: {
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
    async changeRole(chMemberId) {
      try{
        await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/channel/member/role/${chMemberId}`);
        alert("권한이 변경되었습니다.");
      } catch (e) {
        console.error("실패", e);
        alert("권한 변경에 실패했습니다.");
      }
      
    },
    async removeMember(chMemberId) {
      try{
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/channel/member/delete/${chMemberId}`);        
        alert("회원을 강제 퇴장시켰습니다.");

      } catch (e) {
        console.error("실패", e);
        alert("회원 삭제에 실패했습니다.");
      }
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
  padding: 20px;
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

.search-bar input {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
}

.member-list .member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.member-list .member-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.member-info {
  flex-grow: 1;
  margin-left: 10px;
}

.member-info p {
  margin: 0;
}

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
</style>

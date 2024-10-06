<template>
  <div v-if="isModalOpen" class="modal">
    <div class="modal-content">
      <header>
        <h2>#멤버 초대</h2>
        <button @click="closeModal">X</button>
      </header>
      <div class="search-bar">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="멤버 찾기"
          @input="debouncedSearchMembers"
        />
      </div>
      <div class="member-list">
        <!-- 현재 채널에 있는 멤버 목록 -->
        <h3>현재 채널 멤버</h3>
        <div v-if="isLoadingMembers">로딩 중...</div>
        <div v-else>
          <div v-for="member in channelMembers" :key="member.id" class="member-item">
            <img :src="member.memberInfo.profileImage || defaultProfileImage" alt="프로필 이미지" />
            <div class="member-info">
              <p>{{ member.memberInfo.nickname || '별명 없음' }}</p>
              <p>{{ member.memberInfo.memberName || '이름 없음' }}</p>
              <p>{{ member.memberInfo.workspaceMemberId }}</p>
              <p>역할: {{ member.channelRole }}</p>
            </div>
          </div>
        </div>

        <!-- 멤버 검색 결과 -->
        <h3>멤버 검색 결과</h3>
        <div v-if="isLoading">로딩 중...</div>
        <div v-else>
          <div v-for="member in filteredSearchResults" :key="member.workspaceMemberId" class="member-item">
            <img :src="member.profileImage || defaultProfileImage" alt="프로필 이미지" />
            <div class="member-info">
              <p>{{ member.nickname || '별명 없음' }}</p>
              <p>{{ member.memberName || '이름 없음' }}</p>
              <p>{{ member.email }}</p>
              <p>{{ member.workspaceMemberId }}</p>
            </div>
            <button v-if="!isMemberInChannel(member)" @click="inviteMember(member.workspaceMemberId)">
                초대
              </button>
              <span v-else>가입됨</span> <!-- 이미 가입된 멤버를 표시 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { debounce } from 'lodash'; // lodash의 debounce를 import

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
      // 먼저 채널 멤버 목록을 콘솔로 확인해 봅니다.
      console.log('채널 멤버 목록:', this.channelMembers);

      // memberInfo와 memberId가 존재하는지 확인하고 안전하게 접근
      return this.channelMembers.some(channelMember => {
        if (!channelMember.memberInfo) {
          console.warn(`memberInfo가 정의되지 않았습니다: ${channelMember}`);
          return false;
        }
        console.log('불린 확인 : ' + channelMember.memberInfo.workspaceMemberId +  member.workspaceMemberId);
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
        
        alert('멤버가 성공적으로 초대되었습니다!');
        
        // 서버로부터 받은 초대된 멤버의 정보를 채널 멤버 목록에 추가
        const invitedMember = response.data.result;
        if (invitedMember) {
          this.channelMembers.push(invitedMember);
        }
      } catch (error) {
        console.error('멤버 초대 중 오류 발생', error);
      }
    }
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
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
  max-width: 90%;
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
</style>

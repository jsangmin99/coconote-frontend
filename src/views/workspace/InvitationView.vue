<template>
  <div class="invitation-page">
    <div class="invitation-card">
      <h1>워크스페이스 초대 확인</h1>
      <p>초대를 수락하시겠습니까?</p>
      <div class="actions">
        <button @click="acceptInvitation" :disabled="loading" class="accept-btn">가입하기</button>
        <button @click="declineInvitation" class="decline-btn">거절하기</button>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      loading: false,
      successMessage: '',
      errorMessage: '',
    };
  },
  mounted() {
    const wsRole = localStorage.getItem('accessToken');
    if (!wsRole || wsRole === 'null') {
      const currentUrl = this.$route.fullPath; // 현재 URL 저장
      localStorage.setItem('redirectUrl', currentUrl); // 리다이렉트 URL 저장
      this.$router.push({ path: '/login' }); // 로그인 페이지로 이동하며 현재 URL 전달
    }
  },

  methods: {
    async acceptInvitation() {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const token = this.$route.query.token; // 초대 링크의 JWT 토큰

      try {
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/workspace/invite/accept?token=${token}`);
        this.successMessage = response.data.status_message;
        window.location.href = '/workspace/first'; // 메인 페이지로 이동
      } catch (error) {
        this.errorMessage = error.response ? error.response.data.status_message : '가입 처리에 실패했습니다.';
      } finally {
        this.loading = false;
      }
    },
    declineInvitation() {
      // 초대 거절 처리 로직
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
.invitation-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f4ff;
}

.invitation-card {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.invitation-card h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.invitation-card p {
  font-size: 16px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.accept-btn, .decline-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.accept-btn {
  background-color: #4caf50;
  color: white;
}

.accept-btn:hover {
  background-color: #45a049;
}

.decline-btn {
  background-color: #f44336;
  color: white;
}

.decline-btn:hover {
  background-color: #e41f20;
}

.success-message {
  margin-top: 20px;
  color: green;
}

.error-message {
  margin-top: 20px;
  color: red;
}
</style>

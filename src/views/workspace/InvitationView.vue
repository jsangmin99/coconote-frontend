<template>
    <div class="invitation-page">
      <h1>워크스페이스 초대 확인</h1>
      <p>초대를 수락하시겠습니까?</p>
      <div class="actions">
        <button @click="acceptInvitation" :disabled="loading">가입하기</button>
        <button @click="declineInvitation">거절하기</button>
      </div>
  
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
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
    methods: {
      async acceptInvitation() {
        this.loading = true;
        this.successMessage = '';
        this.errorMessage = '';
  
        const token = this.$route.query.token; // 초대 링크의 JWT 토큰
  
        try {
          const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/workspace/invite/accept?token=${token}`);
          this.successMessage = response.data.status_message;
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
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  
  .success-message {
    color: green;
  }
  
  .error-message {
    color: red;
  }
  </style>
  
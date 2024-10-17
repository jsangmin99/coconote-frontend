<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Log In</h1>
      <div class="login-buttons">
        <!-- 구글 공식 로그인 버튼 -->
        <button @click="loginWithGoogle" class="google-login">
          <img src="@/assets/images/google.png" alt="Sign in with Google" />
        </button>

        <!-- 카카오 공식 로그인 버튼 -->
        <button @click="loginWithKakao" class="kakao-login">
          <img src="@/assets/images/kakao_login_medium_narrow.png" alt="Login with Kakao" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    loginWithGoogle() {
      window.location.href = `${process.env.VUE_APP_BASE_URL}/oauth2/authorization/google`;
    },
    loginWithKakao() {
      window.location.href = `${process.env.VUE_APP_BASE_URL}/oauth2/authorization/kakao`;
    },
  },
};
</script>

<style scoped>
/* 배경색을 밝고 흐릿한 남색 계열로 설정 */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #e8f3ff; /* 밝고 흐릿한 남색 계열 */
}

/* 카드 디자인: 크기를 3분의 2로 줄임 */
.login-card {
  background-color: white;
  padding: 1.5rem; /* 패딩을 줄여 카드 크기를 줄임 */
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  text-align: center;
  width: 100%;
  max-width: 250px; /* 카드의 최대 너비를 줄여 3분의 2 크기로 설정 */
}

/* 로그인 버튼 레이아웃 */
.login-buttons {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.google-login img,
.kakao-login img {
  width: 150px; /* 버튼 너비를 150px로 조정 */
  height: 35px; /* 버튼 높이를 35px로 조정 */
  cursor: pointer;
}

h1 {
  font-size: 1.5rem; /* 카드 크기에 맞춰 폰트 크기를 약간 줄임 */
  /* margin-bottom: 1rem; */
  color: #333;
}
</style>

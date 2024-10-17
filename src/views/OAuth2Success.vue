<script>
export default {
  data() {
    return {
      memberInfo: null, // API 응답 저장
    };
  },
  mounted() {
    this.handleOAuth2Success();
  },
  methods: {
    handleOAuth2Success() {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("accessToken");
      const refreshToken = urlParams.get("refreshToken");

      if (accessToken && refreshToken) {
        try {
          this.saveTokens(accessToken, refreshToken);
          const redirectUrl = localStorage.getItem('redirectUrl');// 로컬 스토리지에서 redirectUrl을 가져온다.
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl'); // URL 사용 후 제거
            this.$router.push(redirectUrl); // 저장된 URL로 이동
          } else {
            this.$router.push('/workspace'); // 저장된 URL이 없으면 워크스페이스로 이동
          }
        } catch (error) {
          console.error("토큰 저장 중 에러 발생:", error);
        }
      } else {
        console.error("토큰이 존재하지 않습니다.");
      }
    },
    saveTokens(accessToken, refreshToken) {
      try {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        console.log("Tokens saved successfully");
      } catch (error) {
        console.error("로컬 스토리지 저장 실패:", error);
      }
    },
  },
};
</script>
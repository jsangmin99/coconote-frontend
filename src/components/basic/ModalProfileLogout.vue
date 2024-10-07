<template>
  <v-dialog v-model="internalDialog" max-width="200">
    <v-card class="custom-card">
      <!-- 커스텀 클래스 추가 -->
      <v-card-title class="custom-title">{{ nickname }}</v-card-title>
      <!-- 커스텀 클래스 추가 -->
      <v-card-text>
        <v-btn @click="viewProfile" block class="custom-btn">프로필 관리</v-btn>
        <v-btn @click="logout" block class="custom-btn">로그아웃</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex"; // Vuex의 getters를 가져오기 위해 추가

export default {
  name: "ModalProfileLogout",
  props: {
    dialog: Boolean, // 부모에서 dialog 상태를 전달받음
  },
  data() {
    return {
      internalDialog: this.dialog, // 내부 상태로 모달 관리
    };
  },
  computed: {
    // Vuex에서 nickname을 가져옴
    ...mapGetters(["getNickname"]),
    nickname() {
      return this.getNickname || "Guest"; // 닉네임이 없으면 기본 값으로 'Guest'
    },
  },
  watch: {
    // 부모로부터 받은 dialog prop의 변화 감지
    dialog(val) {
      this.internalDialog = val;
    },
    // 내부 dialog 상태 변경 시 부모로 상태를 전달
    internalDialog(val) {
      this.$emit("update:dialog", val);
    },
  },
  methods: {
    // 모달 닫기: 부모 컴포넌트에 상태 변경 알림
    closeDialog() {
      this.$emit("update:dialog", false); // 부모 컴포넌트로 'dialog' 상태를 전달
    },
    async viewProfile() {
      try {
        const workspaceId = this.$store.getters.getWorkspaceId;

        // 서버로 요청 보내기
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/member/${workspaceId}`
        );

        // 요청이 성공하면 response 데이터 출력
        console.log("[ModalProfileLogout] Workspace Detail:", response.data.result);
        this.closeDialog();
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    },
    logout() {
      try {
        // localStorage에서 필요한 정보만 삭제
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("nickname");
        localStorage.removeItem("workspaceMemberId");
        localStorage.removeItem("profileImage");
        localStorage.removeItem("workspaceId");
        localStorage.removeItem("workspaceName");

        console.log("Logged out successfully");
        // 로그아웃 후 리다이렉션
        window.location.href = "/login";
      } catch (error) {
        console.error("Error during logout:", error);
      }
    },
  },
};
</script>

<style scoped>
.custom-card {
  background-color: white !important; /* 흰 바탕 */
  color: black !important; /* 검은색 글씨 */
}

.custom-title {
  background-color: white !important; /* 흰 바탕 */
  color: black !important; /* 타이틀 글씨 검은색 */
}

.custom-btn {
  background-color: white !important; /* 흰 바탕 */
  color: black !important; /* 버튼 텍스트 검은색 */
}
</style>

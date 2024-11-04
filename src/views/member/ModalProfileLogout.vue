<template>
  <v-card v-if="internalDialog" class="custom-card" :style="{ top: `${modalPosition.top}px`, left: `${modalPosition.left}px`, position: 'absolute' }">
    <div class="custom-title">{{ nickname }}</div>
    <v-divider></v-divider>
    <div @click="viewProfile" block class="custom-btn">프로필 관리</div>
    <div @click="logout" block class="custom-btn">로그아웃</div>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ModalProfileLogout",
  props: {
    dialog: Boolean, // 부모에서 dialog 상태를 전달받음
    modalPosition: Object, // 부모로부터 모달 위치 전달
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
    viewProfile() {
      this.$emit("update:dialog", false);
      this.$router.push({ name: "ProfileManagement" });
    },
    logout() {
      try {
        this.$emit("update:dialog", false);
        localStorage.clear();
        window.location.href = "/";
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
  padding: 10px; /* 패딩을 줄이기 */

}

.custom-title {
  background-color: white !important; /* 흰 바탕 */
  margin-bottom: 5px;
  color: black !important; /* 타이틀 글씨 검은색 */
  font-size: small;
  font-weight: bold; /* 글씨 두껍게 */
  text-align: left; /* 왼쪽 정렬 */

}

.custom-btn {
  background-color: white !important; /* 흰 바탕 */
  color: black !important; /* 버튼 텍스트 검은색 */
  margin-top: 5px;
  font-size: small;
  cursor: pointer; /* 손 모양 커서 설정 */
}

.custom-btn:hover {
  background-color: #ecececf2 !important; /* 호버 시 밝은 회색 배경 */
  /* color: white !important; 호버 시 텍스트 흰색 */
  border-radius: 5px !important;
}

.custom-card {
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  width: 150px;
  position: absolute; /* 위치를 절대값으로 설정 */
}
</style>

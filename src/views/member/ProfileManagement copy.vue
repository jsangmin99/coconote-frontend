<template>
  <v-container style="max-height: 90vh; overflow: auto;">
    <v-card style="max-height: 100%; overflow-y: auto;">
      <v-card-title>Profile</v-card-title>
      <v-card-text>
        <v-form ref="form" lazy-validation>

          <!-- 프로필 이미지 미리보기 (클릭하면 파일 입력창 열기) -->
          <v-img :src="previewImage || profileData.profileImage" alt="Profile Image Preview" class="profile-image"
            @click="triggerFileInput"></v-img>

          <!-- 숨겨진 파일 입력 필드 -->
          <input type="file" ref="fileInput" accept="image/*" @change="onFileSelected" style="display: none" />

          <!-- 닉네임 수정 필드 -->
          <v-text-field label="Nickname" v-model="profileData.nickname" :rules="nameRules" required></v-text-field>

          <!-- 멤버 이름 표시 -->
          <v-text-field label="Name" v-model="profileData.memberName"></v-text-field>

          <!-- 직책 (수정 가능) -->
          <v-text-field label="Position" v-model="profileData.position"></v-text-field>

          <!-- 역할 (수정 불가) -->
          <v-text-field label="Role" v-model="profileData.wsRole" readonly></v-text-field>

          <!-- 필드 (수정 가능) -->
          <v-text-field label="Department" v-model="profileData.field"></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <!-- <v-spacer></v-spacer> -->
        <v-btn @click="saveProfile">저장</v-btn>
        <v-btn text @click="cancel">취소</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import axios from "axios";
import { mapActions } from 'vuex';

export default {
  name: "ProfileManagement",
  data() {
    return {
      profileData: {
        nickname: "",
        profileImage: null,
        memberName: "", // 멤버 이름
        position: "", // 직책
        wsRole: "", // 역할
        field: "", // 분야
      },
      previewImage: null, // 미리보기 이미지를 저장할 변수
      selectedFile: null, // 업로드된 파일을 저장할 변수
      workspaceMemberId: null, // workspaceMemberId를 저장할 변수
      nameRules: [(v) => !!v || "닉네임을 입력해주세요."], // 닉네임 유효성 검사
    };
  },
  mounted() {
    // 페이지 로드 시 localStorage에서 profileImage 불러오기
    const localProfileImage = this.$store.getters.getProfileImage;
    console.log("mounted() -> localProfileImage = this.$store.getters.getProfileImage : ", localProfileImage);
    if (localProfileImage) {
      this.profileData.profileImage = localProfileImage;
    }
    this.workspaceMemberId = this.$store.getters.getWorkspaceMemberId; // workspaceMemberId 가져오기
    this.fetchProfileData(); // 페이지 로드 시 프로필 데이터 요청
  },
  methods: {
    ...mapActions([
      "setMemberInfoActions", // Vuex 액션 등록
    ]),
    // 프로필 정보 요청
    async fetchProfileData() {
      if (!this.workspaceMemberId) {
        console.error("workspaceMemberId가 없습니다.");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/member/${this.workspaceMemberId}`
        );

        if (response.data.result) {

          // 서버로부터 받은 데이터를 profileData에 저장
          const result = response.data.result;
          this.profileData.nickname = result.nickname;
          this.profileData.memberName = result.memberName;
          this.profileData.position = result.position;
          this.profileData.wsRole = result.wsRole;
          this.profileData.field = result.field;
          if (!this.profileData.profileImage) {
            this.profileData.profileImage = result.profileImage;
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    },

    // 이미지 클릭 시 숨겨진 파일 입력창 열기
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    // 파일 선택 시 호출되는 메소드
    async onFileSelected(event) {
      // 파일 선택 확인
      if (!event || !event.target || !event.target.files || event.target.files.length === 0) {
        console.error("No file selected or event is invalid.");
        return;
      }

      // 이전 미리보기 URL을 해제하여 메모리 누수 방지
      if (this.previewImage) {
        URL.revokeObjectURL(this.previewImage);
      }

      // 파일 정보 추출 및 디버깅 로그
      const selectedFile = event.target.files[0]; // Event 객체에서 파일 추출

      // 브라우저에서 미리보기 이미지 생성
      this.previewImage = URL.createObjectURL(selectedFile);
      this.selectedFile = selectedFile; // 나중에 저장할 파일
    },

    // 프로필 정보 저장 (서버로 업데이트 요청)
    async saveProfile() {
      if (!this.workspaceMemberId) {
        console.error("workspaceMemberId가 없습니다.");
        return;
      }

      if (this.$refs.form.validate()) {
        try {

          let fileUrl = this.profileData.profileImage; // 기존 profileImage를 유지

          // 파일이 선택된 경우 presigned URL 요청 후 파일 업로드
          if (this.selectedFile) {
            const fileRequest = [
              {
                fileName: this.selectedFile.name,
                fileSize: this.selectedFile.size,
              },
            ];

            const response = await axios.post(
              `${process.env.VUE_APP_API_BASE_URL}/files/presigned-urls`,
              fileRequest
            );

            const result = response.data.result;
            const presignedUrl = Object.values(result)[0];

            // S3에 파일 업로드
            await axios.put(presignedUrl, this.selectedFile, {
              headers: {
                "Content-Type": this.selectedFile.type,
              },
            });

            // 업로드된 파일의 URL 추출
            fileUrl = presignedUrl.split('?')[0];
          }

          // 프로필 데이터 업데이트 시 파일 URL 설정
          this.profileData.profileImage = fileUrl;

          // 프로필 업데이트 요청
          const updateResponse = await axios.patch(
            `${process.env.VUE_APP_API_BASE_URL}/workspace/member/update/${this.workspaceMemberId}`,
            this.profileData
          );

          const memberInfo = {
            workspaceMemberId: updateResponse.data.result.workspaceMemberId,
            profileImage: updateResponse.data.result.profileImage,
            nickname: updateResponse.data.result.nickname,
            name: updateResponse.data.result.name,
          };

          this.setMemberInfoActions(memberInfo);
          localStorage.setItem('nickname', memberInfo.nickname);
          localStorage.setItem('profileImage', memberInfo.profileImage);

          // 이후 업로드가 완료되면
          URL.revokeObjectURL(this.previewImage);

          console.log("Profile updated and localStorage set.");

        } catch (error) {
          console.error("Error updating profile:", error);
        }
      }
    },

    cancel() {
      this.$router.push("/"); // 취소 시 홈 페이지로 이동
    },
  },
};
</script>

<style scoped>
.profile-image {
  width: 150px;
  /* 이미지의 가로 크기 */
  height: 150px;
  /* 이미지의 세로 크기 */
  border-radius: 50%;
  /* 이미지를 동그랗게 만듦 */
  object-fit: cover;
  /* 이미지가 부모 요소 크기에 맞게 잘림 */
  border: 2px solid #ddd;
  /* 테두리 추가 */
  margin-bottom: 20px;
  /* 아래쪽 여백 */
  cursor: pointer;
}
</style>

<template>
  <v-container class="main-container">
    <v-card style="max-height: 100%; overflow-y: auto;">
      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-row>
            <!-- 이미지 미리보기 컬럼 -->
            <v-col cols="12" sm="6" class="d-flex justify-center align-start">
              <div class="image-container">
                <v-img :src="previewImage || profileData.profileImage" alt="Profile Image Preview" class="profile-image"
                  @click="triggerFileInput"></v-img>
                <input type="file" ref="fileInput" accept="image/*" @change="onFileSelected" style="display: none" />
              </div>
            </v-col>

            <!-- 이름과 닉네임 필드 컬럼 -->
            <v-col cols="12" sm="6">
              <v-text-field label="Nickname" v-model="profileData.nickname" :rules="nameRules" required clearable
                rounded variant="outlined" class="common-text-field rounded"></v-text-field>
              <v-text-field label="Name" v-model="profileData.memberName" variant="outlined" clearable rounded
                class="common-text-field rounded"></v-text-field>
            </v-col>
          </v-row>

          <!-- 다른 필드들을 위한 또 다른 v-row -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field label="Department" v-model="profileData.field" clearable rounded variant="outlined"
                prepend-inner-icon="mdi-domain" class="common-text-field rounded"></v-text-field>
              <v-text-field label="Position" v-model="profileData.position" clearable rounded variant="outlined"
                prepend-inner-icon="mdi-briefcase-outline" class="common-text-field rounded"></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field label="Role" v-model="profileData.wsRole" readonly rounded variant="outlined"
                prepend-inner-icon="mdi-account-supervisor" class="common-text-field rounded"></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top: 0px;">
            <v-col>
              <v-textarea label="Infomation" rounded rows="2" variant="outlined" style="color: #6495ED;">
              </v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="my-card-action">
        <v-spacer></v-spacer>
        <v-btn class="action-button" @click="saveProfile">
          저장
        </v-btn>
      </v-card-actions>


    </v-card>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';
import ProfileMethods from './ProfileMethods';

export default {
  name: "ProfileManagement",
  mixins: [ProfileMethods],
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
    computed: {
    ...mapGetters([
      "getWorkspaceMemberId",
    ]),
  },
  mounted() {
    // 페이지 로드 시 localStorage에서 profileImage 불러오기
    const localProfileImage = this.$store.getters.getProfileImage;
    if (localProfileImage == null || localProfileImage == 'null') {
      this.previewImage = require(`@/assets/images/profile/profile${this.getWorkspaceMemberId % 10}.jpg`);
    }
    //console.log("mounted() -> localProfileImage = this.$store.getters.getProfileImage : ", localProfileImage);
    if (localProfileImage) {
      this.profileData.profileImage = localProfileImage;
    }
    this.workspaceMemberId = this.$store.getters.getWorkspaceMemberId; // workspaceMemberId 가져오기
    this.fetchProfileData(); // 페이지 로드 시 프로필 데이터 요청
  },
};
</script>

<style scoped>
html,
body {
  height: 100%;
  margin: 0;
}

.main-container {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  /* Adjust based on your needs */
  overflow: auto;
}

.image-container {
  width: 150px;
  /* 이미지 너비 고정 */
}

.profile-image {
  width: 100%;
  /* 이미지의 가로 크기 */
  height: 150px;
  /* 이미지의 세로 크기 */
  border-radius: 15px;
  /* 이미지를 동그랗게 만듦 */
  object-fit: cover;
  /* 이미지가 부모 요소 크기에 맞게 잘림 */
  border: 3px solid #ddd;
  /* 테두리 추가 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  /* 그림자 추가 */
  margin-bottom: 20px;
  /* 아래쪽 여백 */
  cursor: pointer;

}

.profile-image:hover {
  opacity: 0.7;
  /* 이미지가 흐릿해짐 */
  transform: scale(1.05);
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  /* 그림자 추가 */

  border-color: #6495ED;
  /* 에메랄드색으로 테두리 변경 */
}

.profile-image:hover::after {
  content: "Edit Profile";
  position: absolute;
  bottom: 30px;
  left: 32px;
  color: white;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 5px;
}

.common-text-field {
  color: #6495ED;
  /* 텍스트 색상 설정 */
}

.my-card-action {
  margin-right: 10px;
  margin-bottom: 10px;
  margin-top: -30px;
}

.action-button {
  background-color: rgb(66, 149, 237);
  color: white;
  font-weight: bold;
}
</style>
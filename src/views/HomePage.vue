<template>
  <div class="homeContainer">
    <v-app :theme="theme">
      <v-app-bar elevation="0" class="glass-effect">
        <v-toolbar-title class="text-h5 font-weight-bold">
          <v-icon large color="secondary" class="mr-2 animate-bounce"
            >mdi-leaf</v-icon
          >

          <span class="gradient-text">Coconote</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!isLoggedIn"
          @click="login"
          text
          color="secondary"
          class="text-capitalize font-weight-bold"
        >
          <v-icon left>mdi-login</v-icon>
          로그인
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          @click="logout"
          text
          color="secondary"
          class="text-capitalize font-weight-bold"
        >
          <v-icon left>mdi-logout</v-icon>
          로그아웃
        </v-btn>
        <!-- <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn> -->
      </v-app-bar>

      <v-main class="gradient-background app-main">
        <v-container fluid class="pa-2">
          <v-row align="center" justify="center" class="ma-0">
            <v-col cols="12" sm="10" md="8" lg="6" class="pa-4">
              <v-card
                elevation="10"
                class="text-center pa-6 rounded-xl glass-card"
                style="min-height: 400px"
              >
                <v-card-title class="text-h3 font-weight-bold mb-6">
                  협업의 새로운 차원
                  <span class="gradient-text d-block mt-2">Coconote</span>
                </v-card-title>
                <v-card-text class="text-body-1 mb-6">
                  <p class="mb-4">
                    노션의 문서 관리와 슬랙의 실시간 커뮤니케이션을 하나로.
                  </p>
                  <p>팀워크의 효율성을 극대화하세요.</p>
                </v-card-text>
                <v-btn
                  :to="isLoggedIn ? '/workspace' : '/login'"
                  x-large
                  rounded
                  color="secondary"
                  class="px-8 py-1 text-capitalize elevation-8 pulse-animation centered-btn"
                  depressed
                >
                  <span class="text-h6 font-weight-bold">
                    {{ isLoggedIn ? "대시보드로 이동" : "지금 시작하기" }}
                  </span>
                </v-btn>
                <br />
                <br />
                <v-chip class="mt-1" color="primary">
                  <v-icon left>mdi-account-group</v-icon>
                  현재 {{ onlineUsers }}명의 사용자가 접속 중
                </v-chip>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="ma-0 pa-4">
            <v-col cols="12">
              <h2 class="text-h4 text-center mb-4">주요 기능</h2>
              <br />
              <v-row>
                <v-col
                  v-for="feature in features"
                  :key="feature.title"
                  cols="12"
                  md="4"
                  class="mb-4"
                >
                  <v-card
                    elevation="10"
                    class="text-center pa-6 rounded-xl glass-card ma-t-4 ma-l-4"
                  >
                    <v-card-title class="text-h6">
                      <v-icon large left color="secondary">{{
                        feature.icon
                      }}</v-icon>
                      {{ feature.title }}
                    </v-card-title>
                    <v-card-text>{{ feature.description }}</v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-row class="ma-0 pa-4 justify-center">
            <v-col
              cols="12"
              md="10"
              class="d-flex flex-column align-items-center"
            >
              <h2 class="text-h4 mb-6 text-center">최근 업데이트</h2>
              <!-- 제목 중앙 정렬 -->
              <v-timeline align-top dense>
                <v-timeline-item
                  v-for="update in recentUpdates"
                  :key="update.date"
                  color="secondary"
                >
                  <v-card
                    class="glass-card"
                    style="max-width: 700px; margin: 0 auto"
                  >
                    <v-card-title class="text-h6">{{
                      update.title
                    }}</v-card-title>
                    <v-card-text>
                      {{ update.description }}
                      <div class="text-caption mt-2">{{ update.date }}</div>
                    </v-card-text>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
            </v-col>
            <!-- <v-col cols="12" md="6">
            <h2 class="text-h4 mb-6">뉴스레터 구독</h2>
            <v-card class="glass-card pa-4">
              <v-form @submit.prevent="subscribeNewsletter">
                <v-text-field
                  v-model="email"
                  label="이메일 주소"
                  type="email"
                  required
                  outlined
                  :rules="[v => !!v || '이메일은 필수입니다', v => /.+@.+\..+/.test(v) || '유효한 이메일을 입력해주세요']"
                ></v-text-field>
                <v-btn type="submit" color="secondary" block>구독하기</v-btn>
              </v-form>
            </v-card>
          </v-col> -->
          </v-row>
        </v-container>
      </v-main>

      <!-- <v-footer app color="primary" class="glass-effect justify-center">
      <span class="text-body-2">&copy; {{ new Date().getFullYear() }} Coconote. All rights reserved.</span>
    </v-footer> -->
    </v-app>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "vuetify";

const router = useRouter();
const theme = useTheme();

const isLoggedIn = ref(false);
// const email = ref('')
const onlineUsers = ref(0);

const features = [
  {
    title: "실시간 협업",
    icon: "mdi-account-group",
    description: "팀원들과 실시간으로 문서를 편집하고 의견을 나눌 수 있습니다.",
  },
  {
    title: "통합 커뮤니케이션",
    icon: "mdi-chat",
    description:
      "문서 내 채팅, 음성 및 화상 통화 기능으로 원활한 소통이 가능합니다.",
  },
  {
    title: "강력한 문서 관리",
    icon: "mdi-file-document",
    description: "직관적인 문서 구조화와 버전 관리 기능을 제공합니다.",
  },
];

const recentUpdates = [
  {
    title: "쓰레드 기능 추가",
    description: "쓰레드를 통해 자유롭게 커뮤니케이션 할 수 있습니다.",
    date: "2024-10-01",
  },
  {
    title: "캔버스 기능 추가",
    description: "캔버스를 통해 마크다운 형식으로 문서를 공유할수 있습니다..",
    date: "2024-10-01",
  },
  {
    title: "드라이브 기능 추가",
    description:
      "드라이블 통해 파일 이미지 등의 자료를 서로 공유 할수 있습니다.",
    date: "2024-10-01",
  },
];

const login = () => {
  router.push("/login");
};

const logout = () => {
  localStorage.clear();
  isLoggedIn.value = false;
  router.push("/");
};

const checkLoginStatus = () => {
  const accessToken = localStorage.getItem("accessToken");
  isLoggedIn.value = !!accessToken;
};

// const subscribeNewsletter = () => {
//   alert(`${email.value}로 뉴스레터 구독이 완료되었습니다!`)
//   email.value = ''
// }

// const toggleTheme = () => {
//   theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
// }

const simulateOnlineUsers = () => {
  setInterval(() => {
    onlineUsers.value = Math.floor(Math.random() * 1000) + 500;
  }, 5000);
};

onMounted(() => {
  checkLoginStatus();
  simulateOnlineUsers();
});
</script>

<style lang="scss">
.homeContainer {
  .app-main {
    height: calc(100vh - 64px);
    /* 64px is the height of the AppBar */
    overflow-y: auto;
  }

  /* 스크롤 바를 숨기기 */
  .app-main::-webkit-scrollbar {
    display: none;
  }

  .gradient-background {
    background: linear-gradient(135deg, #f0f2f5 0%, #e0e5ec 100%);
    /* Light neutral gradient */
  }

  /* Glass effect with a more subtle tint */
  .glass-effect {
    background: rgba(255, 255, 255, 0.1) !important;
    /* Very light glass background */
    backdrop-filter: blur(12px);
    /* Slight blur for clarity */
    border-bottom: 1px solid rgba(200, 200, 200, 0.2);
    /* Light gray border */
  }

  /* Glass card with a modern minimalist background */
  .glass-card {
    background: rgba(255, 255, 255, 0.2) !important;
    /* Clean, semi-transparent card */
    backdrop-filter: blur(12px);
    border: 1px solid rgba(240, 240, 240, 0.4);
    /* Light border for a refined look */
  }

  /* Gradient text with elegant, modern tones */
  .gradient-text {
    background: linear-gradient(to right, #495464, #bbbfca);
    /* Cool, muted tones */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .v-btn {
    color: #ffffff !important;
    background-color: #6b7280 !important;
    /* Neutral dark tone */
    transition: all 0.3s ease;
  }

  .v-btn:hover {
    background-color: #4b5563 !important;
    /* Slightly darker on hover */
    transform: translateY(-3px);
  }

  /* Refined icon color */
  .v-icon {
    color: #6b7280 !important;
    /* Neutral dark tone for icons */
  }

  /* Modify chip color to match the subtle theme */
  .v-chip {
    background-color: rgba(75, 85, 99, 0.8);
    /* Dark neutral tone for the chip */
    color: white !important;
  }

  /* Elevation for subtle depth */
  .v-card {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    /* Soft shadow for depth */
  }

  /* Typography adjustments for a clean look */
  .text-h6,
  .text-h5,
  .text-h4,
  .text-h2 {
    color: #374151;
    /* Clean, dark gray text */
    font-weight: 600;
  }

  .text-body-1 {
    color: #4b5563;
    /* Medium gray for body text */
  }

  /* Refined hover and focus effects for input fields */
  .v-text-field input {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .v-text-field input:hover,
  .v-text-field input:focus {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: #9ca3af;
    /* Light gray border on focus */
  }

  .centered-btn {
    display: block;
    /* Ensure the button takes up the correct space */
    text-align: center;
    /* Center the button text horizontally */
    min-width: 200px;
    /* Adjust the minimum width for the button */
    padding: 12px 24px;
    /* Adjust padding to ensure vertical centering */
  }

  .centered-btn .v-btn__content {
    display: inline-block;
    /* Use inline-block to ensure text alignment inside the button */
    vertical-align: middle;
    /* Vertically center the content inside the button */
    line-height: 1.5;
    /* Adjust line-height for better vertical alignment */
    text-align: center;
    /* Ensure text is centered */
  }

  .pulse-animation {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }

    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }

    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  .animate-bounce {
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }

    50% {
      transform: translateY(0);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }
}
</style>
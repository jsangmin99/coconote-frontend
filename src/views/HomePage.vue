<template>
  <div class="homePageContainer">
    <div class="carouselContainer">
      <swiper
        :direction="'vertical'"
        :slidesPerView="1"
        :spaceBetween="30"
        :mousewheel="true"
        :pagination="{
          clickable: true,
        }"
        :modules="modules"
        class="mySwiper"
        :autoplay="{
          delay: 200000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }"
      >
        <swiper-slide>
          <div class="itemContainer">
            <v-card
              elevation="10"
              style="background: none; box-shadow: none !important"
            >
              <v-card-title class="custom-title">
                협업의 새로운 차원
                <span class="gradient-text d-block mt-2">
                  <img
                    src="@/assets/images/logo_coconote.png"
                    alt="coconote logo"
                  />
                </span>
              </v-card-title>
              <v-card-text class="custom-text mt-4">
                <p class="mb-2">
                  노션의 문서 관리와 슬랙의 실시간 커뮤니케이션을 하나로.
                </p>
                <p>팀워크의 효율성을 극대화하세요.</p>
              </v-card-text>

              <br />
              <br />
              <v-chip class="mt-1" color="primary">
                <v-icon left>mdi-account-group</v-icon>
                현재 {{ onlineUsers }}명의 사용자가 접속 중
              </v-chip>
            </v-card>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div class="itemContainer type2">
            <div class="itemsWrap">
              <h2 class="text-h4 text-center mb-2">주요 기능</h2>
              <br />
              <v-col
                v-for="feature in features"
                :key="feature.title"
                cols="12"
                class="mb-2"
              >
                <div class="custom-card">
                  <h6 class="text-h6">
                    <v-icon large left color="secondary">{{
                      feature.icon
                    }}</v-icon>
                    {{ feature.title }}
                  </h6>
                  <p>{{ feature.description }}</p>
                </div>
              </v-col>
            </div>
          </div>
        </swiper-slide>
        <swiper-slide>
          <div class="itemContainer type3">
            <h2 class="text-h5 mb-4 text-center">주요기능</h2>
            <!-- 제목 중앙 정렬 -->
            <div class="cardWrap">
              <v-card
                class="glass-card"
                style="max-width: 700px; margin: 0 auto"
                v-for="update in recentUpdates"
                :key="update.date"
              >
                <v-card-title class="update-title">{{
                  update.title
                }}</v-card-title>
                <v-card-text class="update-text">
                  {{ update.description }}
                </v-card-text>
              </v-card>
            </div>
          </div>
        </swiper-slide>
        <!-- <swiper-slide>Slide 4</swiper-slide>
        <swiper-slide>Slide 5</swiper-slide>
        <swiper-slide>Slide 6</swiper-slide>
        <swiper-slide>Slide 7</swiper-slide>
        <swiper-slide>Slide 8</swiper-slide>
        <swiper-slide>Slide 9</swiper-slide> -->
      </swiper>
    </div>
    <div class="loginContainer">
      <div class="login-page">
        <div class="login-card">
          <h1>Log In</h1>
          <div class="login-buttons">
            <template v-if="!isLoggedIn">
              <button @click="loginWithGoogle" class="google-login">
                <img
                  src="@/assets/images/google.png"
                  alt="Sign in with Google"
                />
              </button>

              <!-- 카카오 공식 로그인 버튼 -->
              <button @click="loginWithKakao" class="kakao-login">
                <img
                  src="@/assets/images/kakao_login_medium_narrow.png"
                  alt="Login with Kakao"
                />
              </button>
            </template>
            <template v-else>
              <v-btn :to="'/workspace'" rounded="xl" color="blue-lighten-1">
                대시보드로 이동
              </v-btn>
              <v-btn
                color="grey-darken-1"
                rounded="xl"
                class="mt-2"
                @click="logout"
              >
                로그아웃
              </v-btn>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { Swiper, SwiperSlide } from "swiper/vue";
// import { Autoplay, Pagination, Navigation, Mousewheel } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/pagination";
// import "swiper/css/navigation";

import { Swiper, SwiperSlide } from "swiper/vue";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
// import "./style.css";
import { Mousewheel, Pagination, Autoplay } from "swiper/modules";

export default {
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    return {
      modules: [Mousewheel, Pagination, Autoplay],
    };
  },
  // components: {
  //   Swiper,
  //   SwiperSlide,
  // },
  // setup() {
  //   const onSwiper = (swiper) => {
  //     console.log(swiper);
  //   };
  //   const onSlideChange = () => {
  //     console.log("slide change");
  //   };
  //   return {
  //     modules: [Mousewheel, Autoplay, Pagination, Navigation],
  //     onSwiper,
  //     onSlideChange,
  //   };
  // },
  mounted() {
    this.onlineUsers = Math.floor(Math.random() * 1000) + 500;
    this.simulateOnlineUsers();
    this.checkLoginStatus();
  },
  data() {
    return {
      features: [
        {
          title: "실시간 협업",
          icon: "mdi-account-group",
          description:
            "팀원들과 실시간으로 문서를 편집하고 의견을 나눌 수 있습니다.",
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
      ],
      recentUpdates: [
        {
          title: "쓰레드 기능 추가",
          description: "쓰레드를 통해 자유롭게 커뮤니케이션 할 수 있습니다.",
          date: "2024-10-01",
        },
        {
          title: "캔버스 기능 추가",
          description:
            "캔버스를 통해 마크다운 형식으로 문서를 공유할수 있습니다..",
          date: "2024-10-01",
        },
        {
          title: "드라이브 기능 추가",
          description:
            "드라이블 통해 파일 이미지 등의 자료를 서로 공유 할수 있습니다.",
          date: "2024-10-01",
        },
      ],
      onlineUsers: 0,
      isLoggedIn: false,
    };
  },
  methods: {
    simulateOnlineUsers() {
      setInterval(() => {
        this.onlineUsers = Math.floor(Math.random() * 1000) + 500;
      }, 5000);
    },
    checkLoginStatus() {
      const accessToken = localStorage.getItem("accessToken");
      this.isLoggedIn = !!accessToken;
    },
    loginWithGoogle() {
      window.location.href = `${process.env.VUE_APP_BASE_URL}/oauth2/authorization/google`;
    },
    loginWithKakao() {
      window.location.href = `${process.env.VUE_APP_BASE_URL}/oauth2/authorization/kakao`;
    },
    logout() {
      localStorage.clear();
      this.isLoggedIn = false;
    },
  },
};
</script>

<style>
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  text-align: center;
  font-size: 18px;
  background: #fff;

  /* Center slide text vertically */
  display: flex;
  justify-content: center;
  align-items: center;
}

.swiper-slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

<style lang="scss">
.homePageContainer {
  display: flex;
  height: 100vh;
  .carouselContainer {
    background: #ffffff;
    flex: 2;
    max-width: 60vw;
    .custom-carousel {
      height: 100% !important;
    }
    .itemContainer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      overflow: auto;
      padding: 16px;
      .custom-title {
        padding: 0;
      }
      img {
        width: 80%;
        max-width: 50vw;
        margin: auto;
      }
      &.type2 {
        h2 {
          font-weight: bold;
          color: #69a0f2;
        }
        .itemsWrap {
          > * {
            padding: 12px 0 !important;
            margin-bottom: 8px;
          }
        }
      }
      &.type3 {
        width: 85%;
        h2 {
          font-weight: bold;
          color: #69a0f2;
        }
        .v-timeline--vertical.v-timeline {
          height: 70%;
        }
        .v-timeline-divider__dot--size-default {
          height: 16px;
          width: 16px;
          .v-timeline-divider__inner-dot {
            background-color: #69a0f2;
          }
        }
      }
      .cardWrap {
        display: grid;
        grid-gap: 12px;
        gap: 12px;
        grid-template-columns: 1fr 1fr;

        .glass-card {
          border: 1px solid #ebebeb;
          box-shadow: none !important;
          .update-title {
            font-size: 16px;
            color: #162138;
          }
          .update-text {
            font-size: 12px;
          }
        }
      }
    }
  }
  .loginContainer {
    background: #c9d5f1;
    flex: 1;
    min-width: 40vw;
    display: flex;
    align-items: center;
    justify-content: center;
    .login-page {
      width: 80%;
      max-width: 50vw;
    }
    .login-card {
      background-color: white;
      padding: 1rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
      text-align: center;
      width: 100%;
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
  }
}
</style>
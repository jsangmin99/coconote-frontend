// src/services/axios.js
import axios from 'axios';

let isLoginAlert = false;

// 요청 인터셉터 설정
axios.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('accessToken');

    if (!isLoginAlert && !accessToken && !config.url.includes('/oauth2/authorization')) { // token이 없고 login api도 아닌 경우
      isLoginAlert = true
      alert("로그인 후 시도해주세요.")
      // 페이지 이동을 약간 지연시켜 isLoginAlert 값을 true로 설정할 시간을 확보
      setTimeout(() => {
        const urlSplitCheck = window.location.href.split("/");
        console.error(window.location.href, "현 주소 확인",urlSplitCheck)
        if(urlSplitCheck.length > 3){ // router 를 못 불러와서, /기준 뒤에 추가 url이 없는 걸로 체크
          localStorage.clear();
          window.location.href = "/";
          // 이동 시, 다른 axios에서 오류가 나지만, 
        }
      }, 10); // 100ms 지연 (사용자 경험을 해치지 않는 범위 내에서)
      return false;
    }else if (accessToken && !config.url.includes('amazonaws.com')) { // S3 URL이 아닌 경우에만 Authorization 헤더 추가
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // withCredentials 설정을 추가하여 자격 증명 포함
    // s3에러로 인해 주석처리
    // config.withCredentials = true;

    return config;
  },
  (error) => {
    console.error('Request error:', error); // 에러 로그
    return Promise.reject(error);
  }
);

// 필요 시 응답 인터셉터도 추가할 수 있음
axios.interceptors.response.use(
  (response) => {
    // 응답 성공 시 처리할 로직
    return response;
  },
  (error) => {
    // 응답 에러 처리
    console.error('Response error:', error); // 에러 로그
    if (error.response?.data) {
      if(error.response?.data?.status_message.contain(`For input string:`)){ // null 일 때 대기해야하는데, alert창 뜨는 부분
        alert(`${error.response?.data?.status_message} \ncode :: ${error.response?.data?.status_code}`)
      }
    }
    return Promise.reject(error);
  }
);

export default axios;

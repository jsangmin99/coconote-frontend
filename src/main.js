// main.js
import { createApp } from 'vue';
import App from './App.vue';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@/assets/css/global.scss';
import router from '@/router/index.js';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import store from './store/index.js';
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const app = createApp(App);

app.use(store);
app.use(router);
app.use(vuetify);
app.use(Vue3Toastify, {
    autoClose: 5000,
    position: 'bottom-right',
});

// 전역 속성으로 $toast 등록
app.config.globalProperties.$toast = toast;

// Vue 애플리케이션 인스턴스를 전역 변수로 저장
window.app = app;

// Vue 애플리케이션 마운트
app.mount('#app');

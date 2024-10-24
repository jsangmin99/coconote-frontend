import { h } from 'vue'; // h 함수 가져오기
import ToastNotification from '@/components/thread/ToastNotification.vue';
import axios from 'axios';


const state = {
    notifications: [], // 알림 목록
    eventSource: null, // SSE 연결 객체
    unreadCounts: {}, // 채널별 읽지 않은 알림 수

};

const mutations = {
    ADD_NOTIFICATION(state, notification) {
        state.notifications.push(notification);
    },
    SET_EVENT_SOURCE(state, eventSource) {
        state.eventSource = eventSource;
    },
    CLEAR_NOTIFICATIONS(state) {
        state.notifications = [];
        state.unreadCounts = {}; // 알림 수 초기화
        console.log('CLEAR_NOTIFICATIONS - 모든 알림과 알림 수가 초기화되었습니다.');
    },
    CLOSE_EVENT_SOURCE(state) {
        if (state.eventSource) {
            state.eventSource.close();
            state.eventSource = null;
        }
    },
    UPDATE_UNREAD_COUNT(state, { channelId, count }) {
        if (!state.unreadCounts[channelId]) {
            state.unreadCounts[channelId] = 0;
        }
        state.unreadCounts[channelId] += count; // 기존 수에 추가
        console.log(`UPDATE_UNREAD_COUNT - 채널 ${channelId}의 알림 수가 업데이트되었습니다: ${state.unreadCounts[channelId]}`);
    },
    RESET_UNREAD_COUNT(state, channelId) {
        if (state.unreadCounts[channelId] !== undefined) {
            state.unreadCounts[channelId] = 0;
            console.log(`RESET_UNREAD_COUNT - 채널 ${channelId}의 읽지 않은 알림 수가 0으로 초기화되었습니다.`);
        }
    }
};

const actions = {
    connectToSSE({ commit }, { workspaceId }) {
        // URL에 인증 토큰을 쿼리 파라미터로 추가
        const accessToken = localStorage.getItem('accessToken');
        const eventSourceUrl = `${process.env.VUE_APP_API_BASE_URL}/notifications/subscribe/${workspaceId}?token=${encodeURIComponent(accessToken)}`;

        // SSE 연결을 설정하고 알림을 수신
        const eventSource = new EventSource(eventSourceUrl);
        console.log('SSE 연결:', eventSource);
        commit('SET_EVENT_SOURCE', eventSource);

        eventSource.onopen = () => {
            console.log('SSE 연결이 성공적으로 열렸습니다.');
        };

        // 'notification' 이벤트 리스너 등록
        eventSource.addEventListener('notification', (event) => {
            console.log('SSE 수신:', event);
            const data = event.data;
            console.log('수신된 데이터:', data); // 수신된 데이터 확인
            const notification = JSON.parse(data);
            console.log('새로운 알림:', notification);

            // 알림을 Vuex에 추가
            const notificationData = {
                message: notification.message,
                memberName: notification.memberName,
                channelName: notification.channelName,
                channelId: notification.channelId,
                timestamp: new Date(),
            };
            commit('ADD_NOTIFICATION', notificationData);
            console.log('알림 목록:', notificationData);

            // ToastNotification 컴포넌트를 사용해 알림 표시
            showNotificationToast(notificationData);
        });

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            commit('CLOSE_EVENT_SOURCE');
            // 재연결 시도
            setTimeout(() => {
                console.log('재연결 시도...');
                actions.connectToSSE({ commit }, { workspaceId }); // self를 사용하지 않고 actions를 통해 호출
            }, 100); // 0.1초 후 재연결 시도
        };
    },

    disconnectSSE({ commit }) {
        // SSE 연결 해제
        commit('CLOSE_EVENT_SOURCE');
    },
    clearNotifications({ commit }) {
        // 알림 목록 초기화
        commit('CLEAR_NOTIFICATIONS');
    },
    fetchUnreadCounts({ commit }, { channelId }) {
        return axios.get(`${process.env.VUE_APP_API_BASE_URL}/notifications/unread/count/${channelId}`)
            .then(response => {
                commit('UPDATE_UNREAD_COUNT', { channelId, count: response.data });
            })
            .catch(error => {
                console.error('알림 수 가져오기 오류:', error);
            });
    },

    markAsRead({ commit }, channelId) {
        commit('RESET_UNREAD_COUNT', channelId);
    }
};

// ToastNotification을 표시하는 함수
function showNotificationToast(data) {
    const toast = window.app.config.globalProperties.$toast; // 전역에서 toast 가져오기
    if (toast && data.message) {
        const toastMessage = h(ToastNotification, {
            channelName: data.channelName,
            memberName: data.memberName,
            message: data.message,
        });

        const toastOptions = {
            position: 'bottom-right',
            autoClose: 5000,
            draggable: true,
            theme: 'light',
            icon: '🔔',
            style: {
                backgroundColor: 'transparent',
                borderRadius: '8px',
                boxShadow: 'none',
            },
            // onClick: () => {
            //     moveToThread(data.channelId, data.threadId, data.parentThreadId); // 클릭 시 핸들러
            // },
        };

        // Toast 알림 표시
        toast.info(toastMessage, toastOptions);
    }
}

// Vuex 스토어의 getters
const getters = {
    allNotifications: (state) => state.notifications,
    getUnreadCount: (state) => (channelId) => state.unreadCounts[channelId] || 0,

};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
};

// import { EventSourcePolyfill } from 'event-source-polyfill';
// import axios from 'axios';

// const state = {
//     eventSource: null,
//     notifications: [],
//     notificationCounts: {}, // 각 채널의 알림 수를 저장하는 객체
// };

// const getters = {
//     notifications: (state) => state.notifications,
//     notificationCounts: (state) => state.notificationCounts,
// };

// const mutations = {
//     SET_EVENT_SOURCE(state, eventSource) {
//         state.eventSource = eventSource;
//     },
//     ADD_NOTIFICATION(state, notification) {
//         state.notifications.push(notification);
//         // 알림 수 업데이트
//         const { channelId } = notification;
//         if (!state.notificationCounts[channelId]) {
//             state.notificationCounts[channelId] = 0;
//         }
//         state.notificationCounts[channelId] += 1;
//     },
//     REMOVE_NOTIFICATIONS_BY_CHANNEL(state, channelId) {
//         state.notifications = state.notifications.filter(notification => notification.channelId !== channelId);
//         delete state.notificationCounts[channelId];
//     },
//     CLEAR_NOTIFICATIONS(state) {
//         state.notifications = [];
//         state.notificationCounts = {};
//     },
// };

// const actions = {
//     async fetchNotificationCounts({ commit }, channelId) {
//         console.log("channelId", channelId);
//         try {
//             const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/notifications/channel/${channelId}/count`);
//             const count = response.data;
//             // 초기 알림 수 설정
//             commit('ADD_NOTIFICATION', { channelId, count });
//         } catch (error) {
//             console.error('알림 수를 가져오는 중 오류가 발생했습니다:', error);
//         }
//     },
//     subscribeToNotifications({ commit }, channelId) {
//         // 기존 SSE 연결이 있으면 닫기
//         if (state.eventSource) {
//             state.eventSource.close();
//             commit('SET_EVENT_SOURCE', null);
//         }

//         // 새로운 SSE 연결 설정
//         const eventSource = new EventSourcePolyfill(`${process.env.VUE_APP_API_BASE_URL}/notifications/subscribe/${channelId}`, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//             },
//         });

//         eventSource.onopen = () => {
//             console.log("SSE 구독이 시작되었습니다.");
//             commit('CLEAR_NOTIFICATIONS'); // 기존 알림 클리어
//         };

//         eventSource.addEventListener('notification', (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 console.log('새로운 알림:', data);
//                 commit('ADD_NOTIFICATION', data);

//                 // 전역 $toast를 사용하여 토스트 알림 표시
//                 const toast = window.app.config.globalProperties.$toast;
//                 if (toast && data.message) {
//                     const toastMessage = [`${data.channelName}] ${data.memberName}: ${data.message}`];  
//                     toast.info(toastMessage, { // message 속성을 사용하여 표시
//                         position: 'bottom-right',
//                         autoClose: 5000,
//                     });
//                 }

//             } catch (e) {
//                 console.error("알림 수신 중 오류가 발생했습니다:", e);
//             }
//         });

//         eventSource.close = () => {
//             console.log("SSE 연결이 종료되었습니다.");
//             commit('SET_EVENT_SOURCE', null);
//         }

//         eventSource.onerror = (error) => {
//             console.error("SSE 에러 발생:", error);
//             if (eventSource.readyState === EventSource.CLOSED) {
//                 commit('SET_EVENT_SOURCE', null);
//             }
//         };

//         commit('SET_EVENT_SOURCE', eventSource);
//     },

//     async clearChannelNotifications({ commit }, channelId) {
//         try {
//             await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/notifications/channel/${channelId}`);
//             commit('REMOVE_NOTIFICATIONS_BY_CHANNEL', channelId);
//         } catch (error) {
//             console.error('알림 삭제 중 오류가 발생했습니다:', error);
//         }
//     },

//     closeEventSource({ state, commit }) {
//         if (state.eventSource) {
//             state.eventSource.close();
//             commit('SET_EVENT_SOURCE', null);
//         }
//     },
// };

// export default {
//     namespaced: true,
//     state,
//     getters,
//     mutations,
//     actions,
// };
import { EventSourcePolyfill } from 'event-source-polyfill';
import axios from 'axios';

const state = {
    eventSource: null,
    notifications: [],
    notificationCounts: {}, // 각 채널의 알림 수를 저장하는 객체
};

const getters = {
    notifications: (state) => state.notifications,
    notificationCounts: (state) => state.notificationCounts,
};

const mutations = {
    SET_EVENT_SOURCE(state, eventSource) {
        state.eventSource = eventSource;
    },
    ADD_NOTIFICATION(state, notification) {
        state.notifications.push(notification);
        const { channelId } = notification;
        if (!state.notificationCounts[channelId]) {
            state.notificationCounts[channelId] = 0;
        }
        state.notificationCounts[channelId] += 1;
    },
    REMOVE_NOTIFICATIONS_BY_CHANNEL(state, channelId) {
        state.notifications = state.notifications.filter(notification => notification.channelId !== channelId);
        delete state.notificationCounts[channelId];
    },
    CLEAR_NOTIFICATIONS(state) {
        state.notifications = [];
        state.notificationCounts = {};
    },
};

const actions = {
    subscribeToNotifications({ commit }, workspaceId) {
        if (state.eventSource) {
            state.eventSource.close();
            commit('SET_EVENT_SOURCE', null);
        }

        const eventSource = new EventSourcePolyfill(`${process.env.VUE_APP_API_BASE_URL}/notifications/subscribe/${workspaceId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        eventSource.onopen = () => {
            console.log("SSE 구독이 시작되었습니다.");
            commit('CLEAR_NOTIFICATIONS');
        };

        eventSource.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('새로운 알림:', data);
                commit('ADD_NOTIFICATION', data);

                // 전역 $toast를 사용하여 토스트 알림 표시
                const toast = window.app.config.globalProperties.$toast;
                if (toast && data.message) {
                    const toastMessage = `[${data.channelName}] ${data.memberName}: ${data.message}`;
                    toast.info(toastMessage, {
                        position: 'bottom-right',
                        autoClose: 5000,
                    });
                }
            } catch (e) {
                console.error("알림 수신 중 오류가 발생했습니다:", e);
            }
        });

        eventSource.onerror = (error) => {
            console.error("SSE 에러 발생:", error);
            if (eventSource.readyState === EventSource.CLOSED) {
                commit('SET_EVENT_SOURCE', null);
            }
        };

        commit('SET_EVENT_SOURCE', eventSource);
    },

    async clearChannelNotifications({ commit }, channelId) {
        try {
            await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/notifications/channel/${channelId}`);
            commit('REMOVE_NOTIFICATIONS_BY_CHANNEL', channelId);
        } catch (error) {
            console.error('알림 삭제 중 오류가 발생했습니다:', error);
        }
    },

    closeEventSource({ state, commit }) {
        if (state.eventSource) {
            state.eventSource.close();
            commit('SET_EVENT_SOURCE', null);
        }
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};

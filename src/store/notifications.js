import { EventSourcePolyfill } from 'event-source-polyfill';
import axios from 'axios';

const state = {
    eventSource: null,
    notifications: [],
    notificationCounts: {}, // 각 채널의 알림 수를 저장하는 객체
    currentChannelId: null, // 현재 접속 중인 채널 ID
    isConnected: false, // SSE 연결 상태 플래그
};

const getters = {
    notifications: (state) => state.notifications,
    notificationCounts: (state) => state.notificationCounts,
    isConnected: (state) => state.isConnected,
};

const mutations = {
    SET_EVENT_SOURCE(state, eventSource) {
        state.eventSource = eventSource;
    },
    ADD_NOTIFICATION(state, notification) {
        // 중복 알림 방지
        const existingNotification = state.notifications.find(n => n.id === notification.id);
        if (!existingNotification) {
            state.notifications.push(notification);
            const { channelId } = notification;
            if (!state.notificationCounts[channelId]) {
                state.notificationCounts[channelId] = 0;
            }
            state.notificationCounts[channelId] += 1;
        }
    },
    REMOVE_NOTIFICATIONS_BY_CHANNEL(state, channelId) {
        state.notifications = state.notifications.filter(notification => notification.channelId !== channelId);
        delete state.notificationCounts[channelId];
    },
    CLEAR_NOTIFICATIONS(state) {
        state.notifications = [];
        state.notificationCounts = {};
    },
    SET_CURRENT_CHANNEL(state, channelId) {
        state.currentChannelId = channelId;
    },
    SET_CONNECTION_STATUS(state, status) {
        state.isConnected = status;
    },
};

const actions = {
    subscribeToNotifications({ commit, state }, workspaceId) {
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
            commit('SET_CONNECTION_STATUS', true);
            commit('CLEAR_NOTIFICATIONS');
        };

        eventSource.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('새로운 알림:', data);

                if (data.channelId !== state.currentChannelId) {
                    commit('ADD_NOTIFICATION', data);
                }
                // 토스트 메시지 표시 이벤트 버스를 통해 전달
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

        eventSource.onerror = () => {
            console.error("SSE 연결이 끊어졌습니다.");
            commit('SET_CONNECTION_STATUS', false);
            commit('SET_EVENT_SOURCE', null);
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
            commit('SET_CONNECTION_STATUS', false);
        }
    },
    changeChannel({ commit }, channelId) {
        commit('SET_CURRENT_CHANNEL', channelId);
        commit('CLEAR_NOTIFICATIONS');
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};

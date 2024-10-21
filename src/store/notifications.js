import { h } from 'vue';
import ToastNotification from '@/components/thread/ToastNotification.vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import axios from 'axios';

const state = {
    eventSource: null,
    notifications: [],
    notificationCounts: {},
    currentChannelId: null,
    isConnected: false,
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
        // 중복 알림 필터링 제거
        state.notifications.push(notification);
        // 새로운 객체로 할당하여 반응성 유지
        state.notificationCounts = {
            ...state.notificationCounts,
            [notification.channelId]: (state.notificationCounts[notification.channelId] || 0) + 1,
        };
        console.log("Updated notificationCounts:", state.notificationCounts);
    },

    REMOVE_NOTIFICATIONS_BY_CHANNEL(state, channelId) {
        state.notifications = state.notifications.filter(n => n.channelId !== channelId);
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
            withCredentials: true,
            heartbeatTimeout: 30000,
        });

        eventSource.onopen = () => {
            commit('SET_CONNECTION_STATUS', true);
        };

        eventSource.addEventListener('notification', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('New notification:', data);
                // 현재 사용자의 알림은 무시
                if (data.userId != localStorage.getItem('workspaceMemberId')) { 
                    console.log(data.userId, localStorage.getItem('workspaceMemberId'));
                    if (data.channelId != localStorage.getItem('channelId')) {
                        console.log("SSE channel Id:", data.channelId , "localStorage channel Id:", localStorage.getItem('channelId'));
                        commit('ADD_NOTIFICATION', data); // 알림 추가
                        showNotificationToast(data); // 알림 토스트 표시
                    }
                }
            } catch (e) {
                console.error("Error processing notification:", e);
            }
        });

        eventSource.onerror = () => {
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
            console.error('Error clearing notifications:', error);
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

function showNotificationToast(data) {
    const toast = window.app.config.globalProperties.$toast;
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
        };
        toast.info(toastMessage, toastOptions);
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};

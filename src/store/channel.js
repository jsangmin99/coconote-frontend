function initState(){
    return {
        channelId : null, //현 접속한 channelId
        channelName : null,
        channelDesc : null,
        channelRole: null, // 내 권한(매니저, 일반유저)
    };
}

const channel = {
    state: initState(),
    mutations: {
        setChannelInfo(state, channelValue) {
            state.channelId = channelValue;
            localStorage.setItem("channelId", channelValue);
            console.log("[channel.js] setChannelInfo().state.channelId : ", state.channelId);
        },
        setChannelNameInfo(state, channelNameValue) {
            state.channelName = channelNameValue;
            localStorage.setItem("channelName", channelNameValue);
        },
        setChannelDescInfo(state, channelDescValue) {
            state.channelDesc = channelDescValue;
            localStorage.setItem("channelDesc", channelDescValue);
        },
        setChannelRoleInfo(state, channelRoleValue) {
            state.channelRole = channelRoleValue;
            localStorage.setItem("channelRole", channelRoleValue);
        },
    },
    actions: {
        setChannelInfoActions({ commit }, channelValue) {
            commit('setChannelInfo', channelValue);
        },
        setChannelNameInfoActions({ commit }, channelNameValue) {
            commit('setChannelNameInfo', channelNameValue);
        },
        setChannelDescInfoActions({ commit }, channelDescValue) {
            commit('setChannelDescInfo', channelDescValue);
        },
        setChannelRoleInfoActions({ commit }, channelRoleValue) {
            commit('setChannelRoleInfo', channelRoleValue);
        }
    },
    getters: {
        getChannelId(state){
            let returnState = null;
            returnState = (state.channelId == null) ? localStorage.getItem("channelId") : state.channelId
            console.log("getChannelName",returnState)
            if(returnState == null || returnState == undefined){
                setTimeout(() => {
                    return (state.channelId == null) ? localStorage.getItem("channelId") : state.channelId
                }, 100);
                return false;
            }
            return returnState;
        },
        getChannelName(state){
            let returnState = null;
            returnState = (state.channelName == null) ? localStorage.getItem("channelName") : state.channelName
            console.log("getChannelName",returnState)
            if(returnState == null || returnState == undefined){
                setTimeout(() => {
                    return (state.channelName == null) ? localStorage.getItem("channelName") : state.channelName
                }, 100);
                return false;
            }
            return returnState;
        },
        getChannelDesc(state){
            let returnState = null;
            returnState = (state.channelDesc == null) ? localStorage.getItem("channelDesc") : state.channelDesc
            console.log("getChannelName",returnState)
            if(returnState == null){
                setTimeout(() => {
                    return (state.channelDesc == null) ? localStorage.getItem("channelDesc") : state.channelDesc
                }, 100);
                return false;
            }
            return returnState;
        },
        getChannelRole(state){
            let returnState = null;
            returnState = (state.channelRole == null) ? localStorage.getItem("channelRole") : state.channelRole
            console.log("getChannelName",returnState)
            if(returnState == null){
                setTimeout(() => {
                    return (state.channelRole == null) ? localStorage.getItem("channelRole") : state.channelRole
                }, 100);
                return false;
            }
            return returnState;
        },
    }
}

export default channel;


function initState() {
    return {
        workspaceId: null, //현 접속한 workspaceId
        workspaceName: null,
        workspaceMemberId: null, // 워크스페이스 멤버 ID
        nickname: null, // 닉네임
        profileImage: null, // 프로필 이미지 url
        wsRole: null,
    };
}

const workspace = {
    state: initState(),
    mutations: {
        setWorkspaceInfo(state, workspaceValue) {
            state.workspaceId = workspaceValue;
            localStorage.setItem("workspaceId", workspaceValue);
        },
        setWorkspaceNameInfo(state, workspaceNameValue) {
            state.workspaceName = workspaceNameValue;
            localStorage.setItem("workspaceName", workspaceNameValue);
        },
        setMemberInfo(state, memberInfo) {
            state.nickname = memberInfo.nickname;
            state.workspaceMemberId = memberInfo.workspaceMemberId;
            state.profileImage = memberInfo.profileImage;
            state.wsRole = memberInfo.wsRole;
            localStorage.setItem("nickname", memberInfo.nickname);
            localStorage.setItem("workspaceMemberId", memberInfo.workspaceMemberId);
            localStorage.setItem("profileImage", memberInfo.profileImage);
            localStorage.setItem("wsRole", memberInfo.wsRole);
        },
    },
    actions: {
        setWorkspaceInfoActions({ commit }, workspaceValue) {
            commit('setWorkspaceInfo', workspaceValue);
        },
        setWorkspaceNameInfoActions({ commit }, workspaceNameValue) {
            commit('setWorkspaceNameInfo', workspaceNameValue);
        },
        setMemberInfoActions({ commit }, memberInfo) {
            commit("setMemberInfo", memberInfo); // 새로운 멤버 정보를 저장하는 액션
        },
    },
    getters: {
        getWorkspaceId: state => (state.workspaceId == null) ? localStorage.getItem("workspaceId") : state.workspaceId,
        getWorkspaceName: state => (state.workspaceName == null) ? localStorage.getItem("workspaceName") : state.workspaceName,
        getNickname: (state) => state.nickname == null ? localStorage.getItem("nickname") : state.nickname,
        getWorkspaceMemberId: (state) => state.workspaceMemberId == null ? localStorage.getItem("workspaceMemberId") : state.workspaceMemberId,
        getProfileImage: (state) => state.profileImage == null ? localStorage.getItem("profileImage") : state.profileImage,
        getWsRole: (state) => state.wsRole == null ? localStorage.getItem("wsRole") : state.wsRole,
    }
}

export default workspace;


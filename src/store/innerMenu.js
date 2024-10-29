function initState() {
    return {
        activeInnerMenu : null,
    };
}


const innerMenu = {
    state: initState(),
    mutations: {
        setActiveInnerMenu(state, data) {
            state.activeInnerMenu = data;
        },
    },
    actions: {
        setActiveInnerMenuActions({ commit }, data) {
            commit('setActiveInnerMenu', data);
        },
    },
    getters: {
        getActiveInnerMenu: state => state.activeInnerMenu,
    }
}

export default innerMenu;
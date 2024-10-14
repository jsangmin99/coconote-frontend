function initState() {
    return {
        method: null, // create, update, delete, changeOrder 있을 예정
        title: null,
        canvasId: null,
        parentCanvasId: null,
        prevCanvasId: null,
        nextCanvasId: null,
        member: null,
    };
}

const canvas = {
    state: initState(),
    mutations: {
        setCanvasAllInfo(state, item) {
            state.method = (item.method) ? item.method : null;
            state.title = (item.title) ? item.title : null;
            state.canvasId = (item.canvasId) ? item.canvasId : null;
            state.prevCanvasId = (item.prevCanvasId) ? item.prevCanvasId : null;
            state.nextCanvasId = (item.nextCanvasId) ? item.nextCanvasId : null;
            state.member = (item.member) ? item.member : null;
        }
    },
    actions: {
        setCanvasAllInfoAction({ commit }, item) {
            commit('setCanvasAllInfo', item);
        },
    },
    getters: {
        getCanvasAllInfo: state => state,
    }
}

export default canvas;

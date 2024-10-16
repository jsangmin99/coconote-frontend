function initState() {
    return {
        // method: null, // create, update, delete, changeOrder 있을 예정
        // title: null,
        // canvasId: null,
        // parentCanvasId: null,
        // prevCanvasId: null,
        // nextCanvasId: null,
        // member: null,

        // 페이지별로 값을 불러올 때 확인하기 위함
        page: null, // VIEW, LIST, DETAIL 들어갈 예정 > 각각 값이 해당되는 페이지에서 이벤트 실행해야함

        // post 용도의 canvas 내용
        // method 종류 : ENTER, CREATE_CANVAS, UPDATE_CANVAS, CHANGE_ORDER_CANVAS, DELETE_CANVAS, CREATE_BLOCK, UPDATE_BLOCK, CHANGE_ORDER_BLOCK, DELETE_BLOCK,
        method: null,

        // CANVAS, BLOCK
        postMessageType: null,

        channelId: null,
        senderId: null, // 메시지 보낸사람 id

        //    공통 사용
        isDeleted: null, // 삭제여부 확인

        //    캔버스 용도
        canvasId: null, // 방번호


        canvasTitle: null, // 캔버스 명

        parentCanvasId: null, // 현재 사용 X
        prevCanvasId: null, // 현 Canvas의 이전 캔버스 > 현 캔버스"가" prevCanvas으로 참조하고 있는 캔버스
        nextCanvasId: null, // 현 Canvas의 다음 캔버스 > 현 캔버스"를" prevCanvasId로 참조하고 있는 캔버스

        //    블록 용도
        blockId: null,
        blockFeId: null,
        prevBlockId: null,
        nextBlockId: null, // changeOrder 용도 전용
        parentBlockId: null,
        blockContents: null,
        blockType: null,
        // 
    };
}

const canvas = {
    state: initState(),
    mutations: {
        setCanvasAllInfo(state, item) {
            state = { ...state[page], ...item }
        },
        setInfoTarget(state, { item_key, item_value }) {
            state[item_key] = item_value;
        },
        setInfoMultiTarget(state, items) {
            items.forEach(item => {
                state[item.key] = item.value;
            });
        },
        setPageInfo(state, item) {
            state.page = item;
        }
    },
    actions: {
        setCanvasAllInfoAction({ commit }, item) {
            commit('setCanvasAllInfo', item);
        },
        // 액션에서도 객체로 전달
        setInfoTargetAction({ commit }, payload) {
            commit('setInfoTarget', payload);
            /* 호출은 이런 방식
                const key = 'someKey';
                const value = 'someValue';
                this.setInfoTargetAction({ item_key: key, item_value: value });
            */
        },
        setInfoMultiTargetAction({ commit }, payload) {
            commit('setInfoMultiTarget', payload);
            /* 호출은 이런 방식
                // 전달할 데이터 (key와 value 쌍을 배열로)
                const payload = [
                    { key: 'canvasId', value: 123 },
                    { key: 'canvasTitle', value: 'New Canvas Title' },
                    { key: 'method', value: 'CREATE_CANVAS' }
                ];

                // Vuex action 호출
                this.setInfoMultiTargetAction(payload);
            */
        },
        setPageInfoAction({ commit }, item) {
            commit('setPageInfo', item);
        },
    },
    getters: {
        getCanvasAllInfo: state => state,
        getPageInfoForComponent: state => state.page, // 페이지 변경 감지
    }
}

export default canvas;

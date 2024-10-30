function initState() {
    return {
        isDragStatus: false, // 현재 drag 이벤트가 실행되고 있는지 확인용
        dragStartPage: null, // drag이벤트가 시작된 페이지가 어디인지 입력 용 >> "thread" , "canvas" , "drive" 가 입력될 예정
        result: null, // drag 한 파일이나 element(thread 혹은 canvas)의 정보 object 혹은 json 파일 

        // tab 닫힐 때 용도
        tab: {
            // driveFileId: null,
            driveFolderId: null,
            canvasId: null,
            threadId: null,
        },
    };
}


const tcdShare = {
    state: initState(),
    mutations: {
        setTcdStateAllData(state, data) {
            Object.keys(data).forEach(key => {
                state[key] = data[key];
            });
        },
        setIsTcdDragStatus(state, data) {
            state.isDragStatus = data;
        },
        setTcdTabInfoMultiTarget(state, items) {
            Object.keys(items).forEach(key => {
                state.tab[key] = items[key];
            });
        },
    },
    actions: {
        setTcdStateAllDataActions({ commit }, data) {
            commit('setTcdStateAllData', data);
        },
        setIsTcdDragStatusActions({ commit }, data) {
            commit('setIsTcdDragStatus', data);
        },
        setTcdTabInfoMultiTargetAction({ commit }, payload) {
            commit('setTcdTabInfoMultiTarget', payload);
            /* 호출은 이런 방식
                const payload = {
                    canvasId: 123,
                    canvasTitle: 'New Canvas Title',
                    method: 'CREATE_CANVAS'
                };

                // Vuex action 호출
                this.setTcdTabInfoMultiTarget(payload);
            */
        },
    },
    getters: {
        getAllTcdState: state => state,
        getsetIsTcdDragStatus: state => state.isDragStatus,
        getTcdSplitTab: state => state.tab
        // getBlockFeIdIndex: (state) => (targetId) => {
        //     return state.defaultBlockFeIds.indexOf(targetId);
        // },
    }
}

export default tcdShare;
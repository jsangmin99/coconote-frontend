function initState() {
    return {
        defaultBlockFeIds: [], // block FeId
    };
}

const blockFeIds = {
    state: initState(),
    mutations: {
        setDefaultBlockFeIds(state, newIds) {
            state.defaultBlockFeIds = newIds;
            console.error("block 전체 set 완료!!", state.defaultBlockFeIds)
        },
        pushBlockFeIds(state, newId) {
            state.defaultBlockFeIds.push(newId);
        },
        deleteBlockTargetFeId(state, targetId) {
            const index = state.defaultBlockFeIds.indexOf(targetId);
            if (index > -1) {
                state.defaultBlockFeIds.splice(index, 1);
                return true;
            } else {
                return false;
            }
        }
    },
    actions: {
        setDefaultBlockFeIdsActions({ commit }, newIds) {
            commit('setDefaultBlockFeIds', newIds);
        },
        pushBlockFeIdsActions({ commit }, newId) {
            commit('pushBlockFeIds', newId);
        },
        deleteBlockTargetFeIdActions({ commit }, deleteId) {
            commit('deleteBlockTargetFeId', deleteId);
        }
    },
    getters: {
        getAllBlockFeIds: state => state.defaultBlockFeIds,
        getBlockFeId: (state) => (targetId) => {
            return state.defaultBlockFeIds.find(
                (element) => element == targetId
            );
        },
        getBlockFeIdIndex: (state) => (targetId) => {
            return state.defaultBlockFeIds.indexOf(targetId);
        },
        getTargetBlockPrevFeId: (state) => (targetId) => {
            let targetPrevFeId = state.defaultBlockFeIds.indexOf(targetId) - 1;
            if (targetPrevFeId > -1) {
                return targetPrevFeId;
            } else {
                return null;
            }
        },
        getTargetBlockPrevFeIdIndex: (state) => (targetId) => {
            let targetPrevFeId = state.defaultBlockFeIds.indexOf(targetId) - 1;
            if (targetPrevFeId > -1) {
                return state.defaultBlockFeIds[targetPrevFeId];
            } else {
                return null;
            }
        }
    }
}

export default blockFeIds;


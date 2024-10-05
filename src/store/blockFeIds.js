function initState() {
    return {
        defaultBlockFeIds: [], // block FeId
    };
}

const blockFe = {
    state: initState(),
    mutations: {
        setDefaultBlockFeIds(state, newIds) {
            state.defaultBlockFeIds = newIds;
        },
        pushBlockFeIds(state, newId) {
            state.defaultBlockFeIds.push(newId);
        },
        deleteBlockTargetFeId(state, targetId) {
            const index = state.defaultBlockFeIds.indexOf(targetId);
            if (index > -1) {
                state.defaultBlockFeIds.splice(index, 1);
                return true;
            }else{
                return false;
            }
        }
    },
    actions: {
        setDefaultBlockFeIdsActions({ commit }, newIds) {
            commit('setDefaultBlockFeIds', newIds);
        },
        pushBlockFeIdsActions({ commit }, newId) {
            commit('setDefaultBlockFeIds', newId);
        },
        deleteBlockTargetFeIdActions({ commit }, deleteId){
            commit('deleteBlockTargetFeId', deleteId);
        }
    },
    getters: {
        getAllBlockFeIds: state => state.defaultBlockFeIds,
        getBlockFeIdIndex: (state) => (targetId) => {
            return state.defaultBlockFeIds.indexOf(targetId);
        },
        getTargetBlockPrevFeIdIndex: (state) => (targetId) => {
            let targetPrevFeId = state.defaultBlockFeIds.indexOf(targetId) -1;
            if(targetPrevFeId > -1){
                return state.defaultBlockFeIds[targetPrevFeId];
            }else{
                return null;
            }
        }
    }
}

export default blockFe;


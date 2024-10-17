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
        },
        pushBlockFeIds(state, newId) {
            state.defaultBlockFeIds.push(newId);
        },
        appendBlockFeIdsAfterPrev(state, newId, prevId) {
            if (prevId == null) {
                // prevId가 null이면 맨 앞에 newId 추가
                state.defaultBlockFeIds.unshift(newId);
            } else {
                const prevIndex = state.defaultBlockFeIds.indexOf(prevId);
                if (prevIndex !== -1) {
                    // prevId 뒤에 newId 추가
                    state.defaultBlockFeIds.splice(prevIndex + 1, 0, newId);
                } else {
                    console.warn(`prevId: ${prevId}를 찾을 수 없습니다.`);
                }
            }
        },
        deleteBlockTargetFeId(state, targetId) {
            const index = state.defaultBlockFeIds.indexOf(targetId);
            console.log("STORE :: deleteFeId >> ", index, " || ", state.defaultBlockFeIds)
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
        appendBlockFeIdsAfterPrevActions({ commit }, newId, prevId) {
            commit('appendBlockFeIdsAfterPrev', newId, prevId);
        },
        deleteBlockTargetFeIdActions({ commit, state }, deleteId) {
            commit('deleteBlockTargetFeId', deleteId);
            // 상태를 확인해 true/false를 반환
            return state.defaultBlockFeIds.indexOf(deleteId) === -1;
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
                return state.defaultBlockFeIds[targetPrevFeId];
            } else {
                return null;
            }
        },
        getTargetBlockPrevFeIdIndex: (state) => (targetId) => {
            let targetPrevFeId = state.defaultBlockFeIds.indexOf(targetId) - 1;
            if (targetPrevFeId > -1) {
                return targetPrevFeId;
            } else {
                return null;
            }
        }
    }
}

export default blockFeIds;


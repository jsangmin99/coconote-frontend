import {createStore} from 'vuex';
import channel from './channel';
import workspace from './workspace';
import blockFeIds from './blockFeIds';


const store = createStore({
    modules:{
        channel,
        workspace,
        blockFeIds
    }
});

export default store;
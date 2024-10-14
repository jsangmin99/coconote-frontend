import {createStore} from 'vuex';
import channel from './channel';
import workspace from './workspace';
import canvas from './canvas';
import blockFeIds from './blockFeIds';


const store = createStore({
    modules:{
        channel,
        workspace,
        canvas,
        blockFeIds
    }
});

export default store;
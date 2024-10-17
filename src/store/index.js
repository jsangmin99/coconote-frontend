import {createStore} from 'vuex';
import channel from './channel';
import workspace from './workspace';
import canvas from './canvas';
import blockFeIds from './blockFeIds';
import notifications from './notifications';


const store = createStore({
    modules:{
        channel,
        workspace,
        canvas,
        notifications,
        blockFeIds,
    }
});

export default store;
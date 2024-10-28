import {createStore} from 'vuex';
import channel from './channel';
import workspace from './workspace';
import canvas from './canvas';
import blockFeIds from './blockFeIds';
import notifications from './notifications';
import tcdShare from './tcdShare';


const store = createStore({
    modules:{
        channel,
        workspace,
        canvas,
        notifications,
        blockFeIds,
        tcdShare,
    }
});

export default store;
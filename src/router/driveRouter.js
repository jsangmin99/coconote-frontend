// driveRouter.js
import DriveView from '@/views/drive/driveView.vue';

export const driveRouter = [
    {
        path: '/channel/:channelId/drive/view',
        name: 'DriveView',
        component: DriveView,
        props: true
    },
];

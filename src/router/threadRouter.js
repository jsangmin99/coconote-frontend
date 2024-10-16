import ThreadView from "@/views/thread/ThreadView.vue";
import TagView from "@/views/thread/TagView.vue";

export const threadRouter = [
    {
        path: '/channel/:channelId/tag/view',
        name: 'TagView',
        component: TagView,
        props: true
    },  
    {
        path: '/channel/:channelId/thread/view',
        name: 'ThreadView',
        component: ThreadView,
        props: true
    },
]
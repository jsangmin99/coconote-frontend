<template>
  <div class="channelInsideContainer">
    <ChannelCommonMenu :menu="'thread'" :channelId="channelId" />
    <ThreadComponent :id="channelId" :threadId="threadId"/>
  </div>
</template>
  
  <script>
import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import ThreadComponent from "@/components/thread/ThreadComponent.vue";

export default {
  props: {
    channelId: {
      type: String,
      required: true,
    },
  },
  components: {
    ChannelCommonMenu,
    ThreadComponent,
  },
  data() {
    return {
      threadId: null,
    };
  },
  created() {
    this.threadId = this.$route.query.threadId;
  },
  mounted() {},
  updated() {},
  beforeUnmount() {},
  computed: {},
  methods: {},
};
</script>
  

<template>
  <div class="channelInsideContainer">
    <ChannelCommonMenu :menu="'tag'" :channelId="channelId" />
    <TagComponent :id="channelId"/>
  </div>
</template>
  
  <script>
import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import TagComponent from "@/components/thread/TagComponent.vue";

export default {
  props: {
    channelId: {
      type: String,
      required: true,
    },
  },
  components: {
    ChannelCommonMenu,
    TagComponent,
  },
  data() {
    return {};
  },
  created() {},
  mounted() {},
  updated() {},
  beforeUnmount() {},
  computed: {},
  methods: {},
};
</script>
  

<template>
  <div class="channelInsideContainer">
    <ChannelCommonMenu :menu="'drive'" />
    <FolderComponent :id="this.channelId" :folderId="folderId" :fileId="fileId" />
  </div>
</template>

<script>
import ChannelCommonMenu from "@/components/basic/ChannelCommonMenu.vue";
import FolderComponent from '@/components/drive/FolderComponent.vue';

export default {
  props: {
    channelId: {
      type: String,
      required: true,
    },
  },
  components: {
    ChannelCommonMenu,
    FolderComponent
  },
  data() {
    return {
      folderId: null,
      fileId: null,
    };
  },
  created() {
    this.folderId = this.$route.query.folderId;
    this.fileId = this.$route.query.fileId;
  },
  mounted() {
  },
  updated() {
  },
  beforeUnmount() { },
  computed: {},
  methods: {},
};
</script>
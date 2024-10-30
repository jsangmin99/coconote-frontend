<template>
  <node-view-wrapper class="vue-component" :data-id="node.attrs.id"> <!-- :data-id 속성 추가 -->
    <label>쓰레드</label>
    <span class="content">
      <span class="text" v-html="node.attrs.content"></span>
      <button @click="locationThreadPage">
        {{ node.attrs.id }}로 이동하기
      </button>
    </span>
  </node-view-wrapper>
</template>

<script>
import { nodeViewProps, NodeViewWrapper } from "@tiptap/vue-3";

export default {
  components: {
    NodeViewWrapper,
  },

  props: nodeViewProps,

  methods: {
    locationThreadPage() {
      const threadId = this.node.attrs.id;
      this.$router.push(`/threads/${threadId}`);
    },
  },
};
</script>

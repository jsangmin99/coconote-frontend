<template>
  <node-view-wrapper class="tiptap-thread" :data-id="node.attrs.id"> <!-- :data-id 속성 추가 -->
    <label>쓰레드</label>
    <span class="content">
      <span class="text" v-html="node.attrs.content"></span>
      <button @click="locationThreadPage(node.attrs.id)">
        <v-icon icon="mdi-arrow-right"></v-icon>
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
    locationThreadPage(threadId) {
      // const threadId = this.node.attrs.id;
      this.$router.push(`/threads/${threadId}`);
    },
  },
};
</script>

<style lang="scss">
.tiptap-thread{
  display: flex;
  border: 1px solid #d5d9e4;
  border-radius: 8px;
  background-color: #fafbff;
  font-size: 12px;
  padding: 4px 12px !important;
  margin: 0 !important;
  cursor: pointer;
  
  >label{
    font-weight: bold;
    color: #7f8696;
    border-right: 1px solid #f3f4f4;
    padding: 8px;
    display: flex;
    align-items: center;
  }
  .content{
    padding: 0 0 0 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    >*{
      padding: 0;
    }
    .text{
      text-overflow: ellipsis;
    }
    .v-icon{
        color: #aaa;
        font-size: 10px;
      }
    button{
      padding: 0;
      
    }
  }
}
</style>

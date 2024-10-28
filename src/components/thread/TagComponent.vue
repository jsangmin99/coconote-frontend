<template>
  <div class="container tag_container">
    <div :style="{margin: 5+'px'}">
      <h2>Tags</h2>
    </div>
    <hr>
    <h4>태그 리스트</h4>
    <div class="tag-list">
      <div class="tag-container" v-for="(tag, index) in tagList" :key="index" @contextmenu.prevent="showContextMenu(tag, $event)">
        <strong v-if="!isUpdateTagName || selectedTag.id !== tag.id" class="tag"
          :style="{ backgroundColor: selectedTags.some(selectedTag => selectedTag.id === tag.id)? tag.color: tag.color + '50' }" @click="selectTag(tag)" :class="{ highlight: selectedTags.some(selectedTag => selectedTag.id === tag.id) }">
          {{ tag.name }}
        </strong>
        <input v-if="isUpdateTagName && selectedTag.id === tag.id" type="text" class="tag"
          :style="{ backgroundColor: tag.color }" v-on:keypress.enter="updateTagName" :ref="'tagInput' + tag.id"
          v-model="tagName">
        <button class="menu-btn" @click="toggleTagMenu(tag, $event)">⚙️</button>
      </div>
    </div>

    <hr>
    <h4>검색 결과</h4>
    <div class="filter-result">
      <v-skeleton-loader v-if="isLoading" type="list-item-avatar, paragraph"></v-skeleton-loader>
      <div v-if="!isLoading">
        <div v-if="searchResults.length === 0" class="no-results">검색 결과가 없습니다.</div>
        <ul v-else>
          <li v-for="(result, index) in searchResults" :key="index" @click="moveToThread(result.channelId, result.threadId, result.parentThreadId)">
            <div class="result-content">
              <img v-if="result.profileImageUrl" :src="result.profileImageUrl" alt="프로필 이미지" class="result-image" style="width: 50px; height: 50px">
              <div class="result-details">
                <strong class="result-title">{{ result.memberName }}</strong>
                <p class="result-content-text">{{ result.content }}</p>
                <div class="image-group">
                  <div class="file-group" v-for="(file, index) in result.fileUrls" :key="index">
                    <img :src="file" alt="image" @error="e => e.target.src = require('@/assets/images/file.png')"  style="height: 120px; width: 120px; object-fit: cover; border-radius:10px;">
                  </div>
                </div>
                <div class="result-tags">
                  <span v-for="(tag, idx) in result.tags" :key="idx" class="result-tag">{{ tag }}</span>
                </div>
                <small class="result-date">{{ result.createdTime }}</small>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="isTagMenuVisible" class="context-menu"
      :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }">
      <button @click="editTag(selectedTag, $event)">수정</button>
      <button @click="deleteTag(selectedTag)">삭제</button>
    </div>
  </div>
</template>

<script>
import axios from '@/services/axios'

export default {
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      tagList: [],
      selectedTags: [],
      isTagMenuVisible: false,
      isUpdateTagName: false,
      selectedTag: null,
      menuPosition: { x: 0, y: 0 },
      tagName: "",
      searchResults: [],
      isLoading: false,
    };
  },
  created() {
    this.getTagList();
    document.addEventListener('click', this.closeTagMenu);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeTagMenu);
  },
  methods: {
    async getTagList() {
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/tag/list/${this.id}`);
      this.tagList = response.data.result;
    },

    toggleTagMenu(tag, event) {
      event.stopPropagation();
      this.selectedTag = tag;
      this.isUpdateTagName = false;
      this.isTagMenuVisible = !this.isTagMenuVisible;
      this.menuPosition = { x: event.clientX, y: event.clientY };
    },

    showContextMenu(tag, event) {
      this.selectedTag = tag;
      this.isUpdateTagName = false;
      this.isTagMenuVisible = true;
      this.menuPosition = { x: event.clientX, y: event.clientY };
    },

    closeTagMenu() {
      this.isTagMenuVisible = false;
      this.isUpdateTagName = false;
    },

    async editTag(tag, event) {
      event.stopPropagation();
      this.tagName = tag.name;
      this.isUpdateTagName = true;
      this.isTagMenuVisible = false;
      this.$nextTick(() => {
        this.$refs['tagInput' + tag.id][0].focus();
      });
    },

    async deleteTag(tag) {
      await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/tag/delete/${tag.id}`);
      this.getTagList();
    },

    async updateTagName() {
      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/tag/update`, { tagId: this.selectedTag.id, updateTagName: this.tagName });
      this.getTagList();
      this.isUpdateTagName = false;
    },

    selectTag(tag) {
      this.isLoading = true
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }else{
        this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag.id !== tag.id);
      }
      this.searchBySelectedTags();
    },

    removeTag(tag) {
      this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag.id !== tag.id);
      this.searchBySelectedTags();
    },

    async searchBySelectedTags() {
      if(this.selectedTags.length==0){
        this.searchResults = []
        this.isLoading = false
        return
      }
      try {
        const params = new URLSearchParams();
        params.append('workspaceId', localStorage.getItem('workspaceId'));
        params.append('page', 0);
        params.append('size', 20);
        this.selectedTags.forEach(tag => params.append('tags', tag.name));

        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/search/threads/by-tags`, { params });
        this.searchResults = response.data.result.results;
        console.log("this.searchResults: ",this.searchResults);
        
      } catch (error) {
        console.error('태그를 통한 검색 중 오류 발생:', error);
      }
      this.isLoading = false
    },
    moveToThread(channelId, threadId, parentThreadId) {
      window.location.href = `/channel/${channelId}/thread/view?threadId=${threadId}&parentThreadId=${parentThreadId}`;
    },
  }
};
</script>

<style lang="scss">
@import "@/assets/css/tag.scss";
</style>
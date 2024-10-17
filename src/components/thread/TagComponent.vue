<template>
  <div>
    <h2>태그 전체보기</h2>
    <hr>
    <h4>태그 리스트</h4>
    <div class="tag-list">
      <div class="tag-container" v-for="(tag, index) in tagList" :key="index">
        <div>
          <strong v-if="!isUpdateTagName || selectedTag.id !== tag.id" class="tag"
            :style="{ backgroundColor: tag.color }" @click="selectTag(tag)">
            {{ tag.name }}
          </strong>
          <input v-if="isUpdateTagName && selectedTag.id === tag.id" type="text" class="tag"
            :style="{ backgroundColor: tag.color }" v-on:keypress.enter="updateTagName" :ref="'tagInput' + tag.id"
            v-model="tagName">
          <button class="menu-btn" @click="toggleTagMenu(tag, $event)">⚙️</button>
        </div>
      </div>
    </div>

    <hr>
    <h4>선택된 태그</h4>
    <div class="selected-tags">
      <div v-if="selectedTags.length === 0">선택된 태그가 없습니다.</div>
      <div v-else class="selected-tag" v-for="(tag, index) in selectedTags" :key="index">
        <span :style="{ backgroundColor: tag.color }">{{ tag.name }}</span>
        <button @click="removeTag(tag)">x</button>
      </div>
    </div>

    <button v-if="selectedTags.length > 0" @click="searchBySelectedTags">선택된 태그로 검색</button>

    <hr>
    <h4>검색 결과</h4>
    <div class="filter-result">
      <div v-if="searchResults.length === 0">검색 결과가 없습니다.</div>
      <ul v-else>
        <li v-for="(result, index) in searchResults" :key="index">
          <strong>{{ result.content }}</strong>
        </li>
      </ul>
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
      selectedTags: [], // 선택된 태그를 저장할 배열
      isTagMenuVisible: false,
      isUpdateTagName: false,
      selectedTag: null,
      menuPosition: { x: 0, y: 0 },
      tagName: "",
      searchResults: [], // 검색 결과를 저장할 배열
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
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
    },

    removeTag(tag) {
      this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag.id !== tag.id);
    },

    async searchBySelectedTags() {
      try {
        const params = new URLSearchParams();
        params.append('workspaceId', this.id);
        params.append('page', 0);
        params.append('size', 20);
        this.selectedTags.forEach(tag => params.append('tags', tag.name));

        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/search/threads/by-tags`, { params });
        this.searchResults = response.data.result.results;
      } catch (error) {
        console.error('태그를 통한 검색 중 오류 발생:', error);
      }
    }
  }
};
</script>


<style scoped>
.tag-list {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.tag-container {
  position: relative;
}

.tag {
  border-radius: 5px;
  padding: 0 5px 1px 5px;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.selected-tag {
  background-color: #f0f0f0;
  border-radius: 5px;
  padding: 5px;
  display: flex;
  align-items: center;
}

.selected-tag button {
  margin-left: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.filter-result {
  margin-top: 20px;
}
</style>

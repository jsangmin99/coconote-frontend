<template>
  <div class="container">
    <div :style="{margin: 5+'px'}">
      <h2>Tags</h2>
    </div>
    <hr>
    <h4>태그 리스트</h4>
    <div class="tag-list">
      <div class="tag-container" v-for="(tag, index) in tagList" :key="index" @contextmenu.prevent="showContextMenu(tag, $event)">
        <strong v-if="!isUpdateTagName || selectedTag.id !== tag.id" class="tag"
          :style="{ backgroundColor: tag.color }" @click="selectTag(tag)" :class="{ highlight: selectedTags.some(selectedTag => selectedTag.id === tag.id) }">
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
      <div v-if="searchResults.length === 0" class="no-results">검색 결과가 없습니다.</div>
      <ul v-else>
        <li v-for="(result, index) in searchResults" :key="index" @click="moveToThread(result.channelId, result.threadId, result.parentThreadId)">
          <div class="result-content">
            <img v-if="result.image" :src="result.image" alt="프로필 이미지" class="result-image" style="width: 24px; height: 24px">
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
    },
    moveToThread(channelId, threadId, parentThreadId) {
      window.location.href = `/channel/${channelId}/thread/view?threadId=${threadId}&parentThreadId=${parentThreadId}`;
    },
  }
};
</script>

<style scoped>
/* 태그 리스트 스타일 */
.container{
  overflow-y: auto;
  padding: 0 20px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

/* 태그 컨테이너 */
.tag-container {
  position: relative;
}

.tag-container:hover .menu-btn {
  display: block;
}

/* 태그 스타일 */
.tag {
  display: inline-block; 
  border-radius: 6px;
  padding: 2px 7px 3px 7px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.tag:hover {
  transform: scale(1.1);
}

/* 메뉴 버튼 스타일 */
.menu-btn {
  display: none;
  position: absolute;
  top: -7px;
  right: -14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #666;
}

/* 선택된 태그 스타일 */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 15px 0;
}

.selected-tag {
  background-color: #e0e0e0;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;
}

.selected-tag:hover {
  background-color: #d0d0d0;
}

.selected-tag span {
  margin-right: 10px;
  color: #444;
  font-weight: 500;
}

.selected-tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #888;
  margin-left: 5px;
}

/* 검색 버튼 스타일 */
.search-btn {
  background-color: #5c85d6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 15px;
  transition: background-color 0.3s, transform 0.2s;
}

.search-btn:hover {
  background-color: #4a6fb3;
  transform: scale(1.05);
}

/* 검색 결과 스타일 */
.filter-result {
  margin-top: 20px;
}

.no-results,
.no-tags {
  color: #888;
  font-style: italic;
}

/* 검색 결과 리스트 스타일 */
.filter-result ul {
  list-style: none;
  padding: 0;
}

.filter-result li {
  background-color: #f8f9fa;
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 10px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  display: flex;
  align-items: center;
}

.filter-result li:hover {
  transform: translateY(-5px) scale(1.02);
}

/* 검색 결과 내용 스타일 */
.result-content {
  display: flex;
  align-items: center;
}

.result-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
}

.result-details {
  flex-grow: 1;
}

.result-title {
  font-size: 18px;
  margin-bottom: 5px;
}

.result-content-text {
  color: #555;
  margin-bottom: 8px;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.result-tag {
  background-color: #dedede;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
}

.result-date {
  font-size: 12px;
  color: #999;
}

/* 컨텍스트 메뉴 스타일 */
.context-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  border-radius: 8px;
}

.context-menu button {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
}

.context-menu button:hover {
  background-color: #f0f0f0;
}
@keyframes rainbow-border {
  0% { border-color: red; }
  14% { border-color: orange; }
  28% { border-color: yellow; }
  42% { border-color: green; }
  57% { border-color: blue; }
  71% { border-color: indigo; }
  85% { border-color: violet; }
  100% { border-color: red; }
}
@keyframes rainbow-shadow {
  0% { box-shadow: 0 10px 10px red; }
  14% { box-shadow: 0 -10px 10px orange; }
  28% { box-shadow: 0 10px 10px yellow; }
  42% { box-shadow: 0 -10px 10px green; }
  57% { box-shadow: 0 10px 10px blue; }
  71% { box-shadow: 0 -10px 10px indigo; }
  85% { box-shadow: 0 10px 10px violet; }
  100% { box-shadow: 0 -10px 10px red; }
}
@keyframes circle-motion {
  0% {
    transform: translate(0, 0) rotate(0deg) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  25% {
    transform: translate(50px, 0) rotate(90deg) matrix3d(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
  }
  50% {
    transform: translate(50px, 500px) rotate(180deg) matrix3d(3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1);
  }
  75% {
    transform: translate(0, 50px) rotate(270deg) matrix3d(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
  }
  100% {
    transform: translate(0, 0) rotate(360deg) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
}
.highlight {
  border: 2px solid; /* 두께 설정 */
  animation: rainbow-border 1.5s linear infinite, rainbow-shadow 1.5s linear infinite; /* 애니메이션 설정 */
  /* box-shadow: 0 0 10px rgba(255, 255, 0, 0.8); /* 반짝임 효과 */
  transform: scale(1.1);
}
</style>

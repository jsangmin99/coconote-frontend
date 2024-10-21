<template>
  <div>
    <h2>태그 전체보기</h2>
    <hr>
    <h4>태그 리스트</h4>
    <div class="tag-list">
      <div class="tag-container" v-for="(tag, index) in tagList" :key="index" @contextmenu.prevent="showContextMenu(tag, $event)">
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
      <div v-if="selectedTags.length === 0" class="no-tags">선택된 태그가 없습니다.</div>
      <div v-else class="selected-tag" v-for="(tag, index) in selectedTags" :key="index">
        <span :style="{ backgroundColor: tag.color }">{{ tag.name }}</span>
        <button @click="removeTag(tag)">x</button>
      </div>
    </div>

    <button v-if="selectedTags.length > 0" class="search-btn" @click="searchBySelectedTags">선택된 태그로 검색</button>

    <hr>
    <h4>검색 결과</h4>
    <div class="filter-result">
      <div v-if="searchResults.length === 0" class="no-results">검색 결과가 없습니다.</div>
      <ul v-else>
        <li v-for="(result, index) in searchResults" :key="index">
          <div class="result-content">
            <img v-if="result.image" :src="result.image" alt="프로필 이미지" class="result-image">
            <div class="result-details">
              <strong class="result-title">{{ result.memberName }}</strong>
              <p class="result-content-text">{{ result.content }}</p>
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
      }
    },

    removeTag(tag) {
      this.selectedTags = this.selectedTags.filter(selectedTag => selectedTag.id !== tag.id);
    },

    async searchBySelectedTags() {
      try {
        const params = new URLSearchParams();
        params.append('workspaceId', localStorage.getItem('workspaceId'));
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
/* 태그 리스트 스타일 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
  border-radius: 16px;
  padding: 8px 14px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.tag:hover {
  transform: scale(1.05);
}

/* 메뉴 버튼 스타일 */
.menu-btn {
  display: none;
  position: absolute;
  top: -15px;
  right: -8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
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
  max-height: 23%; /* 원하는 최대 높이 설정 */
  overflow-y: auto; /* 세로 스크롤 표시 */
  border: 1px solid #ccc; /* 선택 사항: 경계선 추가 */
  border-radius: 8px; /* 선택 사항: 경계선 둥글게 */
  padding: 10px; /* 선택 사항: 패딩 추가 */
  background-color: white;
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
  transform: translateY(-2px);
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
</style>

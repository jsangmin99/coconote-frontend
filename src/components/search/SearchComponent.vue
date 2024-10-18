<template>
  <div class="search-page-container">
    <div class="search-page">
      <!-- 검색 창 -->
      <div class="search-bar">
        <input ref="searchInput" v-model="keyword" @input="fetchAutocomplete" @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp" @keydown.enter.prevent="handleEnter" @keydown.esc="closeAutocomplete"
          placeholder="검색어를 입력하세요" class="search-input" />

        <button @click="search" class="search-button">검색</button>
      </div>

      <!-- 자동완성 리스트 -->
      <div v-if="autocompleteSuggestions.length > 0" class="autocomplete-suggestions" ref="autocomplete">
        <ul>
          <li v-for="(suggestion, index) in autocompleteSuggestions" :key="suggestion"
            @click="selectSuggestion(suggestion)" :class="{ active: index === suggestionIndex }">
            {{ suggestion }}
          </li>
        </ul>
      </div>

      <!-- 상단 탭 -->
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'ALL' }" @click="setTab('ALL')">
          전체 ({{ totalAll }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'MEMBER' }" @click="setTab('MEMBER')">
          멤버 ({{ totalMembers }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'FILE' }" @click="setTab('FILE')">
          파일 ({{ totalFiles }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'CHANNEL' }" @click="setTab('CHANNEL')">
          채널 ({{ totalChannels }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'THREAD' }" @click="setTab('THREAD')">
          쓰레드 ({{ totalThreads }})
        </div>
        <div class="tab" :class="{ active: activeTab === 'CANVAS_BLOCK' }" @click="setTab('CANVASBLOCK')">
          캔버스 & 블록 ({{ totalCanvasBlocks }})
        </div>
      </div>

      <!-- 검색 결과 표시 -->
      <div v-if="loading" class="loading-message">Loading...</div>

      <div v-if="!loading" class="result-container">
        <!-- 전체 검색 시 모든 카테고리 결과 출력 -->
        <template v-if="activeTab === 'ALL'">
          <div v-if="totalMembers > 0" class="category-section">
            <h3>멤버 검색 결과 ({{ totalMembers }})</h3>
            <div v-for="(result, index) in results.workspaceMembers" :key="index" class="result-card">
              <h3>{{ result.memberName || '멤버 이름 없음' }}</h3>
              <p>{{ result.email || '이메일 없음' }}</p>
            </div>
          </div>

          <div v-if="totalFiles > 0" class="category-section">
            <h3>파일 검색 결과 ({{ totalFiles }})</h3>
            <div v-for="(result, index) in results.files" :key="index" class="result-card">
              <h3>{{ result.fileName || '파일 이름 없음' }}</h3>
              <p><a :href="result.fileUrl" target="_blank">Download</a></p>
            </div>
          </div>

          <div v-if="totalChannels > 0" class="category-section">
            <h3>채널 검색 결과 ({{ totalChannels }})</h3>
            <div v-for="(result, index) in results.channels" :key="index" class="result-card">
              <h3>{{ result.channelName || '채널 이름 없음' }}</h3>
              <p>{{ result.channelInfo || '채널 정보 없음' }}</p>
            </div>
          </div>

          <div v-if="totalThreads > 0" class="category-section">
            <h3>쓰레드 검색 결과 ({{ totalThreads }})</h3>
            <div v-for="(result, index) in results.threads" :key="index" class="result-card"
              @click="moveToThread(result.channelId, result.threadId)">
              <h3>{{ result.content || '내용 없음' }}</h3>
              <p class="metadata">Posted by: {{ result.memberName }} | {{ result.createdTime }}</p>
            </div>
          </div>

          <div v-if="totalCanvasBlocks > 0" class="category-section">
            <h3>캔버스 & 블록 검색 결과 ({{ totalCanvasBlocks }})</h3>
            <div v-for="(result, index) in results.canvasBlocks" :key="index" class="result-card">
              <h3>{{ result.canvasTitle || '제목 없음' }} (Canvas & Block)</h3>
              <p>{{ result.blockContents || '내용 없음' }}</p>
            </div>
          </div>
        </template>

        <!-- 카테고리별 검색 결과 -->
        <template v-else>
          <div v-for="(result, index) in results" :key="index" class="result-card">
            <template v-if="activeTab === 'CANVAS_BLOCK'">
              <h3>{{ result.canvasTitle || '제목 없음' }} (Canvas & Block)</h3>
              <p>{{ result.blockContents || '내용 없음' }}</p>
            </template>
            <template v-else-if="activeTab === 'CHANNEL'">
              <h3>{{ result.channelName || '채널 이름 없음' }}</h3>
              <p>{{ result.channelInfo || '채널 정보 없음' }}</p>
            </template>
            <template v-else-if="activeTab === 'FILE'">
              <h3>{{ result.fileName || '파일 이름 없음' }}</h3>
              <p><a :href="result.fileUrl" target="_blank">Download</a></p>
            </template>
            <template v-else-if="activeTab === 'THREAD'">
              <h3>{{ result.content || '내용 없음' }}</h3>
              <p class="metadata">Posted by: {{ result.memberName }} | {{ result.createdTime }}</p>
            </template>
            <template v-else-if="activeTab === 'MEMBER'">
              <h3>{{ result.memberName || '멤버 이름 없음' }}</h3>
              <p>{{ result.email || '이메일 없음' }}</p>
            </template>
          </div>
        </template>

        <!-- 페이징 -->
        <div class="pagination">
          <button @click="previousPage" :disabled="currentPage === 1">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
        </div>
      </div>

      <div v-if="!loading && results.length === 0" class="no-results-message">No results found.</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import debounce from 'lodash/debounce';

export default {
  props: ['workspaceId'],
  data() {
    return {
      keyword: '',
      results: {
        workspaceMembers: [],
        files: [],
        channels: [],
        threads: [],
        canvasBlocks: [],
      },
      autocompleteSuggestions: [],
      suggestionIndex: -1, // 선택된 제안의 인덱스
      loading: false,
      currentPage: 1,
      totalPages: 1,
      pageSize: 20,
      activeTab: 'ALL',

      // 각 카테고리별 검색 결과 총 개수
      totalAll: 0,
      totalMembers: 0,
      totalFiles: 0,
      totalChannels: 0,
      totalThreads: 0,
      totalCanvasBlocks: 0,
    };
  },
  created() {
    // Debounce 처리된 자동완성 함수 설정
    this.fetchAutocomplete = debounce(this.fetchAutocomplete, 300);
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  watch: {
    activeTab() {
      this.search(); // 자동으로 검색을 트리거
    }
  },
  methods: {

    async search() {
      if (!this.keyword || this.keyword.length < 2) {
        return; // 검색어가 없거나 2글자 미만일 경우 검색하지 않음
      }
      this.loading = true;
      this.autocompleteSuggestions = []; // 검색 시 자동완성 리스트 닫기

      let url = `${process.env.VUE_APP_API_BASE_URL}/search`;
      if (this.activeTab !== 'ALL') {
        // 각 카테고리별로 요청할 URL 설정
        url += `/${this.activeTab.toLowerCase()}s`;
      }

      try {
        const response = await axios.get(url, {
          params: {
            workspaceId: this.workspaceId,
            keyword: this.keyword,
            page: this.currentPage - 1, // 0-based 페이지
            size: this.pageSize,
          }
        });

        if (response.data && response.data.result) {
          // 전체 검색일 경우 결과를 카테고리별로 저장
          if (this.activeTab === 'ALL') {
            this.results = {
              workspaceMembers: response.data.result.workspaceMembers || [],
              files: response.data.result.files || [],
              channels: response.data.result.channels || [],
              threads: response.data.result.threads || [],
              canvasBlocks: response.data.result.canvasBlocks || [],
            };
            this.totalMembers = response.data.result.totalMembers || 0;
            this.totalFiles = response.data.result.totalFiles || 0;
            this.totalChannels = response.data.result.totalChannels || 0;
            this.totalThreads = response.data.result.totalThreads || 0;
            this.totalCanvasBlocks = response.data.result.totalCanvasBlocks || 0;
            this.totalAll = this.totalMembers + this.totalFiles + this.totalChannels + this.totalThreads + this.totalCanvasBlocks;

            // 전체 결과 수를 기반으로 totalPages 계산
            const totalResults = this.totalAll;
            this.totalPages = Math.ceil(totalResults / this.pageSize);
          } else {
            // 카테고리별 검색일 경우 results 배열에 결과 저장
            this.results = response.data.result.results || [];
            this.totalPages = Math.ceil(response.data.result.total / this.pageSize);
          }
        } else {
          this.resetResults(); // 검색 결과가 없을 경우에도 결과 초기화
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        this.loading = false;
      }
    },

    handleEnter() {
      // 자동완성 리스트에서 선택된 항목이 있을 때
      if (this.suggestionIndex !== -1 && this.autocompleteSuggestions[this.suggestionIndex]) {
        this.selectSuggestion(this.autocompleteSuggestions[this.suggestionIndex]);
      } else {
        // 선택된 항목이 없으면 그냥 검색
        this.search();
      }
    },

    // 자동완성 데이터 가져오기
    async fetchAutocomplete() {
      if (this.keyword.length < 2) {
        this.autocompleteSuggestions = [];
        return;
      }

      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/autocomplete`, {
          params: {
            workspaceId: this.workspaceId,
            keyword: this.keyword,
            target: this.activeTab.toUpperCase(),
          }
        });

        this.autocompleteSuggestions = response.data?.result || [];
        this.suggestionIndex = -1; // 자동완성 결과를 가져오면 인덱스를 초기화

      } catch (error) {
        console.error('Autocomplete failed:', error);
        this.autocompleteSuggestions = [];
      }
    },

    moveDown() {
      if (this.autocompleteSuggestions.length > 0 && this.suggestionIndex < this.autocompleteSuggestions.length - 1) {
        this.suggestionIndex++;
      }
    },

    moveUp() {
      if (this.autocompleteSuggestions.length > 0 && this.suggestionIndex > 0) {
        this.suggestionIndex--;
      }
    },

    moveToThread(channelId, threadId) {
      this.$router.push({
        path: `/channel/${channelId}/thread/view`,
        query: { threadId }
      });
    },


    handleClickOutside(event) {
      const autocomplete = this.$refs.autocomplete;
      const searchInput = this.$refs.searchInput;

      // autocomplete 목록이나 search input을 클릭했는지 여부를 체크
      if (
        (autocomplete && !autocomplete.contains(event.target)) &&
        (searchInput && !searchInput.contains(event.target))
      ) {
        this.autocompleteSuggestions = [];
      }
    },

    selectSuggestion(suggestion) {
      if (suggestion) {
        this.keyword = suggestion;
        this.closeAutocomplete();
        this.search();
      }
    },

    closeAutocomplete() {
      this.autocompleteSuggestions = [];
      this.suggestionIndex = -1;
    },

    setTab(tab) {
      this.activeTab = tab;
      this.currentPage = 1;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.search();
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.search();
      }
    },

    resetResults() {
      this.results = {}; // results를 빈 객체로 초기화
      this.totalMembers = 0;
      this.totalFiles = 0;
      this.totalChannels = 0;
      this.totalThreads = 0;
      this.totalCanvasBlocks = 0;
      this.totalAll = 0;
    }
  }
};

</script>

<style scoped>
/* 스크롤 추가 */
.result-container {
  min-height: 300px;
  /* 최소 높이를 300px로 설정 */
  max-height: 650px;
  /* 최대 높이를 600px로 설정 */
  overflow-y: auto;
  padding: 20px;
  background-color: #f7f7f7;
  /* 밝은 배경 색상 */
  border-radius: 8px;
}

.autocomplete-suggestions {
  background-color: white;
  border: 1px solid #ccc;
  position: absolute;
  max-height: 200px;
  overflow-y: auto;
  width: 55%;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.autocomplete-suggestions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.autocomplete-suggestions li {
  padding: 10px;
  cursor: pointer;
  color: #333;
}

.autocomplete-suggestions li:hover {
  background-color: #f1f1f1;
}

.autocomplete-suggestions li.active {
  background-color: #e0e0e0;
}

.search-page-container {
  display: flex;
  justify-content: space-between;
}

/* .dummy-container {
  width: 15%;
 } 
*/

.search-page {
  flex: 1;
  max-width: 95%;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 90vh;
  /* 화면의 90% 높이로 설정 */
}

.search-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.search-input {
  width: 80%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 50px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #3a8bcd;
  box-shadow: 0 4px 8px rgba(58, 139, 205, 0.3);
}

.search-button {
  padding: 12px 20px;
  margin-left: -50px;
  /* 버튼을 검색 바 안으로 겹치게 하기 위해 왼쪽 마진을 설정 */
  background-color: #3a8bcd;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-button:hover {
  background-color: #337ab7;
  transform: scale(1.05);
}

.search-button:active {
  background-color: #2a5f8f;
  transform: scale(0.98);
}

.result-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-message,
.no-results-message {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
  /* 버튼과 텍스트를 수직으로 가운데 정렬 */

}

.pagination button {
  padding: 10px;
  background-color: #3a8bcd;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.pagination button:hover {
  background-color: #337ab7;
}

.pagination span {
  color: #555;
  font-size: 14px;
  margin-top: 5px;
  /* 살짝 아래로 내리기 */
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px;
  background-color: #f1f1f1;
  border-radius: 4px;
  cursor: pointer;
  color: #333;
  transition: background-color 0.3s ease;
}

.tab:hover {
  background-color: #ddd;
}

.tab.active {
  background-color: #3a8bcd;
  color: white;
}

.category-section {
  margin-bottom: 30px;
}

h3 {
  color: #333;
  margin-bottom: 10px;
}

p {
  color: #666;
}

a {
  color: #3a8bcd;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>

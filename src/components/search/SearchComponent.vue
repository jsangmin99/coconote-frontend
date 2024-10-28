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
        <div v-if="activeTab === 'ALL'">
          <div v-if="results.workspaceMembers.length > 0" class="category-section">
            <h3>멤버 검색 결과 ({{ totalMembers }})</h3>
            <div v-for="(result, index) in results.workspaceMembers" :key="index" class="result-card">
              <h3>{{ result.memberName || '멤버 이름 없음' }}</h3>
              <p>{{ result.email || '이메일 없음' }}</p>
            </div>
          </div>

          <div v-if="results.files.length > 0" class="category-section">
            <h3>파일 검색 결과 ({{ totalFiles }})</h3>
            <div v-for="(result, index) in results.files" :key="index" class="file-result-card"
              @click="moveToFileLocation(result.channelId, result.folderId, result.fileId)">
              <div class="file-info">
                <img :src="result.fileUrl" alt="File Preview" class="file-preview" />
                <div class="file-details">
                  <h3 class="file-name">{{ result.fileName || '파일 이름 없음' }}</h3>
                  <span class="result-channel" style="margin-left: auto;">
                      채널: {{ result.channelName || '채널 없음' }}
                    </span>
                  <p class="file-link">
                    <button @click.stop.prevent="downloadFile(result.fileId)"
                      style="color: blue; background: none; border: none; cursor: pointer; text-decoration: underline;">Download</button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="results.channels.length > 0" class="category-section">
            <h3>채널 검색 결과 ({{ totalChannels }})</h3>
            <div v-for="(result, index) in results.channels" :key="index" class="channel-result-card">
              <div class="channel-status">
                <i :class="result.isPublic ? 'mdi mdi-lock-open-outline' : 'mdi mdi-lock'" class="lock-icon"></i>
              </div>
              <div class="channel-info">
                <h3 class="channel-name">{{ result.channelName || '채널 이름 없음' }}</h3>
                <p class="channel-description">{{ result.channelInfo || '채널 설명 없음' }}</p>
                <button @click="handleChannelClick(result.channelId, result.channelName, result.channelInfo)"
                  class="moveToChannel">채널 이동</button>
              </div>
            </div>
          </div>

          <div v-if="results.threads.length > 0" class="category-section">
            <h3>쓰레드 검색 결과 ({{ totalThreads }})</h3>
            <div v-for="(result, index) in results.threads" :key="index" class="result-card"
              @click="moveToThread(result.channelId, result.threadId, result.parentThreadId)">
              <img v-if="result.profileImageUrl" :src="result.profileImageUrl" alt="프로필 이미지" class="result-image" style="width: 50px; height: 50px">
              <h3>{{ result.content || '내용 없음' }}</h3>
              <span class="result-channel" style="margin-left: auto;">
                채널: {{ result.channelName || '채널 없음' }}
              </span>
              <p class="metadata">Posted by: {{ result.memberName }} | {{ result.createdTime }}</p>
            </div>
          </div>

          <div v-if="results.canvasBlocks.length > 0" class="category-section">
            <h3 class="category-title">캔버스 & 블록 검색 결과 ({{ totalCanvasBlocks }})</h3>
            <div v-for="(result, index) in results.canvasBlocks" :key="index" class="canvas-block-result-card">

              <div class="result-header">
                <v-chip :color="result.type === 'canvas' ? 'success' : 'primary'" dark small class="type-badge">
                  {{ result.type === 'canvas' ? '캔버스' : '블록' }}
                </v-chip>

                <span class="result-channel">
                  채널: {{ result.channelName || '채널 없음' }}
                </span>
              </div>
              <h4 class="result-title">
                {{ result.canvasTitle || '제목 없음' }}
              </h4>
              <p v-if="result.type === 'block'" class="block-contents">
                {{ result.blockContents || '내용 없음' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 개별 카테고리 탭에서의 검색 결과 -->
        <template v-else>
          <div v-if="activeTab === 'MEMBER' && results.length > 0" class="category-section">
            <h3>멤버 검색 결과 ({{ totalMembers }})</h3>
            <div v-for="(result, index) in results" :key="index" class="result-card">
              <h3>{{ result.memberName || '멤버 이름 없음' }}</h3>
              <p>{{ result.email || '이메일 없음' }}</p>
            </div>
          </div>

          <div v-if="activeTab === 'FILE' && results.length > 0" class="category-section">
            <h3>파일 검색 결과 ({{ totalFiles }})</h3>
            <div v-for="(result, index) in results" :key="index" class="file-result-card"
              @click="moveToFileLocation(result.channelId, result.folderId, result.fileId)">
              <div class="file-info">
                <img :src="result.fileUrl" alt="File Preview" class="file-preview" />
                <div class="file-details">
                  <h3 class="file-name">{{ result.fileName || '파일 이름 없음' }}</h3>
                  <span class="result-channel" style="margin-left: auto;">
                      채널: {{ result.channelName || '채널 없음' }}
                    </span>
                  <p class="file-link">
                    <button @click.stop.prevent="downloadFile(result.fileId)"
                      style="color: blue; background: none; border: none; cursor: pointer; text-decoration: underline;">Download</button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'CHANNEL' && results.length > 0" class="category-section">
            <h3>채널 검색 결과 ({{ totalChannels }})</h3>
            <div v-for="(result, index) in results" :key="index" class="channel-result-card">
              <div class="channel-status">
                <i :class="result.isPublic ? 'mdi mdi-lock-open-outline' : 'mdi mdi-lock'" class="lock-icon"></i>
              </div>
              <div class="channel-info">
                <h3 class="channel-name">{{ result.channelName || '채널 이름 없음' }}</h3>
                <p class="channel-description">{{ result.channelInfo || '채널 설명 없음' }}</p>
                <button @click="handleChannelClick(result.channelId, result.channelName, result.channelInfo)"
                  class="moveToChannel">채널 이동</button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'THREAD' && results.length > 0" class="category-section">
            <h3>쓰레드 검색 결과 ({{ totalThreads }})</h3>
            <div v-for="(result, index) in results" :key="index" class="result-card"
              @click="moveToThread(result.channelId, result.threadId, result.parentThreadId)">
              <img v-if="result.profileImageUrl" :src="result.profileImageUrl" alt="프로필 이미지" class="result-image" style="width: 50px; height: 50px">
              <h3>{{ result.content || '내용 없음' }}</h3>
              <span class="result-channel" style="margin-left: auto;">
                채널: {{ result.channelName || '채널 없음' }}
              </span>
              <p class="metadata">Posted by: {{ result.memberName }} | {{ result.createdTime }}</p>
            </div>
          </div>

          <div v-if="activeTab === 'CANVASBLOCK' && results.length > 0" class="category-section">
            <h3 class="category-title">캔버스 & 블록 검색 결과 ({{ totalCanvasBlocks }})</h3>
            <div v-for="(result, index) in results" :key="index" class="canvas-block-result-card">
              <div class="result-header">
                <v-chip :color="result.type === 'canvas' ? 'success' : 'primary'" dark small class="type-badge">
                  {{ result.type === 'canvas' ? '캔버스' : '블록' }}
                </v-chip>

                <span class="result-channel" style="margin-left: auto;"> <!-- 오른쪽 정렬 -->
                  채널: {{ result.channelName || '채널 없음' }}
                </span>
              </div>
              <h4 class="result-title">
                {{ result.canvasTitle || '제목 없음' }}
              </h4>
              <p v-if="result.type === 'block'" class="block-contents">
                {{ result.blockContents || '내용 없음' }}
              </p>
            </div>
          </div>
        </template>

        <!-- 페이징 -->
        <div class="pagination">
          <button @click="previousPage" :disabled="currentPage === 1">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
        </div>
      </div>

      <div v-if="!loading && totalAll === 0" class="no-results-message">No results found.</div>
    </div>
  </div>
</template>



<script>
import axios from 'axios';
import debounce from 'lodash/debounce';
import { mapActions } from 'vuex';

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
    this.fetchAutocomplete = debounce(this.fetchAutocomplete, 500);
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  watch: {
    activeTab() {
      if (this.keyword.length >= 2) {
        this.search();
      }
    }
  },
  methods: {

    async search() {
      if (!this.keyword || this.keyword.length < 2) {
        return; // 검색어가 없거나 2글자 미만일 경우 검색하지 않음
      }
      this.loading = true;
      this.closeAutocomplete(); // 검색 시 자동완성 리스트 닫기
      this.fetchAutocomplete.cancel(); // debounce를 취소해 자동완성 요청 방지


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
            let channels = response.data.result.channels || [];
            this.totalChannels = response.data.result.totalChannels || 0;

            // 비공개 채널의 경우 가입 여부 확인하여 필터링
            const filteredChannels = await Promise.all(
              channels.map(async (channel) => {
                if (!channel.isPublic) {
                  const isJoinResponse = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/channel/${channel.channelId}/isjoin`
                  );
                  const isJoin = isJoinResponse.data.result;
                  if (!isJoin) {
                    return null; // 가입되지 않은 비공개 채널은 제외
                  }
                }
                return channel;
              })
            );

            // null 값이 아닌 채널만 필터링
            this.results = {
              workspaceMembers: response.data.result.workspaceMembers || [],
              files: response.data.result.files || [],
              channels: filteredChannels.filter((channel) => channel !== null),
              threads: response.data.result.threads || [],
              canvasBlocks: response.data.result.canvasBlocks || [],
            };

            this.totalMembers = response.data.result.totalMembers || 0;
            this.totalFiles = response.data.result.totalFiles || 0;
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
      // 자동완성에서 항목이 선택된 경우
      if (this.suggestionIndex !== -1 && this.autocompleteSuggestions[this.suggestionIndex]) {
        this.selectSuggestion(this.autocompleteSuggestions[this.suggestionIndex]);
      } else {
        // 선택된 항목이 없으면 검색하고 자동완성 창 닫기
        this.search();
        this.closeAutocomplete();  // 자동완성 창 닫기
        this.autocompleteSuggestions = [];  // 자동완성 데이터 비우기
        this.$refs.searchInput.blur(); // 검색 후 입력창 포커스 해제
      }
    },

    // 자동완성 데이터 가져오기
    async fetchAutocomplete() {
      if (!this.keyword || this.keyword.length < 2) {
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

    moveToThread(channelId, threadId, parentThreadId) {
      console.log("parentThreadId: ", parentThreadId);

      window.location.href = `/channel/${channelId}/thread/view?threadId=${threadId}&parentThreadId=${parentThreadId}`;
      // this.$router.push({
      //   path: `/channel/${channelId}/thread/view`,
      //   query: { threadId }
      // });
    },

    // 파일 위치로 이동
    async moveToFileLocation(channelId, folderId, fileId) {
      console.log("파일 위치로 이동:", channelId, folderId, fileId);
      if (!folderId || !channelId) {
        alert("파일의 위치를 찾을 수 없습니다.");
        return;
      }
      try {
        // 드라이브 경로로 이동
        window.location.href = `/channel/${channelId}/drive/view/${folderId}?fileId=${fileId}`;

        // Vue Router를 사용하여 폴더 및 파일 경로로 이동
        // this.$router.push({
        // path: `/channel/${channelId}/drive/view/${folderId}`,
        // query: { fileId }
        // });

      } catch (error) {
        console.error("파일 위치로 이동 중 오류 발생:", error);
      }

    },

    async downloadFile(fileId) {
      try {
        // presigned URL 가져오기
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/files/${fileId}/download`
        );

        const presignedUrl = response.data.result; // presigned URL 가져오기

        // Blob을 사용하여 파일 다운로드
        const fileResponse = await axios.get(presignedUrl, { responseType: "blob" });

        // 파일 이름 추출
        const fileName = response.headers["content-disposition"]
          ? response.headers["content-disposition"]
            .split("filename=")[1]
            .replace(/"/g, "")
          : "downloaded_file";

        // Blob을 파일로 변환하여 다운로드
        const blob = new Blob([fileResponse.data], {
          type: fileResponse.headers["content-type"],
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", fileName); // 서버에서 전달된 파일 이름으로 설정
        document.body.appendChild(link);
        link.click(); // 링크 클릭 이벤트로 다운로드 시작
        document.body.removeChild(link); // 링크 제거
      } catch (error) {
        console.error("파일 다운로드에 실패했습니다.", error);
        alert("파일 다운로드 중 오류가 발생했습니다.");
      }
    },

    async handleChannelClick(id, name, desc) {
      this.selectedChannelMenuId = id;
      this.setChannelInfoActions(id);
      this.setChannelNameInfoActions(name);
      this.setChannelDescInfoActions(desc);

      // Vuex에 현재 채널 설정
      this.$store.dispatch("notifications/changeChannel", id);

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/channel/${id}/isjoin`
        );

        const isJoin = response.data.result;

        if (isJoin) {
          this.$router.push(`/channel/${id}/thread/view`);
        } else {
          this.$router.push({
            path: `/channel/${id}`,
            query: { isJoin: false },
          });
        }
      } catch (error) {
        console.error('Failed to check channel join status:', error);
      }
    },
    ...mapActions([
      'setChannelInfoActions',
      'setChannelNameInfoActions',
      'setChannelDescInfoActions',
    ]),



    handleClickOutside(event) {
      const autocomplete = this.$refs.autocomplete;
      const searchInput = this.$refs.searchInput;

      // autocomplete 목록이나 search input을 클릭했는지 여부를 체크
      if (autocomplete && searchInput && !autocomplete.contains(event.target) && !searchInput.contains(event.target)) {

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
    },
  }
};

</script>

<style scoped>
/* 기본 검색 페이지 스타일 */
.search-page-container {
  display: flex;
  justify-content: space-between;
}

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

/* 검색 바 스타일 */
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

/* 자동완성 리스트 스타일 */
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

/* 탭 스타일 */
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

/* 결과 컨테이너 및 메시지 */
.result-container {
  min-height: 300px;
  /* 최소 높이를 300px로 설정 */
  max-height: 78%;
  /* 최대 높이를 650px로 설정 */
  overflow-y: auto;
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 8px;
}

.loading-message,
.no-results-message {
  text-align: center;
  font-size: 1.2em;
  color: #666;
}

/* 카테고리 섹션 스타일 */
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

/* 캔버스 & 블록 검색 결과 카드 스타일 */
.canvas-block-result-card {
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.canvas-block-result-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 결과 헤더 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-type {
  font-size: 1.1em;
  font-weight: bold;
  color: #3a8bcd;
}

.channel-name {
  font-size: 0.9em;
  color: #888;
}

/* 블록 내용 */
.block-contents {
  color: #666;
  font-size: 1em;
  line-height: 1.5;
}

/* 페이징 스타일 */
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

/* 공통 카드 스타일 */
.result-card,
.file-result-card,
.channel-result-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.result-card:hover,
.file-result-card:hover,
.channel-result-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 파일 결과 스타일 */
.file-info {
  display: flex;
  align-items: center;
}

.file-preview {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  border-radius: 4px;
  object-fit: cover;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.file-link a {
  color: #3a8bcd;
  font-size: 14px;
  text-decoration: none;
  margin-top: 5px;
}

.file-link a:hover {
  text-decoration: underline;
}

/* 채널 정보 스타일 */
.channel-status {
  margin-right: 15px;
}

.lock-icon {
  font-size: 24px;
  color: #888;
}

.channel-info {
  display: flex;
  flex-direction: column;
}

.channel-name {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.channel-description {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}

.moveToChannel {
  background-color: #3a8bcd;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
  transition: background-color 0.3s ease;
}

.moveToChannel:hover {
  background-color: #337ab7;
}
</style>

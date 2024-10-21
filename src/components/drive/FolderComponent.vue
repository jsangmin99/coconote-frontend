<template>
  <div class="drive-container">
    <!-- 현재 경로 표시 -->
    <div class="breadcrumb">
      <!-- 루트 경로로 드래그 앤 드롭 가능하게 설정 -->
      <span @click="navigateToFolder(rootFolderId)" class="breadcrumb-item"
        :class="{ active: currentFolderId === rootFolderId }" draggable="true" @dragover.prevent
        @drop="onDrop($event, rootFolderId)">
        root
      </span>

      <span v-if="breadcrumb.length"> > </span>
      <span v-for="(folder, index) in breadcrumb" :key="folder.folderId" class="breadcrumb-item" draggable="true"
        @dragover.prevent @drop="onDrop($event, folder.folderId)" @click="navigateToFolder(folder.folderId)">
        {{ folder.folderName }}
        <span v-if="index !== breadcrumb.length - 1"> > </span>
      </span>
    </div>

    <!-- 툴바 -->
    <div class="toolbar">
      <!-- 뒤로 가기 버튼 -->
      <!-- eslint-disable-next-line -->
      <button @click="goToParentFolder" class="back-btn">
        <v-icon icon="mdi-folder-arrow-up" /> 상위폴더로 가기
      </button>
      <!-- 파일 선택 라벨, 아이콘 추가 -->
      <label for="file-upload" class="btn upload-btn">
        <v-icon icon="mdi-upload" />
        올리기
      </label>
      <input type="file" multiple @change="onFileChange" id="file-upload" hidden />

      <!-- 새 폴더 버튼 -->
      <button @click="createFolder" class="btn new-folder-btn">새 폴더</button>
    </div>

    <div v-if="uploadProgress.length">
      <h3>업로드 진행상황</h3>
      <ul>
        <li v-for="(progress, index) in uploadProgress" :key="index">
          {{ files[index].name }}: {{ progress }}%
        </li>
      </ul>
    </div>

    <!-- 폴더 목록 -->
    <div class="folder-list">
      <div v-for="folder in folderList" :key="folder.folderId" class="folder-item"
        :class="{ selected: selectedItems.includes(folder) }" draggable="true"
        @dragstart="onDragStart($event, 'folder', folder)" @dragover.prevent @drop="onDrop($event, folder.folderId)"
        @click="toggleSelection($event, 'folder', folder)" @dblclick="navigateToFolder(folder.folderId)"
        @contextmenu.prevent="showContextMenu($event, 'folder', folder)">
        <img src="@/assets/images/folder-icon.png" alt="folder icon" class="folder-icon" />
        <span class="folder-text">{{ truncateFileName(folder.folderName) }}</span>
      </div>
    </div>

    <!-- 파일 목록 -->
    <div class="file-list">
      <div v-for="file in fileList" :key="file.fileId" class="file-item" draggable="true"
        :class="{ selected: selectedItems.includes(file) }"
        @click="toggleSelection($event, 'file', file); showFullFileName(file.fileId)"
        @dragstart="onDragStart($event, 'file', file)" @dragover.prevent @drop="onDrop($event, null)"
        @contextmenu.prevent="showContextMenu($event, 'file', file)" @dblclick="openPreviewModal(file)">

        <!-- 이미지 파일일 경우 -->
        <template v-if="isImage(file.fileName)">
          <img :src="file.fileUrl" alt="Image Preview" class="file-preview" />
          <span class="file-text">
            {{ clickedFileId === file.fileId ? file.fileName : truncateFileName(file.fileName) }}
          </span>
        </template>

        <!-- PDF 파일일 경우 -->
        <template v-else-if="isPdf(file.fileName)">
          <div class="file-preview-container" @contextmenu.prevent="showContextMenu($event, 'file', file)">
            <img src="@/assets/images/pdf-icon.png" alt="PDF icon" class="file-icon" />
            <span class="file-text">
              {{ clickedFileId === file.fileId ? file.fileName : truncateFileName(file.fileName) }}
            </span>
          </div>
        </template>

        <!-- SVG 파일일 경우 -->
        <template v-else-if="isSvg(file.fileName)">
          <img :src="file.fileUrl" alt="SVG Preview" class="file-preview" />
          <span class="file-text">
            {{ clickedFileId === file.fileId ? file.fileName : truncateFileName(file.fileName) }}
          </span>
        </template>

        <!-- 기타 파일일 경우 -->
        <template v-else>
          <i class="file-icon">📄</i>
          <span class="file-text">
            {{ clickedFileId === file.fileId ? file.fileName : truncateFileName(file.fileName) }}
          </span>
        </template>
      </div>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div v-if="contextMenuVisible" class="context-menu"
      :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }">
      <ul>
        <li v-if="selectedItemType === 'folder'" @click="renameItem">이름 변경</li>
        <li v-if="selectedItemType === 'file'" @click="downloadFile(selectedItem.fileId)">다운로드</li>
        <li v-if="selectedItemType === 'file'" @click="renameItem">파일 이름 변경</li>
        <li @click="deleteItem">삭제</li>
      </ul>
    </div>
  </div>

  <!-- 파일 미리보기 모달 -->
  <div v-if="showPreviewModal" class="modal-overlay" @click.self="closePreviewModal">
    <div class="modal-content">
      <button class="close-btn" @click="closePreviewModal">닫기</button>
      <div v-if="selectedFile">
        <!-- 이미지 파일 미리보기 -->
        <template v-if="isImage(selectedFile.fileName)">
          <img :src="selectedFile.fileUrl" alt="Image Preview" class="modal-preview" />
        </template>

        <!-- PDF 파일 미리보기 -->
        <template v-else-if="isPdf(selectedFile.fileName)">
          <iframe :src="selectedFile.fileUrl" class="modal-preview" type="application/pdf"></iframe>
        </template>

        <!-- SVG 파일 미리보기 -->
        <template v-else-if="isSvg(selectedFile.fileName)">
          <img :src="selectedFile.fileUrl" alt="SVG Preview" class="modal-preview" />
        </template>

        <!-- 기타 파일일 경우 -->
        <template v-else>
          <p>파일 미리보기를 지원하지 않는 형식입니다.</p>
        </template>
      </div>
    </div>
  </div>

</template>



<script>
import axios from "@/services/axios";

export default {
  data() {
    return {
      folderList: [], // 현재 폴더 내 폴더 목록
      fileList: [], // 현재 폴더 내 파일 목록
      currentFolderId: null, // 현재 탐색 중인 폴더 ID
      rootFolderId: null, // 루트 폴더 ID 저장
      // backButtonHistory: [], // 이전 폴더 기록
      parentFolderId: null, // 현재 폴더의 부모 폴더 ID
      files: [], // 업로드할 파일 배열
      uploadProgress: [], // 파일 업로드 진행 상황
      breadcrumb: [], // 폴더 경로를 저장하는 배열
      draggedItem: null, // 드래그 중인 아이템
      draggedType: null, // 드래그 중인 타입 ('folder' 또는 'file')
      contextMenuVisible: false, // 우클릭 메뉴 표시 여부
      contextMenuPosition: { x: 0, y: 0 }, // 우클릭 메뉴 위치
      selectedItem: null, // 선택한 항목 (파일 또는 폴더)
      selectedItemType: null, // 선택한 항목의 타입 ('folder' 또는 'file')
      clickedFileId: null, // 클릭한 파일의 ID를 저장
      showPreviewModal: false, // 모달 상태를 저장
      selectedFile: null, // 선택된 파일 정보
      selectedItems: [], // 선택된 항목 목록
      lastSelectedIndex: null, // 마지막으로 선택된 항목의 인덱스
    };
  },
  methods: {
    // 항목 선택 토글
    toggleSelection(event, type, item) {
      const itemList = [...this.folderList, ...this.fileList]; // 폴더와 파일 목록을 결합
      const currentIndex = itemList.indexOf(item);

      if (event.ctrlKey || event.metaKey) {
        // Ctrl 또는 Cmd 키를 눌렀을 때 다중 선택
        const index = this.selectedItems.indexOf(item);
        if (index === -1) {
          this.selectedItems.push(item);
        } else {
          this.selectedItems.splice(index, 1);
        }
        this.lastSelectedIndex = currentIndex; // 마지막 선택된 인덱스를 업데이트
      } else if (event.shiftKey) {
        // Shift 키를 눌렀을 때 범위 선택
        if (this.lastSelectedIndex !== null) {
          const start = Math.min(this.lastSelectedIndex, currentIndex);
          const end = Math.max(this.lastSelectedIndex, currentIndex);
          this.selectedItems = [
            ...new Set([
              ...this.selectedItems,
              ...itemList.slice(start, end + 1)
            ])
          ]; // 중복 항목 없이 추가
        } else {
          // 이전에 선택된 항목이 없을 경우 단일 선택으로 처리
          this.selectedItems = [item];
        }
      } else {
        // 단일 선택
        this.selectedItems = [item];
        this.lastSelectedIndex = currentIndex; // 마지막 선택된 인덱스를 업데이트
      }
    },
    // 외부 클릭 시 선택 해제
    clearSelection(event) {
      // 클릭한 대상이 파일이나 폴더 항목이 아닐 경우 선택 해제
      if (!event.target.closest('.file-item') && !event.target.closest('.folder-item')) {
        this.selectedItems = [];
        this.lastSelectedIndex = null;
      }
    },
    // 파일 더블클릭 시 미리보기 모달 표시
    openPreviewModal(file) {
      this.selectedFile = file; // 선택된 파일 정보 저장
      this.showPreviewModal = true; // 모달 창 열기
    },
    // 모달 닫기
    closePreviewModal() {
      this.showPreviewModal = false;
      this.selectedFile = null; // 선택된 파일 정보 초기화
    },

    async loadChannelDrive() {
      const channelId = this.$route.params.channelId; // URL에서 채널 ID 추출
      const folderId = this.$route.params.folderId || null; // URL에서 폴더 ID 추출
      try {
        // 요청 URL을 폴더 ID가 있는 경우와 없는 경우로 분기
        console.log("xxxc", folderId);
        const url = folderId
          ? `${process.env.VUE_APP_API_BASE_URL}/drive/folder/${folderId}`
          : `${process.env.VUE_APP_API_BASE_URL}/channel/${channelId}/drive`;

        const response = await axios.get(url);
        const data = response.data.result;

        // 폴더와 파일 목록, 경로 설정
        this.rootFolderId = data.rootFolderId || data.nowFolderId; // 루트 폴더 ID 설정
        this.currentFolderId = data.nowFolderId || folderId; // 현재 폴더 ID 설정
        this.folderList = data.folderListDto || [];
        this.fileList = data.fileListDto || [];
        this.parentFolderId = data.parentFolderId || null; // 부모 폴더 ID 설정

        // Breadcrumb 설정
        this.breadcrumb = (data.breadcrumb || []).map((item) => ({
          folderId: item.folderId,
          folderName: item.folderName,
        }));

        // 선택된 파일 강조 표시
        if (this.$route.query.fileId) {
          this.highlightFile(this.$route.query.fileId);
        }
      } catch (error) {
        console.error("채널 드라이브 로딩 실패:", error);
        alert("채널 드라이브 로딩 중 오류가 발생했습니다.");
      }
    },

    // 드래그 시작 시 호출
    onDragStart(event, type, item) {
      if (this.selectedItems.length === 0 || !this.selectedItems.includes(item)) {
        this.selectedItems = [item];
      }
      event.dataTransfer.setData("items", JSON.stringify(this.selectedItems));
      this.draggedType = type;
      console.log(event.dataTransfer.getData("items"));
    },

    // 드롭 시 호출
    async onDrop(event, targetFolderId) {
      if (targetFolderId === null || targetFolderId === undefined) {
        alert("유효한 폴더 ID를 입력하세요.");
        return;
      }

      const draggedItems = JSON.parse(event.dataTransfer.getData("items"));
      const draggedFolders = draggedItems.filter(item => item.folderId);
      const draggedFiles = draggedItems.filter(item => item.fileId);

      // 폴더를 파일 안에 이동하지 않도록 처리
      if (draggedFolders.length > 0 && !targetFolderId) {
        alert("폴더는 파일 안에 이동할 수 없습니다.");
        return;
      }

      // 자기 자신에게 드롭하지 못하도록 하기
      if (draggedFolders.some(folder => folder.folderId === targetFolderId)) {
        alert("같은 폴더로 이동할 수 없습니다.");
        return;
      }

      if (draggedFiles.length > 0 && this.currentFolderId === targetFolderId) {
        alert("같은 위치로 파일을 이동할 수 없습니다.");
        return;
      }

      try {
        // 파일 이동 처리
        for (const file of draggedFiles) {
          await this.moveFile(file.fileId, targetFolderId);
        }

        // 폴더 이동 처리
        for (const folder of draggedFolders) {
          await this.moveFolder(folder.folderId, targetFolderId);
        }

        alert("항목이 성공적으로 이동되었습니다.");
      } catch (error) {
        console.error("항목 이동 실패:", error);
        alert("항목 이동 중 오류가 발생했습니다.");
      }

      this.draggedType = null;
      this.selectedItems = [];
      this.refreshFolderList();
    },


    // 폴더 생성
    async createFolder() {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/create`,
          {
            channelId: this.$route.params.channelId, // URL에서 채널 ID 추출
            parentFolderId: this.currentFolderId,
          }
        );
        alert(response.data.result.message || "폴더 생성 완료");
        this.refreshFolderList();
      } catch (error) {
        console.error("폴더 생성 실패:", error);
        alert("폴더 생성 중 오류가 발생했습니다.");
      }
    },

    // 상위 폴더로 가기
    goToParentFolder() {
      if (this.breadcrumb.length > 1) {
        // breadcrumb 배열의 마지막 바로 전 폴더가 상위 폴더
        const parentFolder = this.breadcrumb[this.breadcrumb.length - 2];

        // 상위 폴더로 이동
        this.navigateToFolder(parentFolder.folderId);

        // breadcrumb에서 현재 폴더를 제거하고 상위 폴더를 유지
        this.breadcrumb.pop();
      } else if (this.breadcrumb.length === 1) {
        // 루트 폴더가 남아있는 경우
        this.navigateToFolder(this.rootFolderId);
        this.breadcrumb = [];
      } else {
        alert("상위 폴더가 없습니다.");
      }
    },

    // 폴더 탐색
    // async refreshFolderList() {
    //   try {
    //     const folderId = this.currentFolderId || 1; // currentFolderId가 없으면 루트 폴더 ID 사용
    //     const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/drive/folder/${folderId}`);
    //     this.folderList = response.data.result.folderListDto || [];
    //     this.fileList = response.data.result.fileListDto || [];
    //   } catch (error) {
    //     console.error('폴더/파일 목록 갱신 실패:', error);
    //     alert('목록 갱신 중 오류가 발생했습니다.');
    //   }
    // },

    // 폴더/파일 목록 갱신
    async refreshFolderList() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/${this.currentFolderId}`
        );
        this.folderList = response.data.result.folderListDto || [];
        this.fileList = response.data.result.fileListDto || [];
      } catch (error) {
        console.error("폴더/파일 목록 갱신 실패:", error);
        alert("목록 갱신 중 오류가 발생했습니다.");
      }
    },

    // 파일 선택 처리
    onFileChange(event) {
      this.files = Array.from(event.target.files);
      this.uploadProgress = Array(this.files.length).fill(0); // 업로드 진행상황 초기화

      if (this.files.length > 0) {
        // 파일이 선택되면 즉시 업로드 실행
        this.uploadFiles();
      }
    },


    // 파일 이름을 정규화하는 함수
    normalizeFileName(fileName) {
      return fileName.normalize("NFC");
    },

    // 파일 업로드
    async uploadFiles() {
      if (!this.files.length) return;

      try {
        // 서버에 presigned URLs 요청
        const presignedUrlResponse = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/files/presigned-urls`,
          this.files.map((file) => ({
            fileName: file.name,
            fileSize: file.size,
          }))
        );

        const presignedUrls = presignedUrlResponse.data.result;

        // 각 파일에 대해 Presigned URL을 이용하여 S3에 업로드
        const uploadedFileUrls = await Promise.all(
          this.files.map((file) => this.uploadFileToS3(file, presignedUrls[file.name]))
        );

        // 파일 중 업로드가 실패한 파일이 있으면 필터링
        const successfulUploads = uploadedFileUrls.filter((url) => url !== null);

        // 성공적으로 업로드된 파일만 메타데이터 저장
        if (successfulUploads.length) {
          await this.saveFileMetadata(successfulUploads);
          alert("파일이 성공적으로 업로드되었습니다.");
        } else {
          alert("모든 파일 업로드에 실패했습니다.");
        }

        // 업로드 후 상태 초기화
        this.files = [];
        this.uploadProgress = [];
        this.refreshFolderList();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("파일 업로드 중 오류가 발생했습니다.");
      }
    },

    // S3에 파일 업로드
    async uploadFileToS3(file, presignedUrl) {
      try {
        const config = {
          headers: {
            "Content-Type": file.type, // 파일 타입 지정
          },
          onUploadProgress: (progressEvent) => {
            const index = this.files.indexOf(file); // 인덱스 찾기
            this.uploadProgress[index] = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            ); // 업로드 진행상황 업데이트
          },
        };

        await axios.put(presignedUrl, file, config);

        // S3에 업로드된 파일의 URL에서 ? 앞부분만 반환 (쿼리 파라미터 제거)
        return this.extractS3Url(presignedUrl);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return null; // 업로드 실패 시 null 반환
      }
    },

    // Presigned URL에서 ? 이전의 S3 URL만 남김
    extractS3Url(presignedUrl) {
      return presignedUrl.split("?")[0]; // ? 기준으로 앞부분만 추출
    },

    // 파일 메타데이터 저장
    async saveFileMetadata(uploadedFileUrls) {
      if (!this.currentFolderId) {
        alert("폴더를 선택해야 합니다.");
        return;
      }
      const metadataDto = {
        channelId: this.$route.params.channelId, // 적절한 채널 ID로 수정
        folderId: this.currentFolderId,
        fileType: "OTHER",
        fileSaveListDto: uploadedFileUrls.map((url, index) => ({
          fileName: this.normalizeFileName(this.files[index].name), // 파일 이름을 정규화하여 저장
          fileUrl: url,
        })),
      };

      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/files/metadata`, metadataDto);
    },
    async downloadFile(fileId) {
      try {
        // presigned URL 가져오기
        const response = await axios.get(
          `http://localhost:8080/api/v1/files/${fileId}/download`
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

    // 파일 이름 전체 표시
    showFullFileName(fileId) {
      this.clickedFileId = fileId; // 클릭한 파일의 ID를 저장
    },

    // 파일 이름 일부만 표시
    truncateFileName(fileName) {
      const maxLength = 15;
      if (fileName.length > maxLength) {
        const start = fileName.slice(0, 8);
        const end = fileName.slice(-5);
        return `${start}...${end}`;
      }
      return fileName;
    },

    isImage(fileName) {
      return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
    },

    isPdf(fileName) {
      return /\.pdf$/i.test(fileName);
    },

    isSvg(fileName) {
      return /\.svg$/i.test(fileName);
    },

    // 파일 삭제
    async deleteFile(fileId) {
      try {
        const confirmed = confirm("정말로 이 파일을 삭제하시겠습니까?");
        if (!confirmed) return;

        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/files/${fileId}`);
        alert("파일이 성공적으로 삭제되었습니다.");
        this.refreshFolderList();
      } catch (error) {
        console.error("파일 삭제 실패:", error);
        alert("파일 삭제 중 오류가 발생했습니다.");
      }
    },

    // 파일 이동
    // async moveFile(fileId) {
    //   const newFolderId = prompt("이동할 폴더 ID를 입력하세요:");
    //   if (!newFolderId) {
    //     alert("유효한 폴더 ID를 입력하세요.");
    //     return;
    //   }

    //   try {
    //     await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/files/move`, {
    //       fileId: fileId,
    //       folderId: newFolderId
    //     });
    //     alert('파일이 성공적으로 이동되었습니다.');
    //     this.refreshFolderList();
    //   } catch (error) {
    //     console.error('파일 이동 실패:', error);
    //     alert('파일 이동 중 오류가 발생했습니다.');
    //   }
    // },
    async moveFile(fileId, newFolderId) {
      try {
        await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/files/move`, {
          fileId: fileId,
          folderId: newFolderId,
        });
      } catch (error) {
        console.error("파일 이동 실패:", error);
      }
    },

    // 폴더 이동
    async moveFolder(folderId, newFolderId) {
      try {
        // MoveFolderReqDto에 맞는 형식으로 데이터를 전송
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/move`,
          {
            folderId: folderId, // 이동할 폴더 ID
            parentId: newFolderId, // 새로운 부모 폴더 ID
          }
        );
        console.log(response.data.result.message);
        alert("폴더가 성공적으로 이동되었습니다.");
        this.refreshFolderList();
      } catch (error) {
        console.error("폴더 이동 실패:", error);
        alert("폴더 이동 중 오류가 발생했습니다.");
      }
    },

    // 우클릭 메뉴 보이기
    showContextMenu(event, type, item) {
      event.preventDefault();
      this.contextMenuPosition = { x: event.clientX, y: event.clientY };

      // 다중 선택된 항목이 있는 경우
      if (this.selectedItems.length > 1) {
        this.selectedItem = null; // 개별 항목이 아닌 다중 선택 처리
        this.selectedItemType = 'multiple';
      } else {
        // 단일 항목 선택 시
        this.selectedItem = item;
        this.selectedItemType = type;

        // 다중 선택이 아닌 경우, 선택된 항목 목록에 현재 항목만 설정
        if (!this.selectedItems.includes(item)) {
          this.selectedItems = [item];
        }
      }

      this.contextMenuVisible = true;

      // DOM 업데이트 후 메뉴가 보이도록 $nextTick 사용
      this.$nextTick(() => {
        this.contextMenuVisible = true;
      });
    },

    // 우클릭 메뉴 숨기기
    hideContextMenu() {
      this.contextMenuVisible = false;
      this.selectedItem = null;
      this.selectedItemType = null;
    },

    // 이름 변경
    async renameItem() {
      if (this.selectedItemType === "folder") {
        await this.renameFolder(this.selectedItem.folderId);
      } else if (this.selectedItemType === "file") {
        await this.renameFile(this.selectedItem.fileId);
      }

      this.hideContextMenu();
    },
    // 삭제
    async deleteItem() {
      if (this.selectedItemType === 'multiple') {
        // 다중 선택된 항목을 삭제
        const confirmed = confirm("선택된 모든 항목을 삭제하시겠습니까?");
        if (!confirmed) return;

        for (const item of this.selectedItems) {
          if (item.fileId) {
            await this.deleteFile(item.fileId);
          } else if (item.folderId) {
            await this.deleteFolder(item.folderId);
          }
        }
      } else {
        // 단일 항목 삭제
        if (this.selectedItemType === 'folder') {
          await this.deleteFolder(this.selectedItem.folderId);
        } else if (this.selectedItemType === 'file') {
          await this.deleteFile(this.selectedItem.fileId);
        }
      }
      this.hideContextMenu();
      this.refreshFolderList();
    },
    // 이동
    async moveItem() {
      const newFolderId = prompt("이동할 폴더 ID를 입력하세요:");
      if (!newFolderId) return;

      if (this.selectedItemType === "folder") {
        await this.moveFolder(this.selectedItem.folderId, newFolderId);
      } else if (this.selectedItemType === "file") {
        await this.moveFile(this.selectedItem.fileId, newFolderId);
      }

      this.hideContextMenu();
    },

    // 폴더 삭제
    async deleteFolder(folderId) {
      try {
        const confirmed = confirm("정말로 이 폴더를 삭제하시겠습니까?");
        if (!confirmed) return;

        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/${folderId}`
        );
        alert("폴더가 성공적으로 삭제되었습니다.");
        this.refreshFolderList();
      } catch (error) {
        console.error("폴더 삭제 실패:", error);
        alert("폴더 삭제 중 오류가 발생했습니다.");
      }
    },

    // 폴더 이름 변경
    async renameFolder(folderId) {
      const newFolderName = prompt("새 폴더 이름을 입력하세요:");
      if (!newFolderName) {
        alert("유효한 폴더 이름을 입력하세요.");
        return;
      }

      try {
        // 백엔드의 API 경로에 맞춰서 folderId를 URL에 삽입
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/${folderId}/update/name`,
          null,
          {
            params: {
              folderName: newFolderName, // 요청 파라미터로 폴더 이름 전달
            },
          }
        );
        alert("폴더 이름이 성공적으로 변경되었습니다.");
        this.refreshFolderList(); // 목록 갱신
      } catch (error) {
        console.error("폴더 이름 변경 실패:", error);
        alert("폴더 이름 변경 중 오류가 발생했습니다.");
      }
    },
    // 폴더 탐색
    // async navigateToFolder(folderId, recordHistory = true) {
    async navigateToFolder(folderId) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/drive/folder/${folderId}`
        );
        const data = response.data.result;

        // 부모 폴더 ID 설정
        this.parentFolderId = data.parentFolderId || null; // 부모 폴더 ID가 있으면 설정

        // Breadcrumb 업데이트 및 탐색 처리
        if (folderId === this.rootFolderId) {
          this.breadcrumb = [];
        } else {
          const selectedFolder = this.folderList.find(
            (folder) => folder.folderId === folderId
          );
          const folderIndex = this.breadcrumb.findIndex((bc) => bc.folderId === folderId);
          if (folderIndex !== -1) {
            this.breadcrumb = this.breadcrumb.slice(0, folderIndex + 1);
          } else if (selectedFolder) {
            this.breadcrumb.push({
              folderId: selectedFolder.folderId,
              folderName: selectedFolder.folderName,
            });
          }
        }

        this.currentFolderId = folderId;
        this.folderList = data.folderListDto || [];
        this.fileList = data.fileListDto || [];
      } catch (error) {
        console.error("폴더 탐색 실패:", error);
        alert("폴더 탐색 중 오류가 발생했습니다.");
      }
    },
    // 파일 이름 변경
    async renameFile(fileId) {
      const newFileName = prompt("새 파일 이름을 입력하세요:");
      if (!newFileName) {
        alert("유효한 파일 이름을 입력하세요.");
        return;
      }

      try {
        // 파일 이름 변경 API 호출
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/files/${fileId}/rename`,
          { newFileName }
        );
        alert("파일 이름이 성공적으로 변경되었습니다.");
        this.refreshFolderList(); // 목록 갱신
      } catch (error) {
        console.error("파일 이름 변경 실패:", error);
        alert("파일 이름 변경 중 오류가 발생했습니다.");
      }
    },
    highlightFile(fileId) {
      // 파일 목록에서 해당 파일을 찾아 강조 표시
      this.selectedFileId = fileId;
    },
  },
  created() {
    // this.currentFolderId = this.currentFolderId || 1;
    this.loadChannelDrive();
    // URL에서 전달된 folderId로 폴더를 탐색
    this.currentFolderId = this.$props.folderId || this.rootFolderId;
    if (this.currentFolderId) {
      this.navigateToFolder(this.currentFolderId);
    }
    // URL에서 전달된 fileId로 파일 강조 표시
    const fileId = this.$props.fileId;
    if (fileId) {
      this.highlightFile(fileId);
    }
  },
  mounted() {
    // window 클릭 이벤트 추가 (컨텍스트 메뉴 밖을 클릭하면 메뉴를 숨김)
    window.addEventListener("click", this.hideContextMenu);
    window.addEventListener('click', this.clearSelection);
    const fileId = this.$route.query.fileId;
    if (fileId) {
      this.highlightFile(fileId);
    }
  },
  beforeUnmount() {
    // 컴포넌트가 파괴되기 전 window 클릭 이벤트 제거
    window.removeEventListener("click", this.hideContextMenu);
    window.removeEventListener('click', this.clearSelection);
  },
};
</script>

<style>
.drive-container {
  padding: 20px;
  overflow: auto;
}

.breadcrumb {
  margin-bottom: 20px;
}

.breadcrumb span {
  cursor: pointer;
  color: blue;
}

.breadcrumb span:hover {
  text-decoration: underline;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.select-all-checkbox {
  margin-right: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.upload-btn {
  background-color: #007bff;
  color: white;
}

.new-folder-btn {
  background-color: #f1f1f1;
  color: #333;
}

.btn:hover {
  opacity: 0.9;
}

/* 폴더 목록과 파일 목록의 스타일 */
.folder-list,
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.folder-item,
.file-item {
  width: 120px;
  text-align: center;
}

.folder-item img {
  width: 110px;
  height: 70px;
  object-fit: contain;
}

/* 파일 아이템 */
.file-item i {
  width: 120px;
  text-align: center;
  border: 1px solid transparent;
  transition: border-color 0.3s;
}

.folder-item[draggable="true"],
.file-item[draggable="true"] {
  cursor: grab;
}

.folder-item:hover,
.file-item:hover {
  border-color: lightgray;
}

.folder-item.dragging,
.file-item.dragging {
  opacity: 0.5;
}

/* 폴더 아이콘 크기 조정 */
.folder-item img {
  font-size: 40px;
  color: #007bff;
  margin-bottom: 5px;
}

/* 파일 미리보기 */
.file-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
}

.file-preview:hover {
  transform: scale(1.05);
}


iframe.file-preview {
  border: none;
}

.folder-text,
.file-text {
  display: block;
  margin-top: 5px;
  text-align: center;
  font-size: 16px;
  color: #333;
  word-break: break-word;
}

.file-icon {
  width: 100px;
  height: 90px;
  margin-bottom: 5px;
}

/* 컨텍스트 메뉴 스타일 */
.context-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.context-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.context-menu li {
  padding: 10px;
  cursor: pointer;
}

.context-menu li:hover {
  background-color: #eee;
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  position: relative;
}

.modal-preview {
  max-width: 100%;
  max-height: 100%;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.file-item.selected,
.folder-item.selected {
  border: 2px solid #007bff;
  background-color: #e6f0ff;
}
</style>

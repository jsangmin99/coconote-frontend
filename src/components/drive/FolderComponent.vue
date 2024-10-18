<template>
  <div class="drive-container">
    <!-- 현재 경로 표시 -->
    <div class="breadcrumb">
      <!-- 루트 경로로 드래그 앤 드롭 가능하게 설정 -->
      <span
        @click="navigateToFolder(rootFolderId)"
        class="breadcrumb-item"
        :class="{ active: currentFolderId === rootFolderId }"
        draggable="true"
        @dragover.prevent
        @drop="onDrop($event, rootFolderId)"
      >
        root
      </span>

      <span v-if="breadcrumb.length"> > </span>
      <span
        v-for="(folder, index) in breadcrumb"
        :key="folder.folderId"
        class="breadcrumb-item"
        draggable="true"
        @dragover.prevent
        @drop="onDrop($event, folder.folderId)"
        @click="navigateToFolder(folder.folderId)"
      >
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
      <div
        v-for="folder in folderList"
        :key="folder.folderId"
        class="folder-item"
        draggable="true"
        @dragstart="onDragStart($event, 'folder', folder.folderId)"
        @dragover.prevent
        @drop="onDrop($event, folder.folderId)"
        @click="navigateToFolder(folder.folderId)"
        @contextmenu.prevent="showContextMenu($event, 'folder', folder)"
      >
        <img
          src="@/assets/images/folder-icon.png"
          alt="folder icon"
          class="folder-icon"
        />
        <span>{{ folder.folderName }}</span>
      </div>
    </div>

    <!-- 파일 목록 -->
    <div class="file-list">
      <div
        v-for="file in fileList"
        :key="file.fileId"
        class="file-item"
        draggable="true"
        @dragstart="onDragStart($event, 'file', file.fileId)"
        @dragover.prevent
        @drop="onDrop($event, null)"
        @contextmenu.prevent="showContextMenu($event, 'file', file)"
        @click="showFullFileName(file.fileId)"
      >
        <!-- 이미지 파일일 경우 -->
        <template v-if="isImage(file.fileName)">
          <img :src="file.fileUrl" alt="Image Preview" class="file-preview" />
          <a :href="file.fileUrl" download :title="file.fileName">
            {{
              clickedFileId === file.fileId
                ? file.fileName
                : truncateFileName(file.fileName)
            }}
          </a>
        </template>

        <!-- PDF 파일일 경우 -->
        <template v-else-if="isPdf(file.fileName)">
          <iframe
            :src="file.fileUrl"
            class="file-preview"
            type="application/pdf"
          ></iframe>
          <div class="file-name">
            <a :href="file.fileUrl" download :title="file.fileName">
              {{
                clickedFileId === file.fileId
                  ? file.fileName
                  : truncateFileName(file.fileName)
              }}
            </a>
          </div>
        </template>

        <!-- SVG 파일일 경우 -->
        <template v-else-if="isSvg(file.fileName)">
          <img :src="file.fileUrl" alt="SVG Preview" class="file-preview" />
          <a :href="file.fileUrl" download :title="file.fileName">
            {{
              clickedFileId === file.fileId
                ? file.fileName
                : truncateFileName(file.fileName)
            }}
          </a>
        </template>

        <!-- 기타 파일일 경우 -->
        <template v-else>
          <i class="file-icon">📄</i>
          <a :href="file.fileUrl" download :title="file.fileName">
            {{
              clickedFileId === file.fileId
                ? file.fileName
                : truncateFileName(file.fileName)
            }}
          </a>
        </template>
      </div>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
    >
      <ul>
        <li v-if="selectedItemType === 'folder'" @click="renameItem">이름 변경</li>
        <li v-if="selectedItemType === 'file'" @click="downloadFile(selectedItem.fileId)">
          다운로드
        </li>
        <li @click="deleteItem">삭제</li>
      </ul>
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
    };
  },
  methods: {
    async loadChannelDrive() {
      const channelId = this.$route.params.channelId; // URL에서 채널 ID 추출
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/channel/${channelId}/drive`
        );
        const data = response.data.result;
        this.rootFolderId = data.nowFolderId; // 루트 폴더 설정
        this.currentFolderId = data.nowFolderId;
        this.folderList = data.folderListDto || [];
        this.fileList = data.fileListDto || [];
        this.parentFolderId = null; // 루트 폴더의 상위 폴더는 없으므로 null로 설정
        this.breadcrumb =
          data.nowFolderId === this.rootFolderId
            ? []
            : [{ folderId: this.currentFolderId, folderName: data.nowFolderName }];
      } catch (error) {
        console.error("채널 드라이브 로딩 실패:", error);
        alert("채널 드라이브 로딩 중 오류가 발생했습니다.");
      }
    },
    // 드래그 시작 시 호출
    onDragStart(event, type, id) {
      event.dataTransfer.setData("fileId", id);
      this.draggedItem = id;
      this.draggedType = type;
      // event.dataTransfer.effectAllowed = 'move';
    },

    // 드롭 시 호출
    async onDrop(event, targetFolderId) {
      if (targetFolderId === null || targetFolderId === undefined) {
        alert("유효한 폴더 ID를 입력하세요.");
        return;
      }
      // 폴더가 파일 안에 이동하지 않도록 처리
      if (this.draggedType === "folder" && !targetFolderId) {
        alert("폴더는 파일 안에 이동할 수 없습니다.");
        return;
      }

      // 자기 자신에게 드롭하지 못하도록 하기 (폴더와 파일 구분)
      if (this.draggedType === "folder" && this.draggedItem === targetFolderId) {
        alert("같은 폴더로 이동할 수 없습니다.");
        return;
      }

      if (this.draggedType === "file" && this.currentFolderId === targetFolderId) {
        alert("같은 위치로 파일을 이동할 수 없습니다.");
        return;
      }

      try {
        if (this.draggedType === "file") {
          // 파일을 targetFolderId로 이동
          await this.moveFile(this.draggedItem, targetFolderId);
          alert("파일이 성공적으로 이동되었습니다.");
        } else if (this.draggedType === "folder") {
          // 폴더를 targetFolderId로 이동
          await this.moveFolder(this.draggedItem, targetFolderId);
          alert("폴더가 성공적으로 이동되었습니다.");
        }
      } catch (error) {
        console.error(`${this.draggedType} 이동 실패:`, error);
        alert(`${this.draggedType} 이동 중 오류가 발생했습니다.`);
      }

      // 드래그 상태 초기화
      this.draggedItem = null;
      this.draggedType = null;

      // 목록 갱신
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
          fileName: this.files[index].name,
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
      event.preventDefault(); // 기본 우클릭 메뉴를 방지
      this.contextMenuVisible = false; // 기존 메뉴 숨기기
      this.contextMenuPosition = { x: event.clientX, y: event.clientY };
      this.selectedItem = item;
      this.selectedItemType = type;

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
        alert("파일 이름 변경은 현재 지원되지 않습니다.");
      }

      this.hideContextMenu();
    },
    // 삭제
    async deleteItem() {
      if (this.selectedItemType === "folder") {
        await this.deleteFolder(this.selectedItem.folderId);
      } else if (this.selectedItemType === "file") {
        await this.deleteFile(this.selectedItem.fileId);
      }

      this.hideContextMenu();
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
  },
  created() {
    // this.currentFolderId = this.currentFolderId || 1;
    this.loadChannelDrive();
  },
  mounted() {
    // window 클릭 이벤트 추가 (컨텍스트 메뉴 밖을 클릭하면 메뉴를 숨김)
    window.addEventListener("click", this.hideContextMenu);
  },
  beforeUnmount() {
    // 컴포넌트가 파괴되기 전 window 클릭 이벤트 제거
    window.removeEventListener("click", this.hideContextMenu);
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

.file-name {
  margin-top: 5px;
  /* 미리보기 이미지와 파일 이름 사이의 간격 조정 */
  text-align: center;
  /* 파일 이름을 가운데 정렬 */
}

iframe.file-preview {
  border: none;
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
</style>

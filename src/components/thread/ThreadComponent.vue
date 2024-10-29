<template>
<div class="threadWrap">

  <div v-if="!isComment" class="container">
    <!-- 필터 태그 -->
    <div class="tag-filter-container">
      <div v-for="(tag, index) in tagFilter" :key="index">
        <button @click="removeTagFilter(tag.tag, tag.threadId)"><strong class="tag"
            :style="{ backgroundColor: tag.tag.color }">{{ tag.tag.name }}</strong></button>
      </div>
    </div>
    <!-- 스레드 그룹 -->
    <div class="list-group" ref="messageList" id="list-group">
      <div v-if="isLastPage" class="enter-title">
        <h1>🥰 환영합니다!</h1>
      </div>
      <v-skeleton-loader v-if="!isLastPage" type="list-item-avatar, paragraph,list-item-avatar, paragraph,list-item-avatar, paragraph"></v-skeleton-loader>
      <div class="list-group-item" v-for="(message, index) in filteredMessages.slice().reverse()" :key="message.id">
        <div
          v-if="index === 0 || (index > 0 && this.isDifferentDay(message.createdTime, filteredMessages.slice().reverse()[index - 1].createdTime))">
          <div class="hrDayLine">
            <span class="hrDayContent">{{ this.getDay(message.createdTime) }}</span>
          </div>
        </div>
        <ThreadLineComponent :id="`thread-${message.id}`" :thread="message"
          :createdTime="this.getTime(message.createdTime)" :updateMessage="updateMessage" :deleteMessage="deleteMessage"
          :deleteFile="deleteFile" :createAndAddTag="createAndAddTag" :tagList="tagList" :addTag="addTag"
          :removeTag="removeTag" :addTagFilter="addTagFilter" :removeTagFilter="removeTagFilter" :tagFilter="tagFilter"
          :commentIn="commentIn"
          draggable="true" @dragover.prevent
          :isDifferentMember="index === 0 || message.memberId != filteredMessages.slice().reverse()[index - 1].memberId || (index > 0 && this.isDifferentDay(message.createdTime, filteredMessages.slice().reverse()[index - 1].createdTime))" />
      </div>
      <v-skeleton-loader v-if="currentBottomPage > 0" type="list-item-avatar, paragraph"></v-skeleton-loader>
    </div>

    <!-- 입력 그룹 -->
    <div class="input-group" @dragover.prevent @drop="handleDrop">
      <div class="image-group">
        <div v-for="(file, index) in fileList" :key="index" style="position: relative;">
          <button class="more-btn-file" type="button" @click="deleteImage(index)">
            <v-icon>mdi-trash-can</v-icon>
          </button>
          <img :src="file.imageUrl" @error="e => e.target.src = require('@/assets/images/file.png')"
            style="height: 120px; width: 120px; object-fit: cover; border-radius:5px;">
          <p class="custom-contents">{{ file.name }}</p>
        </div>
      </div>

      <div class="text-group">
        <v-file-input v-model="files" @change="fileUpdate" multiple hide-input></v-file-input>
        <textarea rows="1" type="text" class="form-control" v-model="message" @input="adjustHeight()" v-on:keypress.enter="sendMessage"
          @keydown="handleKeydown" ref="textarea"/>
        <div class="input-group-append">
          <button class="send-btn" type="button" @click="sendMessage"
            :disabled="!message && fileList && fileList.length === 0">
            <img :src="require('@/assets/images/send_icon.png')" alt="보내기" style="height: 20px; width: 20px;">
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 댓글 부분 -->
  <div v-if="isComment" class="container">
    <div class="comment-group" id="comment-group">
      <div class="thread-title">
        <button @click="commentOut">
          <img :src="require('@/assets/images/left-icon.png')" alt="back" style="height: 30px; width: 30px; margin-top: 2px;">
        </button>
        <h2>스레드</h2>
      </div>
      <ThreadLineComponent :thread="parentThread" :createdTime="this.getTime(parentThread.createdTime)"
        :updateMessage="updateMessage" :deleteMessage="deleteMessage" :deleteFile="deleteFile"
        :createAndAddTag="createAndAddTag" :tagList="tagList" :addTag="addTag" :removeTag="removeTag"
        :addTagFilter="addTagFilter" :removeTagFilter="removeTagFilter" :tagFilter="tagFilter" :isComment="isComment"
        :isDifferentMember="true" />
      <h5 class="comentLines">{{ parentThread.childThreads && parentThread.childThreads.length > 0 ? `밑으로
        ${parentThread.childThreads.length}개의 댓글` : '밑으로 댓글' }}</h5>

      <div v-for="(message, index) in parentThread.childThreads" :key="index">
        <ThreadLineComponent :thread="message" :createdTime="this.getTime(message.createdTime)"
          :updateMessage="updateMessage" :deleteMessage="deleteMessage" :deleteFile="deleteFile"
          :createAndAddTag="createAndAddTag" :tagList="tagList" :addTag="addTag" :removeTag="removeTag"
          :addTagFilter="addTagFilter" :removeTagFilter="removeTagFilter" :tagFilter="tagFilter" :isComment="isComment"
          :isDifferentMember="index === 0 || message.memberId != parentThread.childThreads[index - 1].memberId" 
          :class="{
            dragging: draggingId === message.id,
          }"
          draggable="true"
          @dragstart="tcdShareDragStart($event, 'thread', message)"
          @dragend="handleDragEnd"
          />
      </div>
    </div>
    <!-- 입력 그룹 -->
    <div class="input-group" @dragover.prevent @drop="handleDrop">
      <div class="image-group">
        <div v-for="(file, index) in fileList" :key="index" style="position: relative;">
          <button class="more-btn-file" type="button" @click="deleteImage(index)"><v-icon color="error">mdi-trash-can</v-icon></button>
          <img :src="file.imageUrl" @error="e => e.target.src = require('@/assets/images/file.png')"
            style="height: 120px; width: 120px; object-fit: cover; border-radius:5px;">
          <p class="custom-contents">{{ file.name }}</p>
        </div>
      </div>

      <div class="text-group">
        <v-file-input v-model="files" @change="fileUpdate" multiple hide-input></v-file-input>
        <textarea rows="1" type="text" class="form-control" v-model="message" @input="adjustHeight()" v-on:keypress.enter="sendMessage"
          @keydown="handleKeydown" ref="textarea"/>
        <div class="input-group-append">
          <button class="send-btn" type="button" @click="sendMessage"
            :disabled="!message && fileList && fileList.length === 0">
            <img :src="require('@/assets/images/send_icon.png')" alt="보내기" style="height: 20px; width: 20px;">
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- drag drop 되는 부분 표시용 -->
  <div
      class="tcd-drop-area"
      v-if="tcdDroppedData"
      @dragover.prevent
      @drop="handleDrop"
    >
    이 곳에 data를 drop 하세요
  </div>
</div>
</template>

<script>
import ThreadLineComponent from "@/components/thread/ThreadLineComponent.vue";
import axios from '@/services/axios'
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { debounce } from "lodash";
import { mapGetters, mapActions } from 'vuex';

export default {
  props: ['id', 'threadId', 'parentThreadId'],
  components: {
    ThreadLineComponent,
  },
  data() {
    return {
      workspaceId: null,
      roomId: "",
      room: { name: "sehotest" },
      sender: 1,
      message: "",
      messages: [],
      ws: null,
      sock: null,
      reconnect: 0,
      pageSize: 50,
      currentPage: 0,
      currentTopPage: 0,
      currentBottomPage: 0,
      isLoading: false,
      isLastPage: false,
      files: null,
      fileList: [],
      // uploadProgress: [], // 업로드 진행 상황
      filesRes: [],
      tagList: [],
      tagFilter: [],
      tagFilterOneToZero: false,
      isComment: false,
      parentThread: null,
      dragedFile: null,
      isCreated: false,

      // drag 용
      tcdDroppedData: null,
      draggingId: null,
    };
  },
  watch: {
    getAllTcdState: {
      handler(newVal) {
        console.error("tcd 값 감지. thread >>>> ", newVal);
        if(newVal.isDragStatus){
          this.tcdDroppedData = newVal; // 드래그 데이터 저장
        }else{
          this.tcdDroppedData = null;
        }
        
      },
      deep: true,
    }
  },
  async created() {
    this.roomId = this.id;
    this.workspaceId = this.$store.getters.getWorkspaceId;
    if (this.threadId && this.threadId !== "null") {
      if (this.parentThreadId && this.parentThreadId !== "null") {
        this.getThreadPage(this.parentThreadId);
      }
      
      else this.getThreadPage(this.threadId);
    } else {
      await this.getTopMessageList();
      this.scrollToBottom();
    }
    this.getTagList();
    this.connect();
  },
  mounted() {
    this.$refs.messageList.addEventListener("scroll", this.debouncedScrollPagination);
  },
  updated() { },
  beforeUnmount() {
    console.log("언마운트@@@@@@");
    
    if (this.$refs.messageList)
      this.$refs.messageList.removeEventListener("scroll", this.debouncedScrollPagination);

    if (this.subscription) {
      this.subscription.unsubscribe(); // 구독 해제
      console.log("WebSocket subscription unsubscribed.");
    }
    if (this.ws) {
      this.ws.disconnect(() => {
        console.log("WebSocket connection closed.");
      });
    }

  },
  computed: {
    ...mapGetters(['getWorkspaceId', 'getWorkspaceName',
      // tcd용
      "getAllTcdState",
    ]),
    filteredMessages() {
      if (this.tagFilter.length === 0) {
        return this.messages; // 필터가 없으면 전체 메시지를 반환
      }
      return this.messages.filter(message => {
        if (!message.tags) return false; // 태그가 없는 경우 제외

        // 메시지의 태그가 tagFilter의 모든 태그를 포함하는지 확인
        return this.tagFilter.every(filter =>
          message.tags.some(tag => filter.tag.id === tag.id)
        );
      });
    },
  },

  methods: {
    ...mapActions([
      "setTcdStateAllDataActions",
    ]),
    moveToThread(threadId) {
      // threadId가 제공된 경우에만 실행
      console.log("@@@threadId: ",threadId);
      
      if (threadId) {
        console.log("threadId 찾음: ", threadId);
        // 스레드 요소를 찾기
        const threadElement = document.getElementById(`thread-${threadId}`);
        if (threadElement) {
          console.log("threadElement 찾음");
          threadElement.setAttribute("tabindex", -1);
          threadElement.focus();
          threadElement.removeAttribute("tabindex");

          // 해당 요소로 스크롤
          // threadElement.scrollIntoView({ behavior: 'auto', block: 'center' });

          // 강조 클래스 추가
          threadElement.classList.add('highlight');

          // 일정 시간 후 강조 제거
          setTimeout(() => {
            threadElement.classList.add('fade-out'); // fade-out 클래스를 추가
            setTimeout(() => {
              threadElement.classList.remove('highlight');
              threadElement.classList.remove('fade-out'); // fade-out 클래스도 제거
            }, 500); // 투명 효과가 완료된 후 highlight 클래스를 제거 (500ms)
          }, 2000); // 2000ms 후에 fade-out 추가
        } else {
          console.error('스레드 요소를 찾을 수 없습니다:', threadId);
        }
      }
    },
    commentIn(thread) {
      console.error("comment In Thread >>>>>>", thread)
      this.isComment = !this.isComment
      this.parentThread = thread
    },
    commentOut() {
      console.log("(this.parentThread.id: ", this.parentThread.id);
      this.isComment = !this.isComment
      this.$nextTick(() => {
        this.moveToThread(this.parentThread.id);
        this.parentThread = null
        this.$refs.messageList.addEventListener("scroll", this.debouncedScrollPagination);
      });
    },
    addTagFilter(tag, threadId) {
      this.tagFilter.push({ tag, threadId })
    },
    removeTagFilter(tag, threadId) {
      // if(this.tagFilter.length === 1) this.tagFilterOneToZero = true
      this.tagFilter = this.tagFilter.filter(tagFilter => tagFilter.tag.id !== tag.id);
      this.moveToThread(threadId);
      // if(this.tagFilterOneToZero) {
      //   this.scrollToBottom();
      //   this.tagFilterOneToZero = false
      // }
    },
    async getTagList() {
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/tag/list/${this.id}`);
      this.tagList = response.data.result
    },
    recvMessage(recv) {
      if (recv.type === "UPDATE") {
        // UPDATE일 경우, 해당 id의 메시지를 찾아 content를 업데이트
        let messageToUpdate;

        if (recv.parentThreadId) {
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        } else {
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if (messageToUpdate) {
          // 메시지가 존재할 경우 content 업데이트
          messageToUpdate.content = recv.content;
        }
      } else if (recv.type === "ADD_TAG" || recv.type === "CREATE_AND_ADD_TAG") {

        let messageToUpdate;

        if (recv.parentThreadId) {
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        } else {
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if (messageToUpdate) {
          if (!messageToUpdate.tags || messageToUpdate.tags.length === 0) {
            messageToUpdate.tags = [{ id: recv.tagId, name: recv.tagName, color: recv.tagColor, threadTagId: recv.threadTagId }]
          } else {
            messageToUpdate.tags.push({ id: recv.tagId, name: recv.tagName, color: recv.tagColor, threadTagId: recv.threadTagId });
          }
        }
        // 태그를 만들면 바로 태그리스트에 넣어주려 했는데 그럴러면 type을 하나더 추가해서 분기해줘야 될듯 나중에 시간나면 할예정
        if (recv.type === "CREATE_AND_ADD_TAG") {

          this.tagList.push({ id: recv.tagId, name: recv.tagName, color: recv.tagColor, threadTagId: recv.threadTagId });
        }

      } else if (recv.type === "REMOVE_TAG") {
        let messageToUpdate;

        if (recv.parentThreadId) {
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        } else {
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if (messageToUpdate) {
          messageToUpdate.tags = messageToUpdate.tags.filter(tag => tag.id !== recv.tagId);
        }
      } else if (recv.type === "DELETE") {
        // DELETE일 경우, messages에서 해당 id의 메시지를 제거
        console.log("recv.parentThreadId: ", recv.parentThreadId);

        if (recv.parentThreadId) {
          console.log("부모 있");

          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          parent.childThreads = parent.childThreads.filter(message => message.id !== recv.id);
        } else {
          console.log("부모 없");
          this.messages = this.messages.filter(message => message.id !== recv.id);
        }
      } else if (recv.type === "DELETE_FILE") {
        // DELETE_File일 경우, messages.files에서 해당 id의 파일을 제거
        let messageToUpdate;

        if (recv.parentThreadId) {
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        } else {
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if (messageToUpdate) {
          messageToUpdate.files = messageToUpdate.files.filter(file => file.fileId !== recv.fileId);
        }
      }
      else {
        // 새로운 메시지일 경우 기존 로직
        if (recv.parentThreadId) {
          console.log("부모id 받아옴");

          const messageToUpdate = this.messages.find(message => message.id === recv.parentThreadId);

          if (messageToUpdate) {
            if (!messageToUpdate.childThreads || messageToUpdate.childThreads.length === 0) {
              console.log("first");

              messageToUpdate.childThreads = [recv]
            } else {
              console.log("이미 자식 존재");

              messageToUpdate.childThreads.push(recv);
            }
          }
        } else {
          this.messages.unshift({
            id: recv.id,
            memberName: recv.memberName,
            content: recv.content,
            image: recv.image,
            createdTime: recv.createdTime,
            files: recv.files,
            memberId: recv.memberId,
          });
        }

        this.scrollToBottom();
      }
    },
    createAndAddTag(id, tagName, tagColor) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "ADD_TAG",
          channelId: this.roomId,
          threadId: id,
          tagName: tagName,
          tagColor: tagColor,
        })
      );
    },
    addTag(id, tagId) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "ADD_TAG",
          channelId: this.roomId,
          threadId: id,
          tagId: tagId,
        })
      );
    },
    removeTag(id, tagId, threadTagId) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "REMOVE_TAG",
          channelId: this.roomId,
          threadId: id,
          tagId: tagId,
          threadTagId: threadTagId,
        })
      );
    },
    updateMessage(id, message) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "UPDATE",
          channelId: this.roomId,
          threadId: id,
          content: message,
        })
      );
    },
    deleteMessage(id) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "DELETE",
          channelId: this.roomId,
          threadId: id,
        })
      );
    },
    deleteFile(id, fileId) {
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "DELETE_FILE",
          channelId: this.roomId,
          threadId: id,
          fileId: fileId,
        })
      );
    },
    async sendMessage() {
      if(!this.ws) return
      // 메시지가 비어있거나 공백 문자만 포함된 경우
      if (!this.message.trim() && this.fileList.length === 0) {
        return; // 함수 종료
      }
      const authToken = localStorage.getItem('accessToken');

      if (this.fileList.length > 0) {
        const dragFileList = this.fileList.filter(file => file.fileId)
        this.filesRes = dragFileList.map(file => ({ id: file.fileId, fileName: file.name, fileUrl: file.imageUrl }))

        const fileList = this.fileList.filter(file => !file.fileId)
        if (fileList && fileList.length > 0)
          try {
            const presignedUrls = await this.getPresignedURL();

            // 각 파일에 대해 Presigned URL을 이용하여 S3에 업로드
            const uploadedFileUrls = await Promise.all(fileList.map(file => this.uploadFileToS3(file.file, presignedUrls[file.name])));

            // 파일 중 업로드가 실패한 파일이 있으면 필터링
            const successfulUploads = uploadedFileUrls.filter(url => url !== null);


            // 성공적으로 업로드된 파일만 메타데이터 저장
            if (successfulUploads.length) {
              await this.saveFileMetadata(successfulUploads);
            } else {
              alert('모든 파일 업로드에 실패했습니다.');
            }
          } catch (error) {
            console.error('Upload failed:', error);
            alert('파일 업로드 중 오류가 발생했습니다.');
          }
      }

      this.ws.send(
        "/pub/chat/message",
        { Authorization: authToken },
        JSON.stringify({
          type: "TALK",
          channelId: this.roomId,
          senderId: this.sender,
          parentId: (this.parentThread ? this.parentThread.id : null),
          content: this.message,
          workspaceId: this.workspaceId,
          files: this.filesRes?.map(file => ({ fileId: file.id, fileName: file.fileName, fileURL: file.fileUrl }))
        })
      );

      const textarea = this.$refs.textarea;
      textarea.style.height = 'auto'; 

      this.files = null;
      this.message = "";
      this.fileList = [];
      this.uploadProgress = [];
      this.filesRes = null;
    },
    async getPresignedURL() {
      const reqFiles = this.fileList.map(file => ({ fileName: file.name, fileSize: file.size }))
      const response = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/files/presigned-urls`, reqFiles
      );
      return response.data.result;
    },
    async uploadFileToS3(file, presignedUrl) {

      try {
        const config = {
          headers: {
            'Content-Type': file.type, // 파일 타입 지정
          },
          // onUploadProgress: (progressEvent) => {
          //   const index = this.files.indexOf(file); // 인덱스 찾기
          //   this.uploadProgress[index] = Math.round((progressEvent.loaded * 100) / progressEvent.total); // 업로드 진행상황 업데이트
          // },
        };

        await axios.put(presignedUrl, file, config)

        // S3에 업로드된 파일의 URL에서 ? 앞부분만 반환 (쿼리 파라미터 제거)
        return this.extractS3Url(presignedUrl);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return null; // 업로드 실패 시 null 반환
      }
    },
    // Presigned URL에서 ? 이전의 S3 URL만 남김
    extractS3Url(presignedUrl) {
      return presignedUrl.split('?')[0]; // ? 기준으로 앞부분만 추출
    },
    async saveFileMetadata(uploadedFileUrls) {
      const metadataDto = {
        channelId: this.id, // 적절한 채널 ID로 수정하세요
        fileType: 'THREAD', // 백엔드에서 필요한 Enum 값 (FileType.THREAD, FileType.CANVAS 등)
        fileSaveListDto: uploadedFileUrls.map((url, index) => ({
          fileName: this.fileList[index].name, // 원본 파일 이름
          fileUrl: url, // 짧아진 S3 URL
        })), // 파일 메타데이터 리스트
      };
      const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/files/metadata`, metadataDto);
      this.filesRes = [...this.filesRes, ...response.data.result];
    },

    fileUpdate() {
      this.files.forEach(file => {
        this.fileList.push({
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          imageUrl: URL.createObjectURL(file)
        })
      });
      this.files = null;
    },
    async handleDrop(event) {
      event.preventDefault();
      console.error("@@@@@@@ handleDrop",event)
      const droppedData = event.dataTransfer.getData("items");

      // 드롭된 데이터 로그 출력
      console.log("드롭된 데이터(raw):", droppedData);

      // 드롭된 데이터가 유효한지 확인합니다.
      if (droppedData && droppedData.trim() !== "") {
        try {
          const parsedData = JSON.parse(droppedData);
          console.log("드롭된 데이터(parsed)222222222222:", parsedData);

          if (Array.isArray(parsedData) && parsedData.length > 0) {
            this.dragedFile = parsedData[0]; // 배열의 첫 번째 항목 사용
            
            if (this.dragedFile.type === "drive") {
              if(this.dragedFile.driveType =="file"){
                console.log("드롭된 파일 ID:", this.dragedFile.fileId);
                // 파일 업로드나 추가 작업을 수행할 로직 작성
                parsedData.map(dragedFile =>this.fileList.push({
                  fileId: dragedFile.fileId,
                  name: dragedFile.fileName,
                  imageUrl: dragedFile.fileUrl
                }));
              }else{
                alert("드라이브에서는 [파일]만 drop할 수 있습니다.")
              }
            }
          } else if(parsedData?.type === "canvas"){
            console.error("캔버스 파일 드롭");
          } else if(parsedData?.type === "thread"){
            alert("쓰레드 끼리는 drop 할 수 없습니다.")
          } else {
            alert("옳지 않은 drop 방식 입니다.");
          }
        } catch (error) {
          console.error("JSON 파싱 오류:", error);
        }
      } else {
        console.log("드롭된 데이터가 없습니다.");
      }

      this.tcdDroppedData = null;
    },


    async getTopMessageList() {
      try {
        let params = {
          size: this.pageSize,
          page: this.currentTopPage,
        };

        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/thread/list/${this.id}`,
          { params }
        );
        console.log("pageNumber: ", response.data.result);
        console.log("pageNumber: ", response.data.result.pageable.pageNumber);

        this.currentTopPage++;
        this.isLastPage = response.data.result.last;

        // 기존 메시지의 ID 집합을 생성
        const existingMessageIds = new Set(this.messages.map((msg) => msg.id));

        // 중복되지 않은 메시지만 필터링
        const newMessages = response.data.result.content.filter(
          (msg) => !existingMessageIds.has(msg.id)
        );

        // 중복되지 않은 메시지를 추가
        this.messages = [...this.messages, ...newMessages];
        console.log("시작 메시지 추가됨");

      } catch (e) {
        console.log(e);
      }
    },
    async getBottomMessageList() {
      if (this.currentBottomPage > 0) this.currentBottomPage--;
      else {
        console.log("이미 마지막 페이지 입니다");
        return
      }
      try {
        let params = {
          size: this.pageSize,
          page: this.currentBottomPage,
        };
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/thread/list/${this.id}`,
          { params }
        );
        this.isLastPage = response.data.result.last;

        // 기존 메시지의 ID 집합을 생성
        const existingMessageIds = new Set(this.messages.map((msg) => msg.id));

        // 중복되지 않은 메시지만 필터링
        const newMessages = response.data.result.content.filter(
          (msg) => !existingMessageIds.has(msg.id)
        );

        // 중복되지 않은 메시지를 추가
        this.messages = [...newMessages, ...this.messages];
        console.log("시작 메시지 추가됨");

      } catch (e) {
        console.log(e);
      }
    },
    async getThreadPage(threadId) {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/thread/list`,
          { channelId: this.id, threadId, pageSize: this.pageSize }
        );
        this.currentTopPage = response.data.result.pageable.pageNumber + 1
        if (response.data.result.pageable.pageNumber > 0) this.currentBottomPage = response.data.result.pageable.pageNumber
        this.isLastPage = response.data.result.last;
        // this.messages = [...this.messages, ...response.data.result.content]

        // 기존 메시지의 ID 집합을 생성
        const existingMessageIds = new Set(this.messages.map((msg) => msg.id));

        // 중복되지 않은 메시지만 필터링
        const newMessages = response.data.result.content.filter(
          (msg) => !existingMessageIds.has(msg.id)
        );

        // 중복되지 않은 메시지를 추가
        this.messages = [...this.messages, ...newMessages];
      } catch (e) {
        console.log(e);
      }
      this.$nextTick(() => {
        this.moveToThread(threadId);
      });
    },
    debouncedScrollPagination: debounce(async function () {
      console.log("스크롤 이벤트 온");
      
      const list = document.getElementById("list-group");
      if (!list) { // debounce로 인해 다른 컴포넌트에서 늦게 실행되는 오류
        return false;
      }
      const isTop = list.scrollTop <= 800;
      const isBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 800;

      if (isTop && !this.isLastPage && !this.isLoading) {

        if (this.messages && this.messages.length > 0) {
          this.isLoading = true;
          let topThreadId
          console.log("messages: ", this.messages[this.messages.length - 1].id);
          topThreadId = this.messages[this.messages.length - 1].id

          await this.getTopMessageList();

          this.isLoading = false;
          this.moveToThread(topThreadId);
        }
      }

      if (isBottom && this.currentBottomPage > 0 && !this.isLoading) {
        this.isLoading = true;
        await this.getBottomMessageList();
        this.isLoading = false;
      }
    }, 200),
    scrollToBottom() {
      console.log("밑으로");

      this.$nextTick(() => {
        const container = document.getElementById("list-group");
        const container2 = document.getElementById("comment-group");

        if (container) {
          container.scrollTop = container.scrollHeight; 
          console.log("밑으로111");
        }
        if (container2) {
          container2.scrollTop = container2.scrollHeight; 
          console.log("밑으로222");
        }
      });
    },

    deleteImage(index) {
      this.fileList.splice(index, 1);
    },
    handleKeydown(event) {
      if (event.isComposing) return;

      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Shift + Enter일 경우 개행 추가
          const textarea = this.$refs.textarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;

          // 개행 문자를 현재 커서 위치에 삽입
          this.message = this.message.substring(0, start) + '\n' + this.message.substring(end);
          
          // 커서 위치를 개행 뒤로 이동
          this.$nextTick(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            textarea.focus();
          });

          event.preventDefault(); // 기본 동작 방지
        } else {
          // Enter만 누를 경우 메시지 전송
          this.sendMessage();
          event.preventDefault(); // 기본 동작 방지
        }
      }
    },
    connect() {
      this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
      this.ws = Stomp.over(this.sock);

      const authToken = localStorage.getItem('accessToken');
      this.ws.connect(
        { Authorization: authToken },
        (frame) => {
          console.log("frame: ", frame);
          this.ws.subscribe(`/sub/chat/room/${this.roomId}`, (message) => {
            const recv = JSON.parse(message.body);
            this.recvMessage(recv);
          });
        },
        (error) => {
          console.log(error);
          if (this.reconnect++ <= 5) {
            setTimeout(() => {
              console.log("connection reconnect");
              this.sock = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/ws-stomp`);
              this.ws = Stomp.over(this.sock);
              this.connect();
            }, 10 * 1000);
          }
        }
      );
    },
    getTime(createdAt) {
      const createdTime = new Date(createdAt);
      let hour = createdTime.getHours();
      let minute = createdTime.getMinutes();
      let ampm;
      if (hour < 12) {
        ampm = '오전'
      } else {
        ampm = '오후'
        hour -= 12;
      }
      if (hour < 10) {
        hour = '0' + hour;
      }

      if (minute < 10) {
        minute = '0' + minute;
      }

      return ampm + ' ' + hour + ':' + minute;
    },
    isDifferentDay(d1, d2) {
      const day1 = new Date(d1);
      const day2 = new Date(d2);


      if (day1.getFullYear() == day2.getFullYear()
        && day1.getMonth() == day2.getMonth()
        && day1.getDay() == day2.getDay()) return false;

      return true;
    },
    getDay(createdAt) {
      const createdTime = new Date(createdAt);

      return `${createdTime.getFullYear()}년 ${createdTime.getMonth() + 1}월 ${createdTime.getDate()}일`;
    },
    adjustHeight() {
      const textarea = this.$refs.textarea;
      setTimeout(() => {
        textarea.style.height = 'auto'; // 이전 높이를 초기화
        textarea.style.height = `${textarea.scrollHeight}px`; // 내용에 맞게 높이 조정
      }, 0);

        // max-height에 따라 스크롤바 보이기
      if (textarea.scrollHeight > parseInt(getComputedStyle(textarea).maxHeight)) {
        textarea.style.overflowY = 'auto'; // 스크롤바 보이기
      } else {
        textarea.style.overflowY = 'hidden'; // 스크롤바 숨기기
      }
    },

    
      // drag drop 용도
      tcdShareDragStart(event, type, item) {
        console.error("thread drag 시작", event, type, item);
        this.draggingId = item.id; // 드래그 시작 시 아이템 ID 저장
        event.dataTransfer.effectAllowed = "move";

        let tcdSharedData = item;
        if (tcdSharedData != null) {
          tcdSharedData.type = "thread";
          console.error(tcdSharedData);

          const dataToTransfer = JSON.stringify(tcdSharedData);
          event.dataTransfer.setData("items", dataToTransfer);
          // this.draggedType = type;

          // 드래그 시작 시 전송할 데이터 로그 출력
          console.error("드래그 시작 - 전송할 데이터 thread:", dataToTransfer);
          const setInfoObj = {
            isDragStatus: true,
            dragStartPage: "thread",
            result: dataToTransfer,
          }
          this.$store.dispatch("setTcdStateAllDataActions", setInfoObj);
        }
      },
      handleDragEnd() {
        this.draggingId = null;

        const setInfoObj = {
          isDragStatus: false,
          dragStartPage: "thread",
        }
        this.$store.dispatch("setTcdStateAllDataActions", setInfoObj);
      },
  },
};
</script>

<style scoped>
.enter-title{
  margin-top: 40px;
}
.container {
  padding: 0 0 0 24px;
  height: 100vh;
}

.list-group {
  overflow-y: auto;
  /* 세로 스크롤 가능 */
  height: 100%;
  max-height: calc(100vh - 230px);
}

.list-group-item {
  gap: 10px;
  padding: 3px 0;
}

.input-group {
  position: fixed;
  bottom: 0;
  /* 하단에 고정 */
  background-color: white;
  /* 배경색 설정 */
  border: 1px solid;
  border-radius: 5px;
  margin-right: 24px;
  margin-bottom: 10px;
  max-height: 70vh;
  overflow-y: auto;
  width: 80%;
  z-index: 5;
}

.image-group {
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
}

.custom-contents {
  max-width: 120px;
  /* 제목의 최대 너비를 설정 */
  overflow: hidden;
  /* 내용이 넘칠 경우 숨김 처리 */
  text-overflow: ellipsis !important;
  /* 넘치는 텍스트에 '...' 추가*/
  white-space: nowrap;
  /* 텍스트 줄 바꿈 방지 */
}

.text-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 5px 3px;
}

.form-control {
  resize: none;
  width: 100%;
  max-height: 40vh;
  overflow-y: auto;
  margin-left: 5px;
}

.tag-filter-container {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.tag {
  border-radius: 5px;
  padding: 0 5px 1px 5px;
  color: white;
  font-size: 11px;
}

.thread-title {
  display: flex;
  flex-direction: row;
}

.comment-group {
  overflow-y: auto;
  height: 100%;
  max-height: calc(100vh - 230px);
}

input:focus {
  outline: none;
}

textarea:focus {
  outline: none;
}

.highlight {
  background-color: #e8ca93;
  /* 강조할 배경 색 */
  transition: background-color 0.5s ease;
  /* 부드러운 전환 효과 */
}

.fade-out {
  background-color: transparent;
  /* 투명 상태 */
}
.input-group-append{
  display: flex;
}
.send-btn{
  width: 20px;
  height: 20px;
}
.more-btn-file{
  background: #f8f8f8;
  position: absolute;
  top: 5px;
  right: 5px; /* 버튼의 절반이 thread에 걸쳐 보이도록 설정 */
  z-index: 2;
  border-radius: 5px;
}
.more-btn-file:hover {
  background: red;
  
}

</style>
<!-- <style lang="scss">
@import "@/assets/css/thread.scss";
</style> -->
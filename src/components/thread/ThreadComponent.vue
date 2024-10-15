<template>
  <div v-if="!isComment" class="container">
    <!-- 필터 태그 -->
    <div class="tag-filter-container">
      <div v-for="(tag,index) in tagFilter" :key="index" >
        <button @click="removeTagFilter(tag)"><strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong></button>
      </div>
    </div>
    <!-- 스레드 그룹 -->
    <div class="list-group" ref="messageList" id="list-group">
      <div
        class="list-group-item"
        v-for="(message,index) in filteredMessages.slice().reverse()"
        :key="message.id"
      >
        <div v-if="index === 0 || (index > 0 && this.isDifferentDay(message.createdTime,  filteredMessages.slice().reverse()[index-1].createdTime))">
          <div style="display: flex; align-content: center; text-align: center; margin: auto;">
              <hr style="width: 27%; margin:auto;"><span style="margin:auto;">{{this.getDay(message.createdTime)}}</span><hr style="width: 27%; margin:auto;">
          </div>
        </div>
        <ThreadLineComponent
          :thread="message"
          :createdTime="this.getTime(message.createdTime)"
          :updateMessage="updateMessage"
          :deleteMessage="deleteMessage"
          :deleteFile="deleteFile"
          :createAndAddTag="createAndAddTag"
          :tagList="tagList"
          :addTag="addTag"
          :removeTag="removeTag"
          :addTagFilter="addTagFilter"
          :removeTagFilter="removeTagFilter"
          :tagFilter="tagFilter"
          :commentIn="commentIn"
          :isDifferentMember="index === 0 || message.memberId != filteredMessages.slice().reverse()[index-1].memberId"
        />
      </div>
    </div>
    
    <!-- 입력 그룹 -->
    <div class="input-group">
      <div class="image-group">
        <div v-for="(file, index) in fileList" :key="index">
          <button type="button" @click="deleteImage(index)">삭제</button>
          <img :src="file.imageUrl" @error="e => e.target.src = require('@/assets/file.png')"  style="height: 120px; width: 120px; object-fit: cover;">
          <p class="custom-contents">{{file.name}}</p>
        </div>
      </div>
        
      <div class="text-group">
        <v-file-input v-model="files" @change="fileUpdate" multiple hide-input></v-file-input>
        <textarea
          type="text"
          class="form-control"
          v-model="message"
          v-on:keypress.enter="sendMessage"
          @keydown="handleKeydown"
        />
        <div class="input-group-append">
          <button class="btn btn-primary" type="button" @click="sendMessage" :disabled="!message && fileList.length === 0">보내기</button>
        </div>
      </div>
    </div>
  </div>
  <!-- 댓글 부분 -->
  <div v-if="isComment" class="container">
    <div class="thread-title">
      <button @click="commentOut">back</button>
      <h2>스레드</h2>
    </div>
    <div class="comment-group">
      <ThreadLineComponent
        :thread="parentThread"
        :createdTime="this.getTime(parentThread.createdTime)"
        :updateMessage="updateMessage"
        :deleteMessage="deleteMessage"
        :deleteFile="deleteFile"
        :createAndAddTag="createAndAddTag"
        :tagList="tagList"
        :addTag="addTag"
        :removeTag="removeTag"
        :addTagFilter="addTagFilter"
        :removeTagFilter="removeTagFilter"
        :tagFilter="tagFilter"
      />
      <h5>{{ parentThread.childThreads && parentThread.childThreads.length > 0 ? `밑으로 ${parentThread.childThreads.length}개의 댓글` : '밑으로 댓글' }}</h5>
      
      <div v-for="(message,index) in parentThread.childThreads" :key="index">
        <ThreadLineComponent
          :thread="message"
          :createdTime="this.getTime(message.createdTime)"
          :updateMessage="updateMessage"
          :deleteMessage="deleteMessage"
          :deleteFile="deleteFile"
          :createAndAddTag="createAndAddTag"
          :tagList="tagList"
          :addTag="addTag"
          :removeTag="removeTag"
          :addTagFilter="addTagFilter"
          :removeTagFilter="removeTagFilter"
          :tagFilter="tagFilter"
        />
      </div>
    </div>
    <!-- 입력 그룹 -->
    <div class="input-group">
      <!-- 파일 올리기 -->
      <div class="image-group">
        <div v-for="(file, index) in fileList" :key="index">
          <button type="button" @click="deleteImage(index)">삭제</button>
          <img :src="file.imageUrl" @error="e => e.target.src = require('@/assets/file.png')"  style="height: 120px; width: 120px; object-fit: cover;">
          <p class="custom-contents">{{file.name}}</p>
        </div>
      </div>
        <!-- 내용 작성란 -->
      <div class="text-group">
        <v-file-input v-model="files" @change="fileUpdate" multiple hide-input></v-file-input>
        <textarea
          type="text"
          class="form-control"
          v-model="message"
          v-on:keypress.enter="sendMessage"
          @keydown="handleKeydown"
        />
        <div class="input-group-append">
          <button class="btn btn-primary" type="button" @click="sendMessage" :disabled="!message && fileList.length === 0">보내기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ThreadLineComponent from "@/components/thread/ThreadLineComponent.vue";
// import axios from "axios";
import axios from '@/services/axios'
import SockJS from "sockjs-client";
// import Stomp from "stompjs";
import { Stomp } from "@stomp/stompjs";
import { debounce } from "lodash";
import { mapGetters } from 'vuex';

export default {
  props: {
    id: {
      type: String,
      required: true,
    },
  },
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
      pageSize: 40,
      currentPage: 0,
      isLoading: false,
      isLastPage: false,
      files: null,
      fileList: [],
      // uploadProgress: [], // 업로드 진행 상황
      filesRes: null,
      tagList: [],
      tagFilter: [],
      tagFilterOneToZero: false,
      isComment: false,
      parentThread: null,
    };
  },
  created() {
    this.roomId = this.id;
    this.workspaceId = this.$store.getters.getWorkspaceId;
    this.getMessageList();
    this.getTagList();
    this.connect();
    // window.addEventListener('scroll', this.scrollPagination)
    // this.$refs.messageList.addEventListener('scroll', this.scrollPagination);
  },
  mounted() {
    this.$refs.messageList.addEventListener("scroll", this.debouncedScrollPagination);
  },
  updated() {},
  beforeUnmount() {
    // window.removeEventListener('scroll', this.scrollPagination)
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
    ...mapGetters(['getWorkspaceId', 'getWorkspaceName']),
    filteredMessages() {
      if (this.tagFilter.length === 0) {
        return this.messages; // 필터가 없으면 전체 메시지를 반환
      }
      return this.messages.filter(message => {
        if (!message.tags) return false; // 태그가 없는 경우 제외

        // 메시지의 태그가 tagFilter의 모든 태그를 포함하는지 확인
        return this.tagFilter.every(filter => 
          message.tags.some(tag => filter.id === tag.id)
        );
      });
    },
  },

  methods: {
    commentIn(thread){
      this.isComment = !this.isComment
      this.parentThread = thread
    },
    commentOut(){
      this.isComment = !this.isComment
      this.parentThread = null
      this.scrollToBottom();
    },
    addTagFilter(tag){
      this.tagFilter.push(tag)
    },
    removeTagFilter(tag){
      if(this.tagFilter.length === 1) this.tagFilterOneToZero = true
      this.tagFilter = this.tagFilter.filter(tagFilter => tagFilter.id !== tag.id);
      if(this.tagFilterOneToZero) {
        this.scrollToBottom();
        this.tagFilterOneToZero = false
      }
    },
    async getTagList(){
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/tag/list/${this.id}`);
      this.tagList = response.data.result
    },
    recvMessage(recv) {
      if (recv.type === "UPDATE") {
        // UPDATE일 경우, 해당 id의 메시지를 찾아 content를 업데이트
        let messageToUpdate;
        
        if(recv.parentThreadId){
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        }else{
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if (messageToUpdate) {
            // 메시지가 존재할 경우 content 업데이트
            messageToUpdate.content = recv.content;
        }
      } else if(recv.type === "ADD_TAG" || recv.type === "CREATE_AND_ADD_TAG"){

        let messageToUpdate;
        
        if(recv.parentThreadId){
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        }else{
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if(messageToUpdate){
          if(!messageToUpdate.tags || messageToUpdate.tags.length === 0){
            messageToUpdate.tags = [{id:recv.tagId, name:recv.tagName, color:recv.tagColor, threadTagId:recv.threadTagId}]
          }else{
            messageToUpdate.tags.push({id:recv.tagId, name:recv.tagName, color:recv.tagColor, threadTagId:recv.threadTagId});
          }
        }
        // 태그를 만들면 바로 태그리스트에 넣어주려 했는데 그럴러면 type을 하나더 추가해서 분기해줘야 될듯 나중에 시간나면 할예정
        if(recv.type === "CREATE_AND_ADD_TAG"){
          
          this.tagList.push({id:recv.tagId, name:recv.tagName, color:recv.tagColor, threadTagId:recv.threadTagId});
        }

      } else if(recv.type === "REMOVE_TAG"){
        let messageToUpdate;
        
        if(recv.parentThreadId){
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        }else{
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }
        
        if(messageToUpdate){
          messageToUpdate.tags = messageToUpdate.tags.filter(tag => tag.id !== recv.tagId);
        }
      } else if(recv.type === "DELETE"){
        // DELETE일 경우, messages에서 해당 id의 메시지를 제거
        console.log("recv.parentThreadId: ",recv.parentThreadId);
        
        if(recv.parentThreadId){
          console.log("부모 있");
          
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          parent.childThreads = parent.childThreads.filter(message => message.id !== recv.id);
        }else{
          console.log("부모 없");
          this.messages = this.messages.filter(message => message.id !== recv.id);
        }
      } else if(recv.type === "DELETE_FILE"){
        // DELETE_File일 경우, messages.files에서 해당 id의 파일을 제거
        let messageToUpdate;
        
        if(recv.parentThreadId){
          const parent = this.messages.find(message => message.id === recv.parentThreadId);
          messageToUpdate = parent.childThreads.find(message => message.id === recv.id);
        }else{
          messageToUpdate = this.messages.find(message => message.id === recv.id);
        }

        if(messageToUpdate){
          messageToUpdate.files = messageToUpdate.files.filter(file => file.fileId !== recv.fileId);
        }
      }
      else {
        // 새로운 메시지일 경우 기존 로직
        if(recv.parentThreadId){
          console.log("부모id 받아옴");
          
          const messageToUpdate = this.messages.find(message => message.id === recv.parentThreadId);

          if(messageToUpdate){
            if(!messageToUpdate.childThreads || messageToUpdate.childThreads.length === 0){
              console.log("first");
              
              messageToUpdate.childThreads = [recv]
            }else{
              console.log("이미 자식 존재");
              
              messageToUpdate.childThreads.push(recv);
            }
          }
        }else{
          this.messages.unshift({
            id: recv.id,
            memberName: recv.memberName,
            content: recv.content,
            image: recv.image,
            createdTime: recv.createdTime,
            files: recv.files,
          });
        }
        
        this.scrollToBottom();
      }
    },
    createAndAddTag(id, tagName, tagColor){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "ADD_TAG",
          channelId: this.roomId,
          threadId: id,
          tagName: tagName,
          tagColor: tagColor,
        })
      );
    },
    addTag(id, tagId){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "ADD_TAG",
          channelId: this.roomId,
          threadId: id,
          tagId: tagId,
        })
      );
    },
    removeTag(id, tagId, threadTagId){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "REMOVE_TAG",
          channelId: this.roomId,
          threadId: id,
          tagId: tagId,
          threadTagId: threadTagId,
        })
      );
    },
    updateMessage(id, message){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "UPDATE",
          channelId: this.roomId,
          threadId: id,
          content: message,
        })
      );
    },
    deleteMessage(id){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "DELETE",
          channelId: this.roomId,
          threadId: id,
        })
      );
    },
    deleteFile(id, fileId){
      const authToken = localStorage.getItem('accessToken');
      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "DELETE_FILE",
          channelId: this.roomId,
          threadId: id,
          fileId: fileId,
        })
      );
    },
    async sendMessage() {
      // 메시지가 비어있거나 공백 문자만 포함된 경우
      if (!this.message.trim() && this.fileList.length === 0) {
        return; // 함수 종료
      }
      const authToken = localStorage.getItem('accessToken');

      if(this.fileList.length>0) {
        try{
          const presignedUrls = await this.getPresignedURL();

          // 각 파일에 대해 Presigned URL을 이용하여 S3에 업로드
          const uploadedFileUrls = await Promise.all(this.fileList.map(file => this.uploadFileToS3(file.file, presignedUrls[file.name])));

          // 파일 중 업로드가 실패한 파일이 있으면 필터링
          const successfulUploads = uploadedFileUrls.filter(url => url !== null);
          

          // 성공적으로 업로드된 파일만 메타데이터 저장
          if (successfulUploads.length) {
            await this.saveFileMetadata(successfulUploads);
          } else {
            alert('모든 파일 업로드에 실패했습니다.');
          }
        }catch(error){
          console.error('Upload failed:', error);
          alert('파일 업로드 중 오류가 발생했습니다.'); 
        }
      }

      this.ws.send(
        "/pub/chat/message",
        {Authorization: authToken},
        JSON.stringify({
          type: "TALK",
          channelId: this.roomId,
          senderId: this.sender,
          parentId: (this.parentThread ? this.parentThread.id : null),
          content: this.message,
          workspaceId: this.workspaceId,
          files: this.filesRes?.map(file => ({fileId:file.id, fileName: file.fileName, fileURL: file.fileUrl }))
        })
      );
      this.files = null;
      this.message = "";
      this.fileList = [];
      this.uploadProgress = [];
      this.filesRes = null;
    },
    async getPresignedURL(){
      const reqFiles = this.fileList.map(file => ({fileName:file.name, fileSize:file.size}))
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
      this.filesRes = response.data.result;
    },
    
    
    fileUpdate(){
        this.files.forEach(file => {
          this.fileList.push({
            name: file.name,
            size: file.size,
            type: file.type, 
            file,
            imageUrl: URL.createObjectURL(file)})
        });
        this.files = null;
    },
    async getMessageList() {
      try {
        let params = {
          size: this.pageSize,
          page: this.currentPage,
        };

        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/thread/list/${this.id}`,
          { params }
        );
        this.currentPage++;
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
      this.scrollToBottom();
    },
    debouncedScrollPagination: debounce(async function () {
      const list = document.getElementById("list-group");
      const isTop = list.scrollTop <= 800;

      if (isTop && !this.isLastPage && !this.isLoading) {
        this.isLoading = true;
        if (list.scrollTop == 0 && !this.isLastPage) {
          list.scrollTop = 20;
        }
        await this.getMessageList();
        this.isLoading = false;
      }
    }, 200),
    async scrollPagination() {
      const list = document.getElementById("list-group");
      const isTop = list.scrollTop <= 1600;
      // "현재화면 + 스크롤로 이동한 화면 > 전체화면 -n" 의 조건이 성립되면 추가 데이터 로드
      // const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 20;
      console.log("scrollPagination%%%%%%%%%%%%%%%%%%%");

      if (isTop && !this.isLastPage && !this.isLoading) {
        this.isLoading = true;
        await this.getMessageList();
        this.isLoading = false;
      }
    },
    scrollToBottom() {
      setTimeout(() => {
          const container = document.getElementById("list-group");

          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 1);
      
    },
    
    deleteImage(index){
      this.fileList.splice(index, 1);
    },
    handleKeydown(event) {
      // IME 입력 중이면 아무 동작도 하지 않음
      if (event.isComposing) return;
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Shift + Enter일 경우 개행 추가
          this.message += '\n';
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
        {Authorization: authToken},
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
      if(hour < 12) {
          ampm = '오전'
      } else {
          ampm = '오후'
          hour -= 12;
      }
      if(hour < 10) {
          hour = '0'+hour;
      }

      if(minute < 10) {
          minute = '0'+minute;
      }

      return ampm + ' ' + hour + ':' + minute;
  },
  isDifferentDay(d1, d2) {
      const day1 = new Date(d1);
      const day2 = new Date(d2);


      if(day1.getFullYear() == day2.getFullYear()
      && day1.getMonth() == day2.getMonth()
      && day1.getDay() == day2.getDay()) return false;

      return true;
  },
  getDay(createdAt) {
      const createdTime = new Date(createdAt);

      return `${createdTime.getFullYear()}년 ${createdTime.getMonth() + 1}월 ${createdTime.getDate()}일`; 
  }
  },
};
</script>

<style scoped>
.container {
  padding:  0 0 0 24px;
  height: 100%;
}
.list-group {
  overflow-y: auto; /* 세로 스크롤 가능 */
  height: 100%;
  max-height: calc(100vh - 240px);
  gap: 10px;
}
.list-group-item{
  gap: 10px;
}
.input-group {
  position: fixed;
  bottom: 0; /* 하단에 고정 */
  background-color: white; /* 배경색 설정 */
  border: 1px solid;
  margin-right: 24px;
  width: 80%;
}
.image-group {
  display: flex;
  flex-direction: row;
  width: 120px;
  max-height: 180px;
}
.custom-contents{
  max-width: 120px; /* 제목의 최대 너비를 설정 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 처리 */
  text-overflow: ellipsis !important; /* 넘치는 텍스트에 '...' 추가*/
  white-space: nowrap; /* 텍스트 줄 바꿈 방지 */
}
.text-group {
  display: flex;
  flex-direction: row;
  width: 100%;
}
.form-control {
  width: 100%;

}
.tag-filter-container{
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
.thread-title{
  display: flex;
  flex-direction: row;
}
.comment-group{
  overflow-y: auto;
  max-height: calc(100vh - 240px);
}
input:focus {
  outline: none;
}
textarea:focus {
  outline: none;
}
</style>
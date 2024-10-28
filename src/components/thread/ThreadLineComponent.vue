<template>
<div class="thread-wrapper">
  <div class="thread">
    <!-- 프로필 이미지 -->
    <div>
      <div class="image">
        <img v-if="isDifferentMember" :src="thread.image ? thread.image : require('@/assets/images/profileImage.png')" alt="image" class="profile-image">
      </div>
    </div>
    
    <div class="thread-content">
      <div class="title">

        <!-- 닉네임 생성일 -->
        <strong v-if="isDifferentMember" class="nickName">{{thread.memberName}}</strong>
        <div v-if="isDifferentMember" class="createdTime">{{createdTime}}</div>

        <!-- 태그 -->
        <div v-if="isDifferentMember" class="tag-group">
          <div class="tag-container" v-for="(tag,index) in thread.tags" :key="index" >
            <button @click="addRemoveTagFilter(tag)"><strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong></button>
            <button class="delete-tag" @click="deleteTag(tag.id,tag.threadTagId)"><strong>x</strong></button>
          </div>
          <div class="hash-btn">
            <button @click="toggleTagMenu">#</button>
          </div>
          
          <div class="tag-toggle">
            <input
              v-if="isTagMenuVisible"
              type="text"
              class="tag-input"
              placeholder="tags"
              v-model="tagName"
              v-on:keypress.enter="createTag"
              v-on:input="adjustWidth"
              ref="tagInput"
              :style="{ width: inputWidth + 'px'}"
            >
            <div class="more-tag" v-if="isTagMenuVisible" :style="{ [tagMenuPosition]: '25px' }">
              <div v-for="(tag,index) in filteredTagList" :key="index" class="tag-list" @click="addT(tag.id)">
                <strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong>
              </div>
              <strong class="tag-create" @click="createTag">+ Create "{{tagName}}"</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 내용 -->
      <div class="content-group">
        <div v-if="isUpdate" class="update-group">
          <textarea
            type="text"
            class="form-control"
            v-model="message"
            v-on:keypress.enter="update"
            @keydown="handleKeydown"
            ref="textarea"
          />
          <div class="update-group-footer">
            <button class="btn" @click="cancel">취소</button>
            <button class="btn" @click="update" style="background: green; color: white;">저장</button>
          </div>
        </div>
        <div v-if="!isUpdate">
          <!-- 내용 태그 -->
          <div v-if="(isTagMenuVisible || (thread.tags && thread.tags.length!=0)) && !isDifferentMember" class="tag-group">
            <div class="tag-container" v-for="(tag,index) in thread.tags" :key="index" >
              <button @click="addRemoveTagFilter(tag)"><strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong></button>
              <button class="delete-tag" @click="deleteTag(tag.id,tag.threadTagId)">x</button>
            </div>
            <div class="hash-btn">
              <button @click="toggleTagMenu">#</button>
            </div>
            <div class="tag-toggle">
              <div class="tag-input-group">
                <input
                  v-if="isTagMenuVisible"
                  type="text"
                  class="tag-input"
                  placeholder="tags"
                  v-model="tagName"
                  v-on:keypress.enter="createTag"
                  v-on:input="adjustWidth"
                  ref="tagInput"
                  :style="{ width: inputWidth + 'px'}"
                >
                <div class="more-tag" v-if="isTagMenuVisible" :style="{ [tagMenuPosition]: '25px' }">
                  <div v-for="(tag,index) in filteredTagList" :key="index" class="tag-list" @click="addT(tag.id)">
                    <strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong>
                  </div>
                  <strong class="tag-create" @click="createTag">+ Create "{{tagName}}"</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="content" v-html="formattedContent"></div>
        </div>
      </div>
      
      <!-- 파일 -->
      <div class="image-group">
        <div class="file-group" v-for="(file, index) in thread.files" :key="index">
          <img :src="file.fileURL" alt="image" @error="e => e.target.src = require('@/assets/images/file.png')"  style="height: 120px; width: 120px; object-fit: cover; border-radius:10px;">
          <p class="custom-contents">{{file.fileName}}</p>
          <div class="more-btn-file">
            <button class="btn1" @click="downloadFile(file.fileId,file.fileName)">
              <v-icon>mdi-download</v-icon>
            </button>
            <button class="btn2" @click="deleteF(file.fileId)">
              <v-icon color="error">mdi-trash-can</v-icon>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 댓글 -->
      <div>
        <button v-if="!thread.parentThreadId && thread.childThreads && thread.childThreads.length !==0 && !isComment" @click="commentIn(thread)">
          <strong class="comment">
            {{ thread.childThreads && thread.childThreads.length > 0 ? `${thread.childThreads.length}개의 댓글` : '댓글' }}
          </strong>
        </button>
      </div>
    </div>
  </div>

  <!-- 더보기 메뉴 -->
  <div class="more-btn" @click="toggleContextMenu">
      <button>
        <img :src="require('@/assets/images/menu-icon.png')" alt="더보기" style="height: 20px; width: 20px;">
      </button>
  </div>
  <div v-if="isContextMenuVisible || isTagMenuVisible" class="overlay"></div>
  <div v-if="isContextMenuVisible" class="context-menu" :style="{ top: [contextMenuPosition]+'px' }">
    <button class="context-btn" @click="commentIn(thread)" v-if="!isComment">댓글 쓰기</button>
    <button class="context-btn" @click="toggleTagMenu">태그 추가</button>
    <button class="context-btn" @click="editMessage">수정</button>
    <button class="context-btn" @click="deleteM">삭제</button>
  </div>
</div>
</template>
  
<script>
import axios from '@/services/axios';
  export default {
    props: ['thread', 'createdTime', 'updateMessage','deleteMessage','deleteFile','createAndAddTag','tagList','addTag','removeTag','addTagFilter','removeTagFilter','tagFilter','commentIn','isDifferentMember','isComment'],
    data() {
        return {
            message: "",
            isContextMenuVisible: false,
            isUpdate: false,
            tagName: "",
            tagColor: "",
            inputWidth: 35,
            isTagMenuVisible: false,
        };
    },
    computed: {
      formattedContent() {
        return this.thread.content.replace(/\n/g, '<br />'); // 개행 문자를 <br>로 변환
      },
      filteredTagList() {
        // tags에 포함되지 않은 tagList의 태그를 필터링
        if(!this.thread.tags || this.thread.tags.length === 0){
          return this.tagList.filter(tag => 
            tag.name.toLowerCase().includes(this.tagName.toLowerCase()) // tagName에 따라 필터링
          );
        }else{
          return this.tagList.filter(tag => 
            !this.thread.tags.some(t => t.id === tag.id) &&
            tag.name.toLowerCase().includes(this.tagName.toLowerCase()) // tagName에 따라 필터링
          );
        }
      },
    },
    created() {
      this.message=this.thread.content
    },
    mounted() {
        // 외부 클릭 감지 이벤트 리스너 등록
        document.addEventListener("click", this.handleOutsideClick);
    },
    beforeUnmount() {
        // 컴포넌트가 언마운트될 때 외부 클릭 감지 리스너 제거
        document.removeEventListener("click", this.handleOutsideClick);
    },
    methods: {
      addRemoveTagFilter(tag) {
        // tagFilter가 정의되어 있는지 확인
        const tagExists = this.tagFilter && this.tagFilter.some(t => t.tag.id === tag.id);
        
        if (tagExists) {
          // tag가 tagFilter에 있으면 removeTagFilter 호출
          this.removeTagFilter(tag, this.thread.id);
        } else {
          // tag가 tagFilter에 없으면 addTagFilter 호출
          this.addTagFilter(tag, this.thread.id);
        }
      },
      adjustWidth({target:{value}}) {
        this.inputWidth = this.$refs.tagInput.scrollWidth; // 입력 필드의 콘텐츠 너비를 기반으로 조정
        this.tagName = value
      },
      createTag(){
        if (!this.tagName.trim()) {
          return;
        }
        
        if(this.tagList.some(t => t.name === this.tagName)) {
          alert("이미 있는 태그 이름입니다!")
          return;
        }
        this.createAndAddTag(this.thread.id, this.tagName, this.getRandomColor());
        this.tagName = ""
        this.inputWidth = 35
      },
      addT(tagId){
        this.addTag(this.thread.id, tagId)
      },
      deleteTag(tagId, threadTagId){
        this.removeTag(this.thread.id,tagId,threadTagId)
      },
      getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      // getRandomColor() {
      //   const getRandomInt = () => Math.floor(Math.random() * 200);

      //   const r = getRandomInt(0, 250); // R: 128~255
      //   const g = getRandomInt(0, 250); // G: 128~255
      //   const b = getRandomInt(0, 250); // B: 128~255

      //   return `#${r+g+b}`;
      // },
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
            this.update();
            event.preventDefault(); // 기본 동작 방지
          }
        }
      },
      update(){
        if (!this.message.trim()) {
          return; // 함수 종료
        }
        this.updateMessage(this.thread.id,this.message);
        this.isUpdate = false
      },
      deleteM(){
        this.deleteMessage(this.thread.id);
      },
      deleteF(fileId){
        this.deleteFile(this.thread.id,fileId);
      },
      toggleContextMenu(event) {
        event.stopPropagation(); // 클릭 이벤트 전파 방지
        this.isContextMenuVisible = !this.isContextMenuVisible;

        const screenHeight = window.innerHeight;
        const buttonPosition = event.target.getBoundingClientRect().bottom;

        this.contextMenuPosition = (screenHeight / 1.7 > buttonPosition) ? '10' : '-120';
      },
      toggleTagMenu(event) {
        event.stopPropagation(); // 클릭 이벤트 전파 방지
        this.isTagMenuVisible = !this.isTagMenuVisible;

        // 화면 높이 확인 후 위치 결정
        const screenHeight = window.innerHeight;
        const buttonPosition = event.target.getBoundingClientRect().bottom;

        this.tagMenuPosition = (screenHeight / 1.9 > buttonPosition) ? 'top' : 'bottom';

        this.$nextTick(() => {
          if (this.isTagMenuVisible) {
            this.$refs.tagInput.focus(); // 포커스 주기
          }
        });
      },
      handleOutsideClick() {
      // 컨텍스트 메뉴 외부 클릭 시 닫힘 처리
        this.isContextMenuVisible = false;
        this.isTagMenuVisible = false;
        this.tagName = "";
      },
      editMessage() {
        // 메시지 수정 로직
        this.isUpdate = true
      },
      cancel(){
        this.isUpdate = false
        this.message=this.thread.content
      },
      async downloadFile(fileId,fileName) {
        try {
          // presigned URL 가져오기
          const response = await axios.get(`http://localhost:8080/api/v1/files/${fileId}/download`);

          const presignedUrl = response.data.result; // presigned URL 가져오기

          // Blob을 사용하여 파일 다운로드
          const fileResponse = await axios.get(presignedUrl, { responseType: 'blob' });

          // 파일 이름 추출
          // const fileName = response.headers['content-disposition']
          //   ? response.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
          //   : 'downloaded_file';

          // Blob을 파일로 변환하여 다운로드
          const blob = new Blob([fileResponse.data], { type: fileResponse.headers['content-type'] });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.setAttribute('download', fileName); // 서버에서 전달된 파일 이름으로 설정
          document.body.appendChild(link);
          link.click(); // 링크 클릭 이벤트로 다운로드 시작
          document.body.removeChild(link); // 링크 제거
        } catch (error) {
          console.error("파일 다운로드에 실패했습니다.", error);
          alert("파일 다운로드 중 오류가 발생했습니다.");
        }
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
    },
  };
</script>
<style scoped>
.thread {
  display: flex;
}
.thread-wrapper {
  position: relative;
}

.more-btn {
  display: none;
  position: absolute;
  top: 0;
  right: 20px; /* 버튼의 절반이 thread에 걸쳐 보이도록 설정 */
  z-index: 2;
}
.context-btn{
  padding: 2px;
  border-radius: 5px;
}
.context-btn:hover {
  background-color: #f8f8f8;
}
.thread-wrapper:hover {
  background-color: #f8f8f8;
}
.thread-wrapper:hover .more-btn {
  display: block;
}
.image {
  width: 50px;
  /* 이미지의 가로 크기 */
  margin: 0 10px;
  justify-content: center;
  align-content: center;
  align-items: center;
}
.profile-image{
  width: 50px;
  /* 이미지의 가로 크기 */
  height: 50px;
  /* 이미지의 세로 크기 */
  border-radius: 15px;
  /* 이미지를 동그랗게 만듦 */
  object-fit: cover;
}
.thread-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
}
.title {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.nickName {

}
.createdTime {
  
}
.tag-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}
.tag-container {
  position: relative;
}
.tag {
  border-radius: 6px;
  padding: 1px 9px 4px 9px;
  color: white;
  font-size: 13px;
}
.tag-container:hover .delete-tag {
  display: block;
}
.delete-tag{
  display: none;
  position: absolute;
  top: -6px;
  right: -3px;
  z-index: 3;
}
.tag-toggle{
  z-index: 3;
  position: relative;
}
.tag-list{
  justify-content: center;
  align-items: center;
}
.tag-list:hover {
  background-color: #f0f0f0;
}
.tag-create:hover {
  background-color: #f0f0f0;
}
.more-tag{
  position: absolute;
  left: 0;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  flex-direction: column;
  width: 200px;
  max-height: 200px;
  overflow-y: auto;
}
.content-group{
  display: flex;
  flex-direction: row;
  gap: 10px;
}
.content {
  white-space: pre-line; /* 개행을 인식하고 줄 바꿈 */
}
.files {
    
}
.context-menu {
  position: absolute;
  right: 50px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  z-index: 10;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0); /* 반투명 배경 */
  z-index: 2; /* 컨텍스트 메뉴보다 아래에 위치 */
}
.image-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.file-group{
  position: relative;
}
.file-group:hover .more-btn-file {
  display: block;
}
.file-group:hover .more-btn-file2 {
  display: block;
}
.more-btn-file{
  background: #f8f8f8;
  display: none;
  position: absolute;
  top: 5px;
  right: 5px; /* 버튼의 절반이 thread에 걸쳐 보이도록 설정 */
  z-index: 2;
  border-radius: 5px;
}
.btn1:hover {
  border-radius: 5px;
  background-color: #d6d6d6;
}
.btn2:hover {
  border-radius: 5px;
  background-color: #d6d6d6;
}

.hash-btn{
  display: flex;
  border: 0.5px solid;
  border-radius: 5px;
  border-color: #f0f0f0;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
}
.hash-btn:hover {
  border-radius: 5px;
  background-color: #d6d6d6;
}
.more-btn-file2{
  background: #f8f8f8;
  display: none;
  position: absolute;
  top: 0;
  left: 0; /* 버튼의 절반이 thread에 걸쳐 보이도록 설정 */
  z-index: 2;
}
.custom-contents{
  max-width: 120px; /* 제목의 최대 너비를 설정 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 처리 */
  text-overflow: ellipsis !important; /* 넘치는 텍스트에 '...' 추가 (이거 적용안됨 이후 수정필요)*/
  white-space: nowrap; /* 텍스트 줄 바꿈 방지 */
}
.comment {
  color: blue;
}
.update-group{
  background-color: white;
  /* 배경색 설정 */
  border: 1px solid;
  border-radius: 5px;
  width: 90%;
}
.form-control {
  resize: none;
  width: 99%;
  height: 20vh;
  overflow-y: auto;
  margin-left: 5px;
}
.tagButton{
  height: fit-content;
}
.tag-input-group{
  position: relative;
}
input:focus {
  outline: none;
}
textarea:focus {
  outline: none;
}
.update-group-footer{
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 5px 5px;
}
.btn{
  min-width: 56px;
  height: 28px;
  padding: 0 12px 1px;
  font-size: 13px;
  background-color: white;
  border: 1px solid black;
  color: black;
  font-weight: 700;
  background-clip: padding-box;
  transition: all 80ms linear;

  cursor: pointer;
  border-radius: 5px;
  text-align: center;
  white-space: nowrap;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
}
</style>


  
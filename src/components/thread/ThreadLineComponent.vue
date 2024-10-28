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
        <span v-if="isDifferentMember" class="nickName">{{thread.memberName}}</span>
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
              <span class="tag-create" @click="createTag">태그 생성 : "{{tagName}}"</span>
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
                  <span class="tag-create" @click="createTag">태그 생성 :  "{{tagName}}"</span>
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
            <v-icon icon="mdi-message-text" />
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
          const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/files/${fileId}/download`);

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

<style lang="scss">
@import "@/assets/css/thread.scss";
</style>

  
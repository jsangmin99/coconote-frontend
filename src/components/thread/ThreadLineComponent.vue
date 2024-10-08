<template>
<div class="thread-wrapper">
  <div class="thread">
    <!-- 프로필 이미지 -->
    <div>
      <div class="image">
          {{ id }}
      </div>
    </div>
    <div class="thread-content">
      <div class="title">

        <!-- 닉네임 생성일 -->
        <div class="nickName">{{nickName}}</div>
        <div class="createdTime">{{createdTime}}</div>

        <!-- 태그 -->
        <div class="tag-group">
          <div class="tag-container" v-for="(tag,index) in this.tags" :key="index" >
              <strong class="tag" :style="{ backgroundColor: tag.color }">{{tag.name}}</strong>
              <button class="delete-tag" @click="deleteTag(tag.id,tag.threadTagId)">x</button>
          </div>
          <button @click="toggleTagMenu" :style="{marginRight: 3+'px'}">#</button>
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
            </div>
          </div>
        </div>
      </div>

      <!-- 내용 -->
      <div v-if="!isUpdate" class="content" v-html="formattedContent"></div>
      <div v-if="isUpdate" class="update-group">
        <textarea
          type="text"
          class="form-control"
          v-model="message"
          v-on:keypress.enter="update"
          @keydown="handleKeydown"
        />
      </div>
      
      <!-- 파일 -->
      <div class="image-group">
        <div v-for="(file, index) in this.files" :key="index">
          <div class="file-group">
            <img :src="file.fileURL" alt="image" @error="e => e.target.src = require('@/assets/file.png')"  style="height: 120px; width: 120px; object-fit: cover;">
            <p class="custom-contents">{{file.fileName}}</p>
            <div class="more-btn-file">
              <button @click="deleteF(file.fileId)">파일삭제</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 댓글 -->
      <div class="comment">comment</div>
    </div>
  </div>

  <!-- 더보기 메뉴 -->
  <div class="more-btn" @click="toggleContextMenu">
      <button>더보기</button>
  </div>
  <div v-if="isContextMenuVisible || isTagMenuVisible" class="overlay"></div>
  <div v-if="isContextMenuVisible" class="context-menu">
    <button @click="editMessage">수정</button>
    <button @click="deleteM">삭제</button>
  </div>
</div>
</template>
  
<script>
  export default {
    props: ['id','type', 'image', 'nickName', 'createdTime','content','files','childThreads','tags','updateMessage','deleteMessage','deleteFile','createAndAddTag','tagList','addTag','removeTag'],
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
        return this.content.replace(/\n/g, '<br />'); // 개행 문자를 <br>로 변환
      },
      filteredTagList() {
        // tags에 포함되지 않은 tagList의 태그를 필터링
        if(!this.tags || this.tags.length === 0){
          return this.tagList
        }else{
          return this.tagList.filter(tag => !this.tags.some(t => t.id === tag.id));
        }
      }
    },
    created() {
        this.message=this.content
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
      adjustWidth() {
        this.inputWidth = this.$refs.tagInput.scrollWidth; // 입력 필드의 콘텐츠 너비를 기반으로 조정
      },
      createTag(){
        if (!this.tagName.trim()) {
          return;
        }
        this.createAndAddTag(this.id, this.tagName, this.getRandomColor());
        this.tagName = ""
        this.inputWidth = 35
      },
      addT(tagId){
        this.addTag(this.id, tagId)
      },
      deleteTag(tagId, threadTagId){
        this.removeTag(this.id,tagId,threadTagId)
      },
      getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      handleKeydown(event) {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            // Shift + Enter일 경우 개행 추가
            this.message += '\n';
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
        this.updateMessage(this.id,this.message);
        this.isUpdate = false
      },
      deleteM(){
        this.deleteMessage(this.id);
      },
      deleteF(fileId){
        this.deleteFile(this.id,fileId);
      },
      toggleContextMenu(event) {
        event.stopPropagation(); // 클릭 이벤트 전파 방지
        this.isContextMenuVisible = !this.isContextMenuVisible;
      },
      toggleTagMenu(event) {
        event.stopPropagation(); // 클릭 이벤트 전파 방지
        this.isTagMenuVisible = !this.isTagMenuVisible;

        // 화면 높이 확인 후 위치 결정
        const screenHeight = window.innerHeight;
        const buttonPosition = event.target.getBoundingClientRect().bottom;

        this.tagMenuPosition = (screenHeight / 1.7 > buttonPosition) ? 'top' : 'bottom';

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
      },
      editMessage() {
        // 메시지 수정 로직
        console.log("메시지 수정");
        this.isUpdate = true
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
  transform: translateY(50%); /* 수직으로 중앙 정렬 */
  z-index: 2;
}
.thread-wrapper:hover {
  background-color: #f8f8f8;
}
.thread-wrapper:hover .more-btn {
  display: block;
}
.image {
    margin: 10px;
}
.thread-content {
  gap: 10px;
  width: 100%;
}
.title {
  display: flex;
  gap: 5px;
}
.nickName {

}
.createdTime {
    
}
.tag-group {
  display: flex;
  flex-direction: row;
  gap: 5px;
}
.tag-container {
  position: relative;
}
.tag {
  border-radius: 5px;
  padding: 0 5px 1px 5px;
  color: white;
  font-size: 11px;
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
.more-tag{
  position: absolute;
  left: 0;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 220px;
  overflow: scroll;
}
.content {
  white-space: pre-line; /* 개행을 인식하고 줄 바꿈 */
}
.files {
    
}
.context-menu {
  position: absolute;
  top: 10px;
  right: 70px;
  background-color: white;
  border: 1px solid #ccc;
  z-index: 3;
  padding: 10px;
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
  flex-direction: row;
  width: 120px;
  max-height: 180px;
  gap: 10px;
}
.file-group{
  position: relative;
}
.file-group:hover .more-btn-file {
  display: block;
}
.more-btn-file{
  background: #f8f8f8;
  display: none;
  position: absolute;
  top: 0;
  right: 0; /* 버튼의 절반이 thread에 걸쳐 보이도록 설정 */
  z-index: 2;
}
.custom-contents{
  max-width: 120px; /* 제목의 최대 너비를 설정 */
  overflow: hidden; /* 내용이 넘칠 경우 숨김 처리 */
  text-overflow: ellipsis !important; /* 넘치는 텍스트에 '...' 추가 (이거 적용안됨 이후 수정필요)*/
  white-space: nowrap; /* 텍스트 줄 바꿈 방지 */
}
.comment {
    
}
.update-group{
  border: 1px solid;
}
.form-control {
  width: 80%;
}
input:focus {
  outline: none;
}
</style>


  
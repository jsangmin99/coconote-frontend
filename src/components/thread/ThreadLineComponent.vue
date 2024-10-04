<template>
<div class="thread-wrapper">
    <div class="thread">
        <div>
            <div class="image">
                {{ id }}
            </div>
        </div>
        <div class="thread-content">
            <div class="title">
                <div class="nickName">{{nickName}}</div>
                <div class="createdTime">{{createdTime}}</div>
                <div class="tag">tag</div>
            </div>
            <div class="content">{{content}}</div>
            <input
                type="text"
                class="form-control"
                v-model="message"
                v-on:keypress.enter="update"
            />
            
            <div class="image-group">
                <div v-for="(file, index) in this.files" :key="index">
                    <img :src="file.fileURL" alt="image" @error="e => e.target.src = require('@/assets/file.png')"  style="height: 120px; width: 120px; object-fit: cover;">
                    <p class="custom-contents">{{file.fileName}}</p>
                </div>
            </div>
            
            <div class="comment">comment</div>
        </div>
    </div>
    <div class="more-btn">
        <button>더보기</button>
    </div>
</div>
</template>
  
<script>
    export default {
    props: ['id','type', 'image', 'nickName', 'createdTime','content','files','childThreads','tags','updateMessage'],
    // props: {
    //     id: String,
    //     type: String,
    //     image: String,
    //     nickName: String,
    //     createdTime: String,
    //     content: String,
    //     files: Array,
    //     childThreads: Array,
    //     tags: Array,
    //     updateMessage: Function,  // 부모로부터 받은 메서드를 prop으로 추가
    // },
    data() {
        return {
            message: "",
        };
    },
    computed: {},
    created() {
        this.message=this.content
    },
    methods: {
        update(){
            this.updateMessage(this.id,this.message);
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
}
.title {
    display: flex;
    gap: 10px;
}
.nickName {

}
.createdTime {
    
}
.tag {
    
}
.content {
    
}
.files {
    
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
  text-overflow: ellipsis !important; /* 넘치는 텍스트에 '...' 추가 (이거 적용안됨 이후 수정필요)*/
  white-space: nowrap; /* 텍스트 줄 바꿈 방지 */
}
.comment {
    
}
</style>


  
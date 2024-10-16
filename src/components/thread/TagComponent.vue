<template>
  <div>
    <h2>태그 전체보기</h2>
		<hr>
		<h4>태그 리스트</h4>
		<div class="tag-list">
			<div class="tag-container" v-for="(tag,index) in tagList" :key="index" >
				<div>
					<strong v-if="!isUpdateTagName || selectedTag.id !== tag.id" class="tag" :style="{ backgroundColor: tag.color }">
						{{tag.name}}
					</strong>
					<input
						v-if="isUpdateTagName && selectedTag.id === tag.id"
						type="text"
						class="tag"
						:style="{ backgroundColor: tag.color }"
						v-on:keypress.enter="updateTagName"
						:ref="'tagInput' + tag.id"
						v-model="tagName"
          >
					<button class="menu-btn" @click="toggleTagMenu(tag, $event)">⚙️</button>
				</div>
			</div>
		</div>
		<hr>
		<h4>검색 결과</h4>
		<div class="filter-result"></div>

		<div v-if="isTagMenuVisible" class="context-menu" :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }">
      <button @click="editTag(selectedTag, $event)">수정</button>
      <button @click="deleteTag(selectedTag)">삭제</button>
    </div>
  </div>
</template>
  
<script>
import axios from '@/services/axios'

export default {
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  components: {
  },
  data() {
    return {
			tagList: [],
			isTagMenuVisible: false,
			isUpdateTagName: false,
			selectedTag: null,
      menuPosition: { x: 0, y: 0 },
			tagName: "",
		};
  },
  created() {
		this.getTagList();
		document.addEventListener('click', this.closeTagMenu); // 외부 클릭 감지
	},
  mounted() {},
  updated() {},
  beforeUnmount() {
		document.removeEventListener('click', this.closeTagMenu); // 컴포넌트 언마운트 시 이벤트 제거
	},
  computed: {},
  methods: {
		async getTagList(){
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/tag/list/${this.id}`);
      this.tagList = response.data.result
    },
		toggleTagMenu(tag, event){
			event.stopPropagation(); // 클릭 이벤트 전파 방지
			this.selectedTag = tag;

			// 메뉴가 열릴 때 isUpdateTagName이 true라면 false로 설정
			if (this.isUpdateTagName) {
        this.isUpdateTagName = false;
      }

      this.isTagMenuVisible = !this.isTagMenuVisible;
      this.menuPosition = { x: event.clientX, y: event.clientY }; 
		},
		closeTagMenu() {
			console.log("closeTagMenu");
			
      this.isTagMenuVisible = false;
			if (this.isUpdateTagName) {
            this.isUpdateTagName = false;
        }
    },
		async editTag(tag, event) {
			event.stopPropagation()
			this.tagName = tag.name
      this.isUpdateTagName = true;
			this.isTagMenuVisible = false;
			this.$nextTick(() => {
					this.$refs['tagInput' + tag.id][0].focus(); // 포커스 주기
      });
    },
    async deleteTag(tag) {
      // 태그 삭제 로직
			const response = await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/tag/delete/${tag.id}`);
			console.log(response.data);
			this.getTagList();
    },
		async updateTagName(){
			const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/tag/update`,{tagId:this.selectedTag.id, updateTagName:this.tagName});
			console.log(response.data);
			this.getTagList();
			this.isUpdateTagName = false;
		},
	},
};
</script>
  
<style scoped>
.tag-list{
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
.tag-container:hover .menu-btn {
  display: block;
}
.menu-btn{
  display: none;
  position: absolute;
  top: -2px;
  right: -5px;
  z-index: 3;
	font-size: 12px;
}
.context-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
.context-menu button {
  display: block;
  width: 100%;
  padding: 5px;
  border: none;
  background: none;
  text-align: left;
}
.context-menu button:hover {
  background-color: #f0f0f0;
}
input:focus {
  outline: none;
}
</style>
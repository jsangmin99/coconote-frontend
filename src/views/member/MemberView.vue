<template>
  <div>
    <h1>모든 회원</h1>
              <v-btn @click="showMailSender" color="#3a8bcd" text="회원 초대">
          </v-btn>
            <v-row>
              <v-col v-for="member in workspaceMemberList" :key="member.workspaceMemberId" sm="3" md="2">
                <v-card @click="fetchWorkspaceMemberDetail(member.workspaceMemberId)" class="hover-card custom-padding-card">
                    <v-img height="200px"></v-img>
                    <v-card-text class="member-position">{{ member.nickname }}</v-card-text>
                    <v-card-title class="member-name">{{ member.nickname }}</v-card-title>
                    <v-chip small :color="getChipColor(member.wsRole)">{{ member.wsRole }}</v-chip>
                </v-card>
            </v-col>
        </v-row>
  </div>

    <v-dialog v-model="workspaceMemberModal" max-width="500px" class="workspaceMemberModal">
       <v-card v-if="editingMemberId === workspaceMemberInfo.workspaceMemberId">
      <v-card-title class="text-h5 text-center">
        워크스페이스 회원 정보 수정     
        </v-card-title>
      <v-card-text>
        <!-- 나중에 사진 넣을 수 있게 만들기 -->
         <v-icon size="50">mdi-account-circle</v-icon> 
         <v-list>
          <v-text-field v-model="editedMemberName" placeholder="이름"></v-text-field>
          <v-text-field v-model="editedNickname" placeholder="닉네임"></v-text-field>
          <v-text-field v-model="editedField" placeholder="소속"></v-text-field>
          <v-text-field v-model="editedPosition" placeholder="직급"></v-text-field>
         </v-list>      
      </v-card-text>
      <v-btn text="수정" color="blue" @click="saveWorkspaceMemberInfo(workspaceMemberInfo.workspaceMemberId)"></v-btn>
      <v-btn text="취소" color="grey" @click="cancelEditing"></v-btn>
    </v-card>

      <v-card v-else>
      <v-card-title class="text-h5 text-center">
        워크스페이스 회원      
        <v-icon v-if="isMe(workspaceMemberInfo.workspaceMemberId)" @click="startEditing(workspaceMemberInfo)">mdi-cog</v-icon>
        </v-card-title>
      <v-card-text>
         <v-img height="200px"></v-img>
         <v-list>
          <v-list-item>이름    {{ workspaceMemberInfo.memberName }}</v-list-item>
          <v-list-item>닉네임    {{ workspaceMemberInfo.nickname }}</v-list-item>
          <v-list-item>소속    {{ workspaceMemberInfo.field }}</v-list-item>
          <v-list-item>직급    {{ workspaceMemberInfo.position }}</v-list-item>
          <v-list-item>권한    {{ workspaceMemberInfo.wsRole }}</v-list-item>
         </v-list>
      </v-card-text>
      <div v-if="this.getWsRole !== 'USER' && this.workspaceMemberInfo.wsRole !== 'PMANAGER'">
        <v-icon v-if="this.workspaceMemberInfo.wsRole === 'USER'" @click="changeRole(workspaceMemberInfo.workspaceMemberId)">mdi-account-arrow-up</v-icon>
        <v-icon v-if="this.workspaceMemberInfo.wsRole === 'SMANAGER'" @click="changeRole(workspaceMemberInfo.workspaceMemberId)">mdi-account-arrow-down</v-icon>
        <v-icon @click="removeMember(workspaceMemberInfo.workspaceMemberId)">mdi-account-remove</v-icon>
      </div>
      <v-btn class="" text="닫기" @click="workspaceMemberModal=false"></v-btn>
    </v-card>
   
    </v-dialog>


    <CreateWorkspaceMemberModal 
    v-model = "sendMail"
    @update:dialog="sendMail = $event"
    :selectedValue="selectedValue" 
  />
</template>

<script>
import axios from "axios";
import CreateWorkspaceMemberModal from '@/components/basic/CreateWorkspaceMemberModal.vue';
import { mapGetters, mapActions } from "vuex";

export default {
   props: {
    workspaceId: {
      type: Number, 
      required: true
    }
  },
  components: {
    CreateWorkspaceMemberModal
  },
  created() {
    this.fetchWorkspaceMemberList();
    this.fetchMyInfo();
  },
  computed: {
    ...mapGetters(["getWorkspaceId", "getWorkspaceMemberId", "getWorkspaceName", "getWsRole",]),
  },
  data() {
    return {
      myInfo: [],
      workspaceMemberList: [],
      workspaceMemberInfo: [],
      workspaceMemberModal: false,
      sendMail: false,
      editingMemberId: null,
      editedMemberName: "",
      editedNickname: "",
      editedField: "",
      editedPosition: "",
    };
  },
  methods: {
    ...mapActions([
      "setMemberInfoActions",
    ]),
    async fetchMyInfo() {
      try {
        if(!this.workspaceId || this.workspaceId == undefined || this.workspaceId == ""){
          return false;
        }
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/member/me/workspace/${this.workspaceId}`
        );
        this.myInfo = response.data.result;
      } catch (e) {
        console.log(e);
      }
    },
    async fetchWorkspaceMemberList() {
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/workspace/${this.workspaceId}/member/list`);
        this.workspaceMemberList = response.data.result; 
    },
    async fetchWorkspaceMemberDetail(workspaceMemberId) {
      this.workspaceMemberModal = true;
      this.workspaceMemberInfo = [];
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/${workspaceMemberId}`);
      this.workspaceMemberInfo = response.data.result;
    },
    getChipColor(credentials) {
      switch (credentials) {
        case "PMANAGER":
          return "red";
        case "SMANAGER":
          return "blue";
        default:
          return "grey";
      }
    },
    showMailSender() {
      this.sendMail = true;
    },
    isMe(workspaceMemberId) {
      return this.myInfo.workspaceMemberId === workspaceMemberId;
    },
    startEditing(workspaceMember) {
      this.editingMemberId = workspaceMember.workspaceMemberId;
      this.editedMemberName = workspaceMember.memberName;
      this.editedNickname = workspaceMember.nickname;
      this.editedField = workspaceMember.field;
      this.editedPosition = workspaceMember.position;
    },
    async saveWorkspaceMemberInfo(wsMemberId) {
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/member/update/${wsMemberId}`,
          {
            memberName: this.editedMemberName,
            nickname: this.editedNickname,
            field: this.editedField,
            position: this.editedPosition,
            profileImage: "",
          }
        );
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/${wsMemberId}`);
        this.workspaceMemberInfo = response.data.result;
        const wsMember = this.workspaceMemberList.find(m => m.workspaceMemberId === wsMemberId);
        console.log(wsMember);
        if (wsMember) {
            wsMember.memberName = this.editedMemberName;
            wsMember.nickname = this.editedNickname;
            wsMember.field = this.editedField;
            wsMember.position = this.editedPosition;
        }
        this.editingMemberId = null;
        this.setMemberInfoActions({
            nickname: this.editedNickname,
            workspaceMemberId: this.getWorkspaceMemberId,
            profileImage: "", // 나중에 바꿔야 함
            wsRole: this.getWsRole,
        });

        alert("수정되었습니다.");
      } catch (e) {
        console.error("수정 실패", e);
        alert("수정에 실패했습니다.");
      }
    },
    cancelEditing() {
      this.editingMemberId = null;
    },
    async changeRole(wsMemberId) {
      try{
        await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/changerole/${wsMemberId}`);
        alert("권한이 변경되었습니다.");
        this.workspaceMemberModal = false;
        window.location.href = `/member/${this.getWorkspaceId}`;
      } catch (e) {
        console.error("실패", e);
        alert("권한 변경에 실패했습니다.");
      }
      
    },
    async removeMember(wsMemberId) {
      try{
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/delete/${wsMemberId}`);        
        alert("회원을 강제 퇴장시켰습니다.");
        window.location.href = `/member/${this.getWorkspaceId}`;

      } catch (e) {
        console.error("실패", e);
        alert("회원 삭제에 실패했습니다.");
      }
    },
  },
};
</script>

<style lang="scss">
.hover-card {
    transition: transform 0.2s ease;
    border-radius: 15px;
}

.hover-card:hover {
    transform: translate(0px, -5px);
}

.custom-padding-card {
    padding: 30px 20px;
}

.v-card-title {
    padding-top: 2px;
    padding-bottom: 2px;
}

.member-name {
    font-size: 17px;
}

.member-position {
    color: #919191;
    padding-bottom: 0px;
    font-size: 12px;
}



</style>

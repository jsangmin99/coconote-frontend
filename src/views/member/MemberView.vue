<template>
<v-container>
  <div>
    <h1>모든 회원</h1>
    <v-btn @click="showMailSender" color="#3a8bcd" text="회원 초대"></v-btn>
  </div>
  <br>
  <br>
  <br>
  <div>
  <v-row>
    <v-col v-for="member in workspaceMemberList" :key="member.workspaceMemberId" cols="2" md="2">
      <v-card @click="fetchWorkspaceMemberDetail(member.workspaceMemberId)" class="hover-card custom-padding-card">
        <img :src="member.profileImage && member.profileImage !== 'null' ? getProfileImage : require('@/assets/images/profileImage.png')" alt="Profile Image" style="width: 100%;"/>
          <v-card-text class="member-info">{{ member.nickname || '별명 없음' }}</v-card-text>
          <v-card-title class="member-title">{{ member.memberName || '이름 없음' }}</v-card-title>
          <v-icon v-if="member.wsRole === 'PMANAGER'"  color='#ffbb00'>mdi-crown</v-icon>
          <v-icon v-if="member.wsRole === 'SMANAGER'"  color='#C0C0C0'>mdi-crown</v-icon>
        </v-card>
      </v-col>
    </v-row>
  </div>
</v-container>
  

    <v-dialog v-model="workspaceMemberModal" max-width="600px" class="workspaceMemberModal">
       <!-- <v-card v-if="editingMemberId === workspaceMemberInfo.workspaceMemberId"> -->
       <v-card>
      <!-- <v-card-title class="text-h5 text-center">
        워크스페이스 회원 정보 수정     
        </v-card-title>
      <v-card-text>
         <v-icon size="50">mdi-account-circle</v-icon> 
         <v-list>
          <v-text-field v-model="editedMemberName" placeholder="이름"></v-text-field>
          <v-text-field v-model="editedNickname" placeholder="닉네임"></v-text-field>
          <v-text-field v-model="editedField" placeholder="소속"></v-text-field>
          <v-text-field v-model="editedPosition" placeholder="직급"></v-text-field>
         </v-list>      
      </v-card-text>
      <v-btn text="수정" color="blue" @click="saveWorkspaceMemberInfo(workspaceMemberInfo.workspaceMemberId)"></v-btn>
      <v-btn text="취소" color="grey" @click="cancelEditing"></v-btn> -->
    <!-- </v-card> -->

      <!-- <v-card v-else> -->
        <v-card-title class="text-h5">
                  <v-icon v-if="getWsRole !== 'USER'" icon="mdi-dots-vertical" @click="toggleDropdown()" style="position: absolute; right: 0;">
            <span @click="console.log('dots clicked')"></span>
          </v-icon>
          <h2>프로필 
          <v-icon color="grey" v-if="isMe(workspaceMemberInfo.workspaceMemberId)" @click="startEditing(workspaceMemberInfo)" size="20">mdi-cog</v-icon></h2>

        </v-card-title>
        <v-card-text>
            <v-row justify="center">
              <v-col cols="12">
                <div class="member-detail-container">
                  <v-row>
                    <v-col>
                      <img :src="getProfileImage && getProfileImage !== 'null' ? getProfileImage : require('@/assets/images/profileImage.png')" alt="Profile Image" height="200px"/>
                    </v-col>
                    <v-col>
                      <div class="member-info-container">
                        <v-row>
                              <v-col cols="3">
                                <h4 class="member-info">닉네임</h4>
                              </v-col>
                              <v-col cols="9">
                                {{ workspaceMemberInfo.nickname }}
                              </v-col>
                            </v-row>
                            <v-row>
                              <v-col cols="3">
                                <h2 class="member-title">이름</h2>
                              </v-col>
                              <v-col cols="9">
                                {{ workspaceMemberInfo.memberName }}
                              </v-col>
                            </v-row>
                        
                        

                        <v-divider class="my-3"></v-divider>
                        
                        <div class="member-details">


                          <div class="info-item">
                            <v-row>
                              <v-col cols="3">
                                <v-icon>mdi-email-outline</v-icon>
                                <div class="member-info" style="margin-top: 5px;">이메일</div>
                              </v-col>
                              <v-col cols="9">
                                <div style="margin-top: 10px;">{{ workspaceMemberInfo.email }}</div>
                              </v-col>
                            </v-row>
                          </div>
               
                        <v-divider class="my-3"></v-divider>
   
                        <div>
                        
                          <div class="info-item">
                            <v-row>
                              <v-col cols="3">
                                <v-icon>mdi-domain</v-icon>
                                <div class="member-info" style="margin-top: 5px;">소속</div>
                              </v-col>
                              <v-col cols="9">
                                <div style="margin-top: 10px;">{{ workspaceMemberInfo.field }}</div>
                              </v-col>
                            </v-row>
                          </div>


                        <br>


                          <div class="info-item">
                            <v-row>
                              <v-col cols="3">
                                <v-icon>mdi-briefcase-outline</v-icon>
                                <div class="member-info" style="margin-top: 5px;">직급</div>
                              </v-col>
                              <v-col cols="9">
                                <div style="margin-top: 10px;">{{ workspaceMemberInfo.position }}</div>
                              </v-col>
                            </v-row>
                          </div>


                          <br>


                          <div class="info-item">
                            <v-row>
                              <v-col cols="3">
                                <v-icon>mdi-crown</v-icon>
                                <div class="member-info" style="margin-top: 5px;">등급</div>
                              </v-col>
                              <v-col cols="9">
                                <div style="margin-top: 10px;">{{ workspaceMemberInfo.wsRole }}</div>
                              </v-col>
                            </v-row>
                          </div>


                        </div>
                      </div>
                     </div>
                  </v-col>
                </v-row>
                </div>
            </v-col>
        </v-row>
        </v-card-text>


      <div v-if="this.getWsRole !== 'USER' && this.workspaceMemberInfo.wsRole !== 'PMANAGER'">
        <v-icon v-if="this.workspaceMemberInfo.wsRole === 'USER'" @click="changeRole(workspaceMemberInfo.workspaceMemberId)">mdi-account-arrow-up</v-icon>
        <v-icon v-if="this.workspaceMemberInfo.wsRole === 'SMANAGER'" @click="changeRole(workspaceMemberInfo.workspaceMemberId)">mdi-account-arrow-down</v-icon>
        <v-icon @click="removeMember(workspaceMemberInfo.workspaceMemberId)">mdi-account-remove</v-icon>
      </div>


      <v-btn class="" text="닫기" @click="workspaceMemberModal=false"></v-btn>
    
    
    </v-card>
   
    </v-dialog>

    <div v-if="isDropdownOpen" class="dropdown-menu" @click.stop>
      <ul>
        <li @click="(workspaceRoleDialog = true)">권한 변경하기</li>
        <li @click="removeMember()">회원 내보내기</li>
      </ul>
    </div>

  <v-dialog v-model="workspaceRoleDialog" width="auto" class="workspaceRoleDialog">
  <v-card max-width="400">
    <v-card-title>채널 회원 관리</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="changeRole">
              <v-select
                v-model="currentMemberRole"
                :items="roleOptions"
                item-title="text"
                item-value="value"
                dense
                outlined
                label="선택"
              ></v-select>
      <v-btn color="#3a8bcd" text="변경" type="submit"></v-btn>
      <v-btn text="닫기" @click="(workspaceRoleDialog = false)"></v-btn>
    </v-form>
      </v-card-text>
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
    ...mapGetters(["getWorkspaceId", "getWorkspaceMemberId", "getWorkspaceName", "getWsRole", "getProfileImage"]),
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
      isDropdownOpen: false, // 드롭다운 상태 관리
      workspaceRoleDialog: false,
      currentMemberRole: null,
      roleOptions: [
      { text: '워크스페이스 관리자', value: 'SMANAGER' },
      { text: '일반 회원', value: 'USER' },
    ],
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
    toggleDropdown() {
      // 드롭다운이 열리고 닫히는지 로그 확인
      console.log("Dropdown toggle");
      this.isDropdownOpen = !this.isDropdownOpen;
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

.member-title {
    font-size: 17px;
    text-align: left;
}

.member-info {
    color: #919191;
    padding-bottom: 0px;
    font-size: 12px;
}


</style>

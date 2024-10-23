<template>
<v-container class="memberview-container" style="margin: 0 0 0 0; padding: 0 0 0 0">

  <div class="memberview-header" style="margin: 20px; padding-left: 30px;">
    <h1>모든 회원</h1>
  </div>
  
  <div class="memberview-banner" style="background-color: #000435; color: white; padding: 50px; margin-top: 20px;">
    <br>
    <br>
    <p>팀 멤버를 COCONOTE에 참여시켜 더 나은 환경에서 작업할 수 있습니다. 이메일로 초대장을 보내거나 간단한 링크를 보내 공유할 수 있습니다.</p>
    <br>
    <v-btn @click="showMailSender" color="#3a8bcd" text="회원 초대"></v-btn>
    <br>
    <br>
  </div>
  
  <div class="memberview-memberlist" style="padding: 50px;">
    <v-row>
      <v-col v-for="member in workspaceMemberList" :key="member.workspaceMemberId" cols="2" md="2">
        <v-card @click="fetchWorkspaceMemberDetail(member.workspaceMemberId)" class="hover-card custom-padding-card">
          <img :src="member.profileImage && member.profileImage !== 'null' ? getProfileImage : require(`@/assets/images/profile/profile${member.workspaceMemberId % 10}.jpg`)" alt="Profile Image" style="height: 169px; width: 100%"/>
          <v-card-text class="member-info">{{ member.nickname || '별명 없음' }}</v-card-text>
          <v-card-title class="member-title">{{ member.memberName || '이름 없음' }}</v-card-title>
          <v-icon v-if="member.wsRole === 'PMANAGER'"  color='#ffbb00'>mdi-crown</v-icon>
          <v-icon v-if="member.wsRole === 'SMANAGER'"  color='#C0C0C0'>mdi-crown</v-icon>
            <v-icon v-if="member.wsRole === 'USER'" style="visibility: hidden;">mdi-crown</v-icon>
          </v-card>
      </v-col>
    </v-row>
  </div>
</v-container>
  

    <v-dialog v-model="workspaceMemberModal" max-width="600px" class="workspaceMemberModal">
       <v-card>
        <v-card-title class="text-h5">
          <h2>프로필 
          <v-icon color="grey" v-if="isMe(workspaceMemberInfo.workspaceMemberId)" @click="startEditing(workspaceMemberInfo)" size="20">mdi-cog</v-icon></h2>

        </v-card-title>
        <v-card-text>
            <v-row justify="center">
              <v-col cols="12">
                <div class="member-detail-container">
                  <v-row>
                    <v-col>
                      <img :src="workspaceMemberInfo.profileImage && workspaceMemberInfo.profileImage !== 'null' ? getProfileImage : require(`@/assets/images/profile/profile${this.memberImageId}.jpg`)" alt="Profile Image" height="200px"/>
                      
                      <div v-if="getWsRole !== 'USER' && workspaceMemberInfo.wsRole !== 'PMANAGER'">
                      <v-btn color="#3a8bcd" text="권한" @click="(workspaceRoleDialog = true)">
                      </v-btn>
                      <v-btn color="red" text="강퇴" @click="removeMember">
                      </v-btn>
                      </div>
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
                                <div  v-if="workspaceMemberInfo.wsRole === 'PMANAGER'" style="margin-top: 10px;">워크스페이스 최고 관리자</div>
                                <div  v-if="workspaceMemberInfo.wsRole === 'SMANAGER'" style="margin-top: 10px;">워크스페이스 관리자</div>
                                <div  v-if="workspaceMemberInfo.wsRole === 'USER'" style="margin-top: 10px;">일반 회원</div>
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

      <v-btn class="" text="닫기" @click="workspaceMemberModal=false"></v-btn>
    </v-card>

    </v-dialog>

  <v-dialog v-model="workspaceRoleDialog" width="auto" class="workspaceRoleDialog">
  <v-card max-width="400">
    <v-card-title>워크스페이스 회원 관리</v-card-title>
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
      workspaceMemberInfo: {},
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
      memberImageId : 0,
    profileNumber: null,
    };
  },
  methods: {
    ...mapActions([
      "setMemberInfoActions",
    ]),
    makeProfileNumber() {
      const getRandom = (min, max) => Math.floor(Math.random() * (max - min) + min);
      this.profileNumber = getRandom(1, 10);

    },
        handleClickOutside(event) {
      // 드롭다운 버튼을 클릭한 경우는 무시
      const dropdownToggle = this.$el.querySelector(".mdi-dots-vertical");
      const dropdown = this.$el.querySelector(".dropdown-menu");

      if (
        (dropdownToggle && dropdownToggle.contains(event.target)) ||
        (dropdown && dropdown.contains(event.target))
      ) {
        return;
      }

      this.isDropdownOpen = false;
    },
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
      console.log(this.workspaceMemberList);
    },
    async fetchWorkspaceMemberDetail(workspaceMemberId) {
  
      this.workspaceMemberModal = true;
      this.workspaceMemberInfo = {};
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/${workspaceMemberId}`);
      this.workspaceMemberInfo = response.data.result;
      this.memberImageId = this.workspaceMemberInfo.workspaceMemberId % 10;
      console.log("workspaceMemberInfo.workspaceMemberId 확인 >>>", workspaceMemberId);
      console.log("this.memberImageId >>>", this.memberImageId);
    },
    showMailSender() {
      this.sendMail = true;
    },
    isMe(workspaceMemberId) {
      console.log("is Me workspaceMemberInfo : ", this.workspaceMemberInfo)
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
    async changeRole() {
      try{
        await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/role`,
          {
            id: this.workspaceMemberInfo.workspaceMemberId,
            wsRole: this.currentMemberRole
          }
        );
        alert("권한이 변경되었습니다.");
        this.isDropdownOpen = false;
        this.workspaceRoleDialog = false;
        this.currentMemberRole = null;
        window.location.reload();
      } catch (e) {
        console.error("실패", e);
        alert("권한 변경에 실패했습니다.");
      }
    },
    async removeMember() {
      try{
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/workspace/member/delete/${this.workspaceMemberInfo.workspaceMemberId}`);        
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
.memberview-container {
  overflow-y: auto;
  height: 90vh;
  width: 100%;
}
.hover-card {
    transition: transform 0.2s ease;
    border-radius: 15px;
    width: 100%;
    display: flex;
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

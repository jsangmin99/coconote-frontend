<template>
  <v-dialog max-width="500px">
    <v-card>
      <v-card-title class="text-h5 text-center">
        워크스페이스 생성하기 </v-card-title
      ><br />
      <v-card-text>
        <v-form @submit.prevent="createWorkspace">
          <v-text-field
            label="name"
            v-model="name"
            required
          >
          </v-text-field>
          <v-text-field
            label="wsInfo"
            v-model="wsInfo"
            required
          >
          </v-text-field>
          <v-btn type="submit" color="blue">완료</v-btn>
          <v-btn color="grey" @click="closeModal">닫기</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios';
import { mapActions } from "vuex";

export default {
    data() {
        return {
            name:"",
            wsInfo:"",
        }
    },
    methods: {
      ...mapActions([
      "setWorkspaceInfoActions",
      "setWorkspaceNameInfoActions",
      "setMemberInfoActions",
      "setChannelInfoActions",
      "setChannelNameInfoActions",
      "setChannelDescInfoActions",
      "setChannelRoleInfoActions"
      
    ]),
        async createWorkspace() {
            const body = {
                name:this.name,
                wsInfo:this.wsInfo,
            }
            try {
                const wsInfo = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/workspace/create`, body);
                
                // 새로 만든 워크스페이스로 이동하는 로직
                this.setWorkspaceInfoActions(wsInfo.data.result.workspaceId);
                this.setWorkspaceNameInfoActions(wsInfo.data.result.name);
                const newWorkspaceId = wsInfo.data.result.workspaceId;

                const response = await axios.get( // 내 워크스페이스 회원 정보도 수정
                `${process.env.VUE_APP_API_BASE_URL}/member/me/workspace/${newWorkspaceId}`
                );
                const myInfo = {
                  nickname: response.data.result.nickname,
                  workspaceMemberId: response.data.result.workspaceMemberId,
                  profileImage: response.data.result.profileImage,
                  wsRole: response.data.result.wsRole,
                };
                this.setMemberInfoActions(myInfo);
        
                // const chInfo = await axios.get( // 채널 정보도 수정
                // `${process.env.VUE_APP_API_BASE_URL}/${newWorkspaceId}/channel/first` 
                // );
                // this.setChannelInfoActions(chInfo.data.result.channelId); 
                // this.setChannelNameInfoActions(chInfo.data.result.channelName);
                // this.setChannelDescInfoActions(chInfo.data.result.channelInfo);

                const chMember = await axios.get( // 채널 권한 정보
                `${process.env.VUE_APP_API_BASE_URL}/member/me/channel/${chInfo.data.result.channelId}` 
                );
                this.setChannelRoleInfoActions(chMember.data.result.channelRole);

                this.$emit('update:dialog', false);
                console.log("생성 후 workspace로 이동 예정 >> ", newWorkspaceId)
                window.location.href = "/workspace";
            } catch(e) {
                console.log(e);
            }
        },
        closeModal() {
            this.$emit('update:dialog', false);
        }
    }
}
</script>

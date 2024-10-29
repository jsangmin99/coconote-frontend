<template>
  <v-dialog max-width="500px">
    <v-card>
      <v-card-title class="text-h5 text-center">
        워크스페이스 회원 초대하기</v-card-title
      ><br />
      <v-card-text v-if="isLoading">
        <v-form @submit.prevent="sendMail">
          <v-text-field
            label="email"
            v-model="email"
            prepend-icon="mdi-email"
            type="email"
            required
          >
          </v-text-field>
          <v-btn type="submit" color="blue">전송</v-btn>
          <v-btn color="grey" @click="closeModal">닫기</v-btn>
        </v-form>
      </v-card-text>
      <v-card-text v-else style="width:100%; display:flex; align-items:center; font-size:14px; color:#69a0f2;">
        이메일을 전송 중 입니다.<br>
        잠시만 기다려 주세요.
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios'
export default {
  props: {
    selectedValue: {
      type: Number,
    }
  },
  data() {
      return {
          email:"",
          isLoading: true,
      }
  },
  methods: {
    async sendMail() {
      try {
        this.isLoading = false;
        const workspaceId = localStorage.getItem('workspaceId');
        if (!workspaceId) {
          throw new Error('Workspace ID is missing');
        }
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/workspace/${workspaceId}/invite?email=${this.email}`);
        this.$emit('update:dialog', false);
      } catch(e) {
        console.log(e);
      } finally {
        this.isLoading = true;
      }
    },
    closeModal() {
      this.$emit('update:dialog', false);
    }
  }
}
</script>

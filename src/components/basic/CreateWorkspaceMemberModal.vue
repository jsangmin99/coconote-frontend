<template>
  <v-dialog max-width="500px">
    <v-card>
      <v-card-title class="text-h5" style="padding: 24px; position: relative;">
          {{ getWorkspaceName }}(으)로 사용자 초대
        <v-icon @click="closeModal" class="close-button" style="position: absolute; top: 20px; right: 18px;">mdi-close</v-icon>
      </v-card-title>
      <v-card-subtitle style="margin: 8px;">
        초대 받을 사람:
      </v-card-subtitle>
      <v-card-text v-if="isLoading" style="padding-top: 3px;">
        
        <v-form @submit.prevent="sendMail">
          <v-text-field
            variant="outlined"
            placeholder="email"
            v-model="email"
            type="email"
            required
          >
          <template v-slot:prepend>
            <v-icon style="font-size: 40px;">mdi-email</v-icon>
          </template>
          <template v-slot:append>
            <v-icon style="font-size: 40px;" @click="sendMail">mdi-send</v-icon>
          </template>
          </v-text-field>
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
import { mapGetters } from 'vuex'

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
    computed: {
    ...mapGetters(["getWorkspaceName"])
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
        // //console.log(e);
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

<style scoped>

.invite-button-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 20px;
}

.invite-button {
  padding: 5px 10px;
  background-color: #3a8bcd;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.invite-button:hover {
  background-color: #3a8bcd;
}

</style>

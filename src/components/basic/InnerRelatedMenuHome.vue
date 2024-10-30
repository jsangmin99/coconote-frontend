<template>
  <v-navigation-drawer permanent class="innerSubMenu" :absolute="false">

    <!-- 워크스페이스 이름, 워크스페이스 관리 -->
    <div class="header-container" @contextmenu.prevent="showContextMenu($event, 'workspace', workpsace)">
      <h1>{{ this.getWorkspaceName }}</h1>
      <v-btn v-if="getWsRole !== 'USER'" elevation="0" icon color="#32446e" class="small-btn">
        <v-icon class="icon-cog">mdi-cog</v-icon>
        <v-menu activator="parent">
          <v-list>
            <v-list-item @click="startEditing(this.getWorkspaceId)">
              수정
            </v-list-item>
            <v-list-item v-if="getWsRole === 'PMANAGER'" @click="deleteWorkspace(this.getWorkspaceId)">
              삭제
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </div>

    <v-list>
      <!-- 즐겨찾기 -->
      <v-list-subheader class="section-title" @click="visibleBookmark=!visibleBookmark">
        <v-icon>{{ visibleBookmark ? "mdi-menu-down" : "mdi-menu-right" }}</v-icon>
        <v-icon icon="mdi-star" color="#ffbb00" />
        즐겨찾기
      </v-list-subheader>
      <v-list v-show="visibleBookmark">
        <v-list-item v-for="channel in myBookmarks" :key="channel.channelId" :class="{
          'selected-item': selectedChannelMenuId == channel.channelId,
        }" class="channel-item" @click="
          changeChannel(
            channel.channelId,
            channel.channelName,
            channel.channelInfo
          )
          " @contextmenu.prevent="showContextMenu($event, 'channel', channel)">
          <template v-if="channel.isPublic || isMember(channel.channelId)" v-slot:prepend>
            <v-icon v-if="!channel.isPublic" icon="mdi-lock"></v-icon>
            <v-icon v-else icon="mdi-apple-keyboard-command"></v-icon>
          </template>

          <v-list-item-title v-if="channel.isPublic || isMember(channel.channelId)">
            {{ channel.channelName }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      
      <!-- 섹션 -->
      <template v-for="section in sections" :key="section.sectionId">
        <div class="header-container">
          <v-list-subheader class="section-title" @click="toggleSection(section.sectionId)">
            <v-icon>{{ visibleSections.includes(section.sectionId) ? "mdi-menu-down" : "mdi-menu-right" }}</v-icon>
            <span class="section-name">{{ section.sectionName }}</span>

            <!-- 섹션 메뉴 -->
            <v-btn v-if="this.getWsRole !== 'USER'" elevation="0" icon color="#32446e"
              class="small-btn cog-btn"><!-- 관리자일 때만 표시 -->
              <v-icon class="icon-cog">mdi-cog</v-icon>
              <v-menu activator="parent" class="vList-sm">
                <v-list>
                  <v-list-item @click="openEditDialog(section)">수정</v-list-item> <!-- 수정 버튼 클릭 시 모달 열기 -->
                  <v-list-item @click="deleteSection(section.sectionId)">삭제</v-list-item>
                </v-list>
              </v-menu>
            </v-btn>
          </v-list-subheader>
        </div>

        <!-- 섹션 이름 수정 모달 -->
        <v-dialog v-model="editDialog" max-width="500px">
          <v-card>
            <v-card-title>
              <span>섹션 이름 수정</span>
            </v-card-title>
            <v-card-text>
              <!-- 새로운 섹션 이름 입력 -->
              <v-text-field v-model="editedSectionName" label="New Section Name" outlined
                :rules="nameRules"></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="editSection">저장</v-btn>
              <v-btn text @click="editDialog = false">취소</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- v-show: 섹션을 클릭하면 하위 채널 목록을 토글 -->
        <v-list v-show="visibleSections.includes(section.sectionId)">
          <v-list-item v-for="channel in filteredChannelList(section)" :key="channel.channelId"
            :class="{ 'selected-item': selectedChannelMenuId == channel.channelId, }" class="channel-item"
            @click="handleChannelClick(channel.channelId, channel.channelName, channel.channelInfo)"
            @contextmenu.prevent="showContextMenu($event, 'channel', channel)">
            <!-- 공개 여부 아이콘 -->
            <template v-slot:prepend>
              <v-icon v-if="!channel.isPublic" icon="mdi-lock"></v-icon>
              <v-icon v-else icon="mdi-apple-keyboard-command"></v-icon>
            </template>
            <!-- 채널 이름 -->
            <v-list-item-title>
              {{ channel.channelName }}
            </v-list-item-title>
            <!-- 알림 수와 삭제 버튼을 flex 컨테이너로 감쌈 -->
            <div class="notification-wrapper">
              <!-- 알림 수 표시 -->
              <v-badge v-if="unreadCounts[channel.channelId] > 0" :content="unreadCounts[channel.channelId]" color="red"
                overlap>
              </v-badge>
            </div>
          </v-list-item>

          <v-list-item class="channelCreate"
            @click="(channelDialog = true), (createChannelInfo.sectionId = section.sectionId)">
            <v-icon class="icon-plus" icon="mdi-plus" />
            채널생성
          </v-list-item>
        </v-list>
      </template>

      <!-- 섹션 생성 버튼 -->
      <v-list-subheader v-if="getWsRole !== 'USER'" class="section-title sectionCreate" @click="sectionDialog = true">
        <v-icon class="icon-plus" icon="mdi-plus" /> 섹션 생성
      </v-list-subheader>
    </v-list>
  </v-navigation-drawer>

  <!-- 채널 생성 모달 -->
  <v-dialog v-model="channelDialog" width="auto" class="channelDialog">
    <v-card max-width="400">
      <v-card-title> 채널 관리 </v-card-title>
      <v-card-text>
        <p>채널의 이름을 입력하세요.</p>
        <v-text-field ref="channelNameInput" color="primary" density="compact" variant="underlined"
          v-model="createChannelInfo.channelName" @keyup.enter="createChannel" placeholder="이름"
          :rules="nameRules"></v-text-field>
        <p>채널의 설명을 입력하세요.</p>
        <v-text-field color="primary" density="compact" variant="underlined" v-model="createChannelInfo.channelInfo"
          @keyup.enter="createChannel" placeholder="설명"></v-text-field>
        <v-radio-group inline label="채널종류" v-model="createChannelInfo.isPublic">
          <v-radio label="공개채널" value="1"></v-radio>
          <v-radio label="비공개 채널" value="0"></v-radio>
        </v-radio-group>
      </v-card-text>
      <template v-slot:actions>
        <v-btn class="" text="생성" @click="createChannel"></v-btn>
        <v-btn class="" text="닫기" @click="channelDialog = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>

  <!-- 섹션 생성 모달 -->
  <v-dialog v-model="sectionDialog" width="auto" class="sectionDialog">
    <v-card max-width="400">
      <v-card-title> 섹션 생성 </v-card-title>
      <v-card-text>
        섹션의 이름을 입력하세요.
        <v-text-field color="primary" density="compact" class="canvasTitle" variant="underlined"
          v-model="createSectionName" @keyup.enter="createSection" placeholder="이름" :rules="nameRules"></v-text-field>
      </v-card-text>
      <template v-slot:actions>
        <v-btn class="" text="생성" @click="createSection"></v-btn>
        <v-btn class="" text="닫기" @click="sectionDialog = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>
  <!-- 워크스페이스 수정 모달 -->
  <v-dialog v-model="workspaceEditModal" max-width="500px" class="workspaceEditModal">
    <v-card>
      <v-card-title class="text-h5 text-center">워크스페이스 정보 수정</v-card-title>
      <v-card-text>
        <v-list>
          <v-text-field v-model="editedName" placeholder="이름" :rules="nameRules"></v-text-field>
          <v-text-field v-model="editedWsInfo" placeholder="설명"></v-text-field>
        </v-list>
      </v-card-text>
      <v-btn text="수정" color="blue" @click="saveEditing(this.getWorkspaceId)"></v-btn>
    </v-card>
  </v-dialog>

  <!-- 우클릭 메뉴 -->
  <div v-if="contextMenuVisible" class="context-menu-leave"
    :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px`, }">
    <ul>
      <li v-if="selectedItemType === 'workspace'" @click="leaveWorkspace(this.getWorkspaceId)">
        워크스페이스 나가기
      </li>
      <li v-if="selectedItemType === 'channel'" @click="leaveChannel(selectedItem.channelId)">
        채널 나가기
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from "vuex";
import { fetchChannelMemberInfo } from "@/services/channelService";
// import { first } from '@tiptap/core/dist/packages/core/src/commands';

export default {
  props: {
    // workspaceId
    selectedValue: {
      type: Number,
    },
  },
  name: "InnerRelatedMenuHome",
  components: {},
  computed: {
    ...mapGetters([ // 'notifications'는 your store's namespace
      "getWorkspaceId",
      "getWorkspaceName",
      "getWsRole",
      "getChannelId", // 알림용 Vuex getter
      "allNotificationsVer"
    ]),
  },
  watch: {
    // 라우터 파라미터 channelId의 변화를 감지
    allNotificationsVer: {
      handler(newNotifications) {
        console.log('🍆🍆🍆🍆🍆🍆🍆 새로운 알림이 도착했습니다 :::::', newNotifications);
        // unreadCounts[channel.channelId]
        const lastNoti = newNotifications.notifications[newNotifications.notifications.length - 1];
        console.error(lastNoti)
        this.unreadCounts[lastNoti.channelId]++;
      },
      deep: true
    },
    getChannelId: {
      // immediate: true, // 처음 로딩 시에도 호출
      handler(newChannelId) {
        console.error("getChannelId handler");
        if (newChannelId != this.selectedChannelMenuId) {
          this.selectedChannelMenuId = newChannelId;
          this.changeChannel(newChannelId);
        }
      },
    },
    selectedValue(newWorkspaceId) {
      if (newWorkspaceId) {
        this.getSectionData(); // 섹션과 채널 데이터를 가져오는 메서드
      }
    },
    getWorkspaceId: {
      handler() {
        this.getSectionData();
        this.getMyBookmarks();
      },
      deep: true,
    },

  },
  created() {
    // this.selectedChannelMenuId = this.$route.params.channelId;
    this.fetchMyChannels();
  },
  mounted() {
    this.selectedChannelMenuId = this.$route.params.channelId;
    this.channelId = this.$route.params.channelId;
    console.error("channelIDs >> ", this.selectedChannelMenuId, this.channelId);

    this.getSectionData();
    this.getMyBookmarks();
    window.addEventListener("click", this.hideContextMenu);
  },
  beforeUnmount() {
    window.removeEventListener("click", this.hideContextMenu);
  },
  data() {
    return {
      sections: [],
      selectedMenuId: null,
      selectedChannelMenuId: null,
      sectionDialog: false,
      channelDialog: false,
      createSectionName: "",
      createChannelInfo: {
        sectionId: null,
        channelName: "",
        channelInfo: "",
        isPublic: "1",
      },
      workspaceEditModal: false,
      editedName: "",
      editedWsInfo: "",
      myChannels: [],
      nameRules: [
        (v) => !!v || "Name is required",
        (v) => (v && v.length >= 1) || "Name must be at least 1 characters",
      ],

      editDialog: false, // dialog 창 상태
      editedSectionId: null, // 수정 중인 섹션 ID
      editedSectionName: "", // 수정 중인 섹션 이름

      visibleBookmark: false,
      visibleSections: [], // 하위 채널을 보이는 섹션의 ID 저장

      channelId: null,
      myBookmarks: [],

      contextMenuVisible: false, // 우클릭 메뉴 표시 여부
      contextMenuPosition: { x: 0, y: 0 }, // 우클릭 메뉴 위치
      selectedItem: null, // 선택한 항목 (워크스페이스 또는 채널)
      selectedItemType: null, // 선택한 항목의 타입 ('workspace' 또는 'channel')
      clickedChannelId: null, // 클릭한 채널의 ID를 저장
      unreadCounts: {}, // 각 채널의 읽지 않은 알림 수를 저장

    };
  },
  methods: {

    ...mapActions([
      "setChannelInfoActions",
      "setChannelNameInfoActions",
      "setChannelDescInfoActions",
      "setChannelRoleInfoActions",
      "setWorkspaceInfoActions",
      "setWorkspaceNameInfoActions",
    ]),
    filteredChannelList(section) {
      if (this.getWsRole === 'PMANAGER' || this.getWsRole === 'SMANAGER') {
        return section.channelList;
      }
      // 해당 section의 채널 목록을 필터링하여 반환
      return section.channelList.filter(channel => channel.isPublic || this.isMember(channel.channelId));
    },

    async getSectionData() {
      try {
        if (
          !this.getWorkspaceId ||
          this.getWorkspaceId == undefined ||
          this.getWorkspaceId == ""
        ) {
          return false;
        }
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/section/list/${this.getWorkspaceId}`
        );
        this.sections = response.data.result;

        // 첫 번째 섹션과 채널이 존재하면 첫 번째 채널을 자동 선택
        if (
          this.sections.length > 0 &&
          this.sections[0].channelList.length > 0
        ) {
          const firstChannel = this.sections[0].channelList[0];
          this.channelId = firstChannel;
          this.changeChannel(
            firstChannel.channelId,
            firstChannel.channelName,
            firstChannel.channelInfo
          );
          this.visibleSections.push(this.sections[0].sectionId);
        }
        await this.fetchUnreadCounts();

        // this.getChannelMemberInfo(this.channelId);
      } catch (error) {
        console.log(error);
      }
    },
    // 모든 채널의 읽지 않은 알림 수를 병렬로 가져오는 메서드
    async fetchUnreadCounts() {
      try {
        const requests = [];

        // 각 채널의 알림 수를 가져오는 요청을 배열에 추가
        this.sections.forEach(section => {
          section.channelList.forEach(channel => {
            const request = axios.get(
              `${process.env.VUE_APP_API_BASE_URL}/notifications/unread/count/${channel.channelId}`
            ).then(response => {
              // 각 채널의 알림 수를 unreadCounts 객체에 저장
              this.unreadCounts[channel.channelId] = response.data;
            });
            requests.push(request);
          });
        });

        // 모든 요청을 병렬로 실행
        await Promise.all(requests);
      } catch (error) {
        console.log(error);
      }
    },
    async removeUnreadCount(channelId) {
      if (this.unreadCounts && this.unreadCounts[channelId] !== undefined) {
        this.unreadCounts[channelId] = 0;
      }

      try {
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/notifications/mark-as-read/${channelId}`
        );
      } catch (error) {
        console.error("Failed to remove unread count:", error);
      }
    },
    // async getChannelMemberInfo(id) {
    //   const chMember = await axios.get( // 채널 권한 정보
    //   ${process.env.VUE_APP_API_BASE_URL}/member/me/channel/${id}
    //   );
    //   this.changeChannelMemberInfo(chMember.data.result.channelRole);

    // },
    async handleChannelClick(id, name, desc) {
      this.removeUnreadCount(localStorage.getItem("channelId"));
      this.selectedChannelMenuId = id;
      this.setChannelInfoActions(id);
      this.setChannelNameInfoActions(name);
      this.setChannelDescInfoActions(desc);


      this.removeUnreadCount(id);

      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/channel/${id}/isjoin`
      );

      const isJoin = response.data.result;

      if (isJoin) {
        const result = await fetchChannelMemberInfo(id);
        if (result) {
          this.setChannelRoleInfoActions(result.channelRole);
        }
        this.$router.push(`/channel/${id}/thread/view`);
      } else {
        this.setChannelRoleInfoActions(null);
        // this.$router.push(`/channel/${id}`);
        this.$router.push({
          path: `/channel/${id}`,
          query: { isJoin: false },
        });
      }
    },
    async changeChannel(id, name, desc) {
      if (id == this.selectedChannelMenuId) {
        return false;
      }
      if (id) {
        console.log ("[InnerRelatedMenuHome] changeChannel().id : ", id);
        this.removeUnreadCount(localStorage.getItem("channelId"));

        this.selectedChannelMenuId = id;
        this.setChannelInfoActions(id);
        this.setChannelNameInfoActions(name);
        this.setChannelDescInfoActions(desc);

        this.removeUnreadCount(id);

        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/channel/${id}/isjoin`
        );

        const isJoin = response.data.result;
        console.error("is Join 작동 >> ", isJoin);
        if (isJoin) {
          console.error("is Join 작동 2222 >> ");
          const result = await fetchChannelMemberInfo(id);
          if (result) {
            this.setChannelRoleInfoActions(result.channelRole);
          }
          this.$router.push(`/channel/${id}/thread/view`);
        } else {
          console.error("is Join 작동 33333 >> ");
          this.setChannelRoleInfoActions(null);
          this.$router.push(`/channel/${id}`);
        }
      }
    },
    async changeChannelMemberInfo(role) {
      this.setChannelRoleInfoActions(role);
    },
    async createSection() {
      if (this.createSectionName.length == 0) {
        return;
      }
      try {
        const data = {
          workspaceId: this.getWorkspaceId,
          sectionName: this.createSectionName,
        };
        await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/section/create`,
          data
        );
        this.sectionDialog = false;
        this.getSectionData();
      } catch (error) {
        console.log(error);
      }
    },
    async createChannel() {
      if (this.createChannelInfo.channelName.length == 0) {
        return;
      }
      const data = {
        sectionId: this.createChannelInfo.sectionId,
        channelName: this.createChannelInfo.channelName,
        channelInfo: this.createChannelInfo.channelInfo,
        isPublic: Number(this.createChannelInfo.isPublic),
      };
      if (data.channelName == "") {
        alert("channel 이름은 반드시 입력해주세요.");
        this.$refs.channelNameInput.focus();
        return false;
      }
      try {
        const response1 = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/channel/create`,
          data
        );
        const createdChannel = response1.data.result;
        this.channelDialog = false;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/section/list/${this.getWorkspaceId}`
        );
        this.sections = response.data.result;
        this.changeChannel(
          createdChannel.channelId,
          createdChannel.channelName,
          createdChannel.channelInfo
        );
        // this.getSectionData();
      } catch (error) {
        console.log(error);
      }
    },
    async startEditing(workspaceId) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/info/${workspaceId}`
        );
        this.editedName = response.data.result.name;
        this.editedWsInfo = response.data.result.wsInfo;
        this.workspaceEditModal = true;
      } catch (error) {
        console.log(error);
      }
    },
    async saveEditing(workspaceId) {
      if (this.editedName.length == 0) {
        return;
      }
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/update/${workspaceId}`,
          {
            name: this.editedName,
            wsInfo: this.editedWsInfo,
          }
        );
        this.setWorkspaceNameInfoActions(this.editedName);
        alert("워크스페이스 정보가 수정되었습니다.");
        this.workspaceEditModal = false;
        window.location.reload();
      } catch (error) {
        console.log(error);
      }
    },
    async deleteWorkspace(workspaceId) {
      try {
        if (window.confirm("워크스페이스를 삭제하시겠습니까?")) {
          // "예" 선택
          await axios.delete(
            `${process.env.VUE_APP_API_BASE_URL}/workspace/delete/${workspaceId}`
          );
          alert("워크스페이스가 삭제되었습니다.");
          const noDeleteLsKey = ["accessToken", "refreshToken"]; //삭제하면 안되는 localStorage 값
          for (var key in localStorage) {
            if (!noDeleteLsKey.includes(key)) {
              localStorage.removeItem(key);
            }
          }
          window.location.href = "/workspace";
        } else {
          // "아니오" 선택
          console.log("작업이 취소되었습니다.");
        }
      } catch (error) {
        console.log(error);
      }
    },
    async editSection() {
      if (this.editedSectionName.length == 0) {
        return;
      }
      try {
        const response = await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/section/update/${this.editedSectionId}`,
          {
            sectionName: this.editedSectionName,
          }
        );
        this.editDialog = false;
        this.getSectionData(); // 섹션 데이터 다시 불러오기 (수정 후 최신 데이터 반영)
        console.log("수정 성공:", response.data.result);
      } catch (error) {
        console.error("수정 실패:", error);
      }
    },
    async deleteSection(sectionId) {
      try {
        const response = await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/section/delete/${sectionId}`
        );
        this.getSectionData(); // 섹션 데이터 다시 불러오기 (수정 후 최신 데이터 반영)
        console.log("삭제 성공:", response.data);
      } catch (error) {
        console.error("삭제 실패:", error);
      }
    },
    async fetchMyChannels() {
      try {
        console.log(
          "[InnerRelatedMenuHome] fetchMyChnaaels()./member/me/workspace/this.getWorkspaceId : ",
          this.getWorkspaceId
        );
        if (
          !this.getWorkspaceId ||
          this.getWorkspaceId == undefined ||
          this.getWorkspaceId == ""
        ) {
          return false;
        }
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/member/me/workspace/${this.getWorkspaceId}`
        );
        this.myChannels = response.data.result.channels;
      } catch (error) {
        console.log(error);
      }
    },
    isMember(id) {
      this.myChannels.some((channel) => channel === id);
      console.log("내가 속한 채널들 확인", this.myChannels);
      return this.myChannels.some((channel) => channel === id);
    },
    // 수정 다이얼로그 열기
    openEditDialog(section) {
      this.editedSectionId = section.sectionId; // 수정할 섹션 ID 저장
      this.editedSectionName = section.sectionName; // 수정할 섹션 이름 저장
      this.editDialog = true; // dialog 열기
    },
    // 섹션의 하위 채널을 토글
    toggleSection(sectionId) {
      if (this.visibleSections.includes(sectionId)) {
        this.visibleSections = this.visibleSections.filter(
          (id) => id !== sectionId
        ); // 이미 보이는 섹션을 클릭하면 숨기기
      } else {
        this.visibleSections.push(sectionId); // 안 보이는 섹션을 클릭하면 보이기
      }
    },
    async getMyBookmarks() {
      try {
        if (this.getWorkspaceId) {
          const response = await axios.get(
            `${process.env.VUE_APP_API_BASE_URL}/bookmark/${this.getWorkspaceId}`
          );
          this.myBookmarks = response.data.result;
        }
      } catch (error) {
        console.log(error);
      }
    },
    // 우클릭 메뉴 보이기
    showContextMenu(event, type, item) {
      event.preventDefault(); // 기본 우클릭 메뉴를 방지
      this.contextMenuVisible = false; // 기존 메뉴 숨기기
      this.contextMenuPosition = { x: event.clientX, y: event.clientY };
      this.selectedItem = item;
      this.selectedItemType = type;

      // DOM 업데이트 후 메뉴가 보이도록 $nextTick 사용
      this.$nextTick(() => {
        this.contextMenuVisible = true;
      });
    },
    // 우클릭 메뉴 숨기기
    hideContextMenu() {
      this.contextMenuVisible = false;
      this.selectedItem = null;
      this.selectedItemType = null;
    },
    async leaveWorkspace(workspaceId) {
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/workspace/${workspaceId}/member/leave`
        );
        alert("워크스페이스에서 나갔습니다.");
        this.$router.push("/workspace").then(() => {
          location.reload(); // URL 변경 후 페이지 새로고침
        });
      } catch (error) {
        console.log(error);
      }
    },
    async leaveChannel(channelId) {
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/channel/${channelId}/member/leave`
        );
        this.$router.push("/workspace").then(() => {
          location.reload(); // URL 변경 후 페이지 새로고침
        });
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/innerRelated.scss";
/* SCSS 파일을 불러오기 */
</style>

<style lang="scss">
.section-title {
  cursor: pointer;

  >* {
    display: flex;
    flex-direction: row;
    align-items: center;

    .cog-btn {
      margin-left: 4px;
    }
  }

  &.sectionCreate &.v-list-subheader {
    cursor: pointer;
    background-color: #2f3653;
    padding: 4px !important;
    border-radius: 8px;
    min-height: auto !important;

    &:hover {
      background-color: #6c759c;
    }
  }

  .icon-cog {
    font-size: 0.8rem !important;
    opacity: 0.5;
  }
}

.section-title:hover {
  background-color: rgba(255, 255, 255, 0.05);
  /* 검정색을 10% 투명도로 표현 */
  border-radius: 10px;
  /* 모서리를 둥글게 설정 */
  // color: rgba(0, 0, 0, 0.7); /* 텍스트 색도 약간 투명하게 설정 */
}

.header-container {
  display: flex;
  align-items: center;
  >button{
    display: flex;
    font-size: 10px;
  }
  /* 텍스트와 버튼의 수직 정렬을 맞춤 */
}

h1 {
  margin: 0;
  /* 기본적으로 여백을 제거해 정렬을 더 깔끔하게 */
}

/* 폰트 크기에 비례한 버튼 크기 설정 */
.small-btn {
  min-width: 1em !important;
  width: 1em !important;
  height: 1em !important;
  padding: 0 !important;
  /* 여백 제거 */
  margin-left: 5px !important;
}

.section-name {
  font-size: 0.7rem;
  /* 원하는 폰트 크기로 설정 */
}

.channelCreate {
  font-size: 0.9rem;
  background-color: #3c4670;
}

.context-menu-leave {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10000;
}

.context-menu-leave ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.context-menu-leave li {
  padding: 10px;
  cursor: pointer;
}

.context-menu-leave li:hover {
  background-color: #eee;
}

.channel-item {
  position: relative;

  .notification-wrapper {
    position: absolute;
    right: 12px;
    top: 0;
    font-size: 8px;
    transform: translate(50%, 50%);
  }
}
</style>
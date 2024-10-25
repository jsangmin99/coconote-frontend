import axios from "axios";
import { mapActions } from "vuex";
export default {
	methods: {
		...mapActions([
			"setMemberInfoActions", // Vuex 액션 등록
		]),

		// 프로필 정보 요청
		async fetchProfileData() {
			if (!this.workspaceMemberId) {
				console.error("workspaceMemberId가 없습니다.");
				return;
			}

			try {
				const response = await axios.get(
					`${process.env.VUE_APP_API_BASE_URL}/workspace/member/${this.workspaceMemberId}`
				);

				if (response.data.result) {
					// 서버로부터 받은 데이터를 profileData에 저장
					const result = response.data.result;
					this.profileData.nickname = result.nickname;
					this.profileData.memberName = result.memberName;
					this.profileData.position = result.position;
					this.profileData.wsRole = result.wsRole;
					this.profileData.field = result.field;
					if (!this.profileData.profileImage) {
						this.profileData.profileImage = result.profileImage;
					}
				}
			} catch (error) {
				console.error("Error fetching profile data:", error);
			}
		},

		triggerFileInput() {
			this.$refs.fileInput.click();
		},

		// 파일 선택 시 호출되는 메소드
		async onFileSelected(event) {
			// 파일 선택 확인
			if (
				!event ||
				!event.target ||
				!event.target.files ||
				event.target.files.length === 0
			) {
				console.error("No file selected or event is invalid.");
				return;
			}

			// 이전 미리보기 URL을 해제하여 메모리 누수 방지
			if (this.previewImage) {
				URL.revokeObjectURL(this.previewImage);
			}

			// 파일 정보 추출 및 디버깅 로그
			const selectedFile = event.target.files[0]; // Event 객체에서 파일 추출

			// 브라우저에서 미리보기 이미지 생성
			this.previewImage = URL.createObjectURL(selectedFile);
			this.selectedFile = selectedFile; // 나중에 저장할 파일
		},

		// 프로필 정보 저장 (서버로 업데이트 요청)
		async saveProfile() {
			if (!this.workspaceMemberId) {
				console.error("workspaceMemberId가 없습니다.");
				return;
			}

			if (this.$refs.form.validate()) {
				try {
					let fileUrl = this.profileData.profileImage; // 기존 profileImage를 유지

					// 파일이 선택된 경우 presigned URL 요청 후 파일 업로드
					if (this.selectedFile) {
						const fileRequest = [
							{
								fileName: this.selectedFile.name,
								fileSize: this.selectedFile.size,
							},
						];

						const response = await axios.post(
							`${process.env.VUE_APP_API_BASE_URL}/files/presigned-urls`,
							fileRequest
						);

						const result = response.data.result;
						const presignedUrl = Object.values(result)[0];

						// S3에 파일 업로드
						await axios.put(presignedUrl, this.selectedFile, {
							headers: {
								"Content-Type": this.selectedFile.type,
							},
						});

						// 업로드된 파일의 URL 추출
						fileUrl = presignedUrl.split("?")[0];
					}

					// 프로필 데이터 업데이트 시 파일 URL 설정
					this.profileData.profileImage = fileUrl;

					// 프로필 업데이트 요청
					const updateResponse = await axios.patch(
						`${process.env.VUE_APP_API_BASE_URL}/workspace/member/update/${this.workspaceMemberId}`,
						this.profileData
					);

					const memberInfo = {
						workspaceMemberId:
							updateResponse.data.result.workspaceMemberId,
						profileImage: updateResponse.data.result.profileImage,
						nickname: updateResponse.data.result.nickname,
						name: updateResponse.data.result.name,
					};

					this.setMemberInfoActions(memberInfo);
					localStorage.setItem("nickname", memberInfo.nickname);
					localStorage.setItem(
						"profileImage",
						memberInfo.profileImage
					);

					// 이후 업로드가 완료되면
					URL.revokeObjectURL(this.previewImage);

					console.log("Profile updated and localStorage set.");
				} catch (error) {
					console.error("Error updating profile:", error);
				}
			}
			this.cancel();
		},

		async cancel() {
            const response = await axios.get(
                `${process.env.VUE_APP_API_BASE_URL}/${this.$store.getters.getWorkspaceId}/channel/first`
			);
			this.$router.push(`/channel/${response.data.result.channelId}`);
		},
	},
};

import axios from 'axios';

/**
 * 채널 북마크 상태를 가져오는 함수
 * @param {number|string} channelId - 확인하려는 채널의 ID
 * @returns {Object|null} - 성공 시 `response.data.result`, 실패 시 null 반환
 */
export async function fetchChannelMemberInfo(channelId) {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/member/me/channel/${channelId}`);
    return response.data.result; // 성공 시 결과 반환
  } catch (error) {
    // console.error('채널 북마크 상태를 가져오는 중 오류 발생: ', error);
    return null; // 실패 시 null 반환
  }
}

import mitt from 'mitt';
// vue3 환경에서 vue2 버전의 이벤트 버스 사용을 위한 mitt 설정으로 변경
export const EventBus = mitt();
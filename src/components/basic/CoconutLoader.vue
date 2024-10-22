<template>
    <div class="loader-container">
      <svg
        :width="props.size"
        :height="props.size"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g :transform="'translate(' + position + ', 50)'">
          <circle cx="0" cy="0" r="20" fill="#4A3728" />
          <circle cx="-5" cy="-5" r="3" fill="#2A1F18" />
          <circle cx="5" cy="-5" r="3" fill="#2A1F18" />
          <circle cx="0" cy="5" r="3" fill="#2A1F18" />
          <path d="M-15,-5 Q-10,0 -15,5" stroke="#3A2A1E" fill="none" stroke-width="1" />
          <path d="M15,-5 Q10,0 15,5" stroke="#3A2A1E" fill="none" stroke-width="1" />
        </g>
        <ellipse
          cx="50"
          cy="80"
          rx="20"
          ry="5"
          fill="#00000033"
          :transform="'translate(' + shadowOffset + ', 0)'"
        />
      </svg>
      <div v-if="props.showText" class="loading-text">
        {{ props.loadingText }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  
  // eslint-disable-next-line no-undef
  const props = defineProps({
    size: {
      type: Number,
      default: 100
    },
    showText: {
      type: Boolean,
      default: true
    },
    loadingText: {
      type: String,
      default: 'Loading...'
    }
  });
  
  const position = ref(0);
  const shadowOffset = ref(0);
  let animationFrame = null;
  let startTime = null;
  
  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / 1000;
  
    position.value = 50 + Math.sin(progress * 2) * 30;
    shadowOffset.value = Math.sin(progress * 2) * 30;
  
    animationFrame = requestAnimationFrame(animate);
  };
  
  onMounted(() => {
    animationFrame = requestAnimationFrame(animate);
  });
  
  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
  </script>
  
  <style scoped>
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .loading-text {
    margin-top: 1rem;
    font-size: 1.1rem;
    color: #666;
  }
  </style>
  
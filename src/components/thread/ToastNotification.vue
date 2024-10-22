<!-- src/components/ToastNotification.vue -->
<template>
    <div>
        <div class="toast-channel-name">{{ channelName }}</div>
        <div class="toast-member-name">{{ memberName }}</div>
        <div class="toast-message">{{ message }}</div>
    </div>
</template>

<script>
export default {
    props: {
        channelName: {
            type: String,
            required: true,
        },
        memberName: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },
};
</script>

<style scoped>
.toast-channel-name {
    font-weight: bold;
    font-size: 14px;
    color: #37508c;
    margin-bottom: 4px;
}

.toast-member-name {
    font-weight: 500;
    font-size: 12px;
    color: #000000;
    margin-bottom: 4px;
}

.toast-message {
    font-size: 13px;
    color: #000000;
}
</style>

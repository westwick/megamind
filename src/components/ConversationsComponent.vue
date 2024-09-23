<template>
    <div class="conversations">
        <h2>Conversations</h2>
        <ul>
            <li v-for="conversation in conversations" :key="conversation.id"
                :class="getConversationClass(conversation.type)">
                [{{ conversation.type }}] {{ conversation.sender }}: {{ conversation.message }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const conversations = ref([]);
const { proxy } = getCurrentInstance();

onMounted(() => {
    proxy.$eventBus.on('conversation', handleNewConversation);
});

onUnmounted(() => {
    proxy.$eventBus.off('conversation', handleNewConversation);
});

function handleNewConversation(conversation) {
    console.log('[ConversationComponent]New conversation:', conversation);
    conversations.value.push(conversation);
}

function getConversationClass(type) {
    switch (type) {
        case 'broadcast':
            return 'text-yellow-300';
        case 'gossip':
            return 'text-purple-400';
        case 'telepath':
            return 'text-white';
        case 'gangpath':
            return 'text-amber-700';
        default:
            return 'text-gray-400';
    }
}
</script>

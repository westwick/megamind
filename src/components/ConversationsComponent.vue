<template>
  <div class="conversations">
    <h2 class="text-center uppercase text-gray-500 text-xs">Conversations</h2>
    <ul>
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
        :class="getConversationClass(conversation.type)"
      >
        <span class="text-gray-500">{{
          formatTimestamp(conversation.timestamp)
        }}</span>
        {{ formatMessage(conversation) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from "vue";

const conversations = ref([]);
const { proxy } = getCurrentInstance();

onMounted(() => {
  proxy.$eventBus.on("conversation", handleNewConversation);
});

function handleNewConversation(conversation) {
  console.log("[ConversationComponent]New conversation:", conversation);
  conversations.value.push(conversation);
}

function getConversationClass(type) {
  switch (type) {
    case "broadcast":
    case "page":
      return "text-yellow-300";
    case "gossip":
      return "text-purple-400";
    case "telepath":
      return "text-white";
    case "gangpath":
      return "text-amber-700";
    case "local":
      return "text-green-600";
    case "realm_enter":
    case "realm_leave":
      return "text-gray-300";
    case "realm_disconnect":
      return "text-gray-100";
    default:
      return "text-gray-600";
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMessage(conversation) {
  const { type, sender, recipient, message, username, action } = conversation;
  switch (type) {
    case "telepath":
      return `${sender} telepaths: ${message}`;
    case "gangpath":
      return `${sender} gangpaths: ${message}`;
    case "gossip":
      return `${sender} gossips: ${message}`;
    case "auction":
      return `${sender} auctions: ${message}`;
    case "broadcast":
      return `Broadcast from ${sender} "${message}"`;
    case "page":
      return `${sender} is paging you: ${message}`;
    case "local":
      if (sender === "You") {
        return `You say "${message}"`;
      } else if (recipient) {
        return `${sender} says (to ${recipient}) "${message}"`;
      } else {
        return `${sender} says "${message}"`;
      }
    case "realm_enter":
      return `${username} just entered the Realm.`;
    case "realm_leave":
      return `${username} just left the Realm.`;
    case "realm_disconnect":
      return `${username} just ${
        action === "disconnected" ? "disconnected!!!" : "hung up!!!"
      }`;
    default:
      return `${sender}: ${message}`;
  }
}
</script>

<style>
.conversations {
  overflow-y: scroll;
  height: 640px;
  width: 100%;
}
</style>

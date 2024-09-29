<template>
  <div id="main-container">
    <TopBar />
    <div class="flex w-full">
      <div id="terminal"></div>
      <div class="text-white flex-grow">
        <ConversationsComponent />
      </div>
    </div>
    <input
      v-model="inputText"
      @keyup.enter="sendData"
      type="text"
      class="main-input w-full bg-gray-800 text-white border-gray-700 p-1 focus:outline-none focus:border-blue-500"
      placeholder=""
    />
    <DebugComponent />
  </div>
</template>

<script setup>
// import { onMounted } from "vue";
// import { useStore } from "vuex";
import ConversationsComponent from "./components/ConversationsComponent.vue";
import TopBar from "./components/TopBar.vue";
import DebugComponent from "./components/DebugComponent.vue";
import { ref } from "vue";

const store = useStore();

const inputText = ref("");

// onMounted(() => {
//   store.dispatch("playerConfig/loadConfig");
// });

const sendData = () => {
  if (inputText.value.trim()) {
    window.electronAPI.sendData(inputText.value + "\r");
    inputText.value = "";
  }
};
</script>

<style>
.main-input {
  border: 1px solid #424242;
}
</style>

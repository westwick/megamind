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
      @keydown="handleInputKeydown"
      type="text"
      class="main-input w-full bg-gray-800 text-white border-gray-700 p-1 focus:outline-none focus:border-blue-500"
      placeholder=""
    />
    <DebugComponent />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useStore } from "vuex";
import ConversationsComponent from "./components/ConversationsComponent.vue";
import TopBar from "./components/TopBar.vue";
import DebugComponent from "./components/DebugComponent.vue";
import { ref } from "vue";

const store = useStore();

const inputText = ref("");

onMounted(() => {
  store.dispatch("playerConfig/loadConfig");
});

const sendData = () => {
  if (inputText.value.trim()) {
    window.electronAPI.sendData(inputText.value + "\r");
    inputText.value = "";
  }
};

const handleInputKeydown = (event) => {
  if (event.code.startsWith("Numpad")) {
    event.preventDefault(); // Prevent the numpad key from appearing in input
    const numpadKey = event.code.replace("Numpad", "");
    let command = "";

    switch (numpadKey) {
      case "8":
        command = "n";
        break;
      case "2":
        command = "s";
        break;
      case "4":
        command = "w";
        break;
      case "6":
        command = "e";
        break;
      case "7":
        command = "nw";
        break;
      case "9":
        command = "ne";
        break;
      case "1":
        command = "sw";
        break;
      case "3":
        command = "se";
        break;
      case "5":
        command = "look";
        break;
      default:
        return;
    }

    window.electronAPI.sendData(command + "\r");
  }
};
</script>

<style>
.main-input {
  border: 1px solid #424242;
}
</style>

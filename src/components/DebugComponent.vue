<template>
  <div id="debugger" class="flex flex-row justify-between text-white">
    <div class="flex-1 p-2">
      <p class="text-center">Room Info</p>
      <pre>{{ roomInfo }}</pre>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Online Users</p>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Player Stats</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const roomInfo = ref("init");

onMounted(() => {
  window.electronAPI.onNewRoom((event, info) => {
    roomInfo.value = JSON.stringify(info, null, 2);
  });
});
</script>

<style scoped>
#debugger {
  background: #1f1e1e;
}

pre {
  color: #5adf5a;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-y: scroll;
  height: 400px;
}
</style>

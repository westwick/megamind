<template>
  <div id="debugger" class="flex flex-row justify-between text-white">
    <div class="flex-1 p-2">
      <p class="text-center">Room Info</p>
      <pre>{{ roomInfo }}</pre>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Online Users</p>
      <pre>{{ onlineUsers }}</pre>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Player Stats</p>
      <pre>{{ playerStats }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { mapState } from "vuex";

const storeState = mapState({
  roomInfo: (state) => state.game.roomInfo,
  onlineUsers: (state) => state.game.onlineUsers,
  playerStats: (state) => state.game.playerStats,
});

const roomInfo = computed(() =>
  JSON.stringify(storeState.roomInfo.value, null, 2)
);
const onlineUsers = computed(() =>
  JSON.stringify(storeState.onlineUsers.value, null, 2)
);
const playerStats = computed(() =>
  JSON.stringify(storeState.playerStats.value, null, 2)
);
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

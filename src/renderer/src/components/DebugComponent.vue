<template>
  <div id="debugger" class="flex flex-row justify-between text-white">
    <div class="flex-1 p-2">
      <p class="text-center">Game State</p>
      <pre>{{ gameStateString }}</pre>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Online Users</p>
      <pre>{{ onlineUsersString }}</pre>
    </div>
    <div class="flex-1 p-2">
      <p class="text-center">Player Stats</p>
      <pre>{{ playerStatsString }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const roomInfo = computed(() => store.state.game.roomInfo);
const onlineUsers = computed(() => store.state.game.onlineUsers);
const playerStats = computed(() => store.state.game.playerStats);
const gameState = computed(() => store.state.game.gameState);

const roomInfoString = computed(() => JSON.stringify(roomInfo.value, null, 2));
const onlineUsersString = computed(() =>
  JSON.stringify(onlineUsers.value, null, 2)
);
const playerStatsString = computed(() =>
  JSON.stringify(playerStats.value, null, 2)
);
const gameStateString = computed(() =>
  JSON.stringify(gameState.value, null, 2)
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

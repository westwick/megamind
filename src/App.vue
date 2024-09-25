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
      type="text"
      class="main-input w-full bg-gray-800 text-white border-gray-700 p-1 focus:outline-none focus:border-blue-500"
      placeholder=""
    />
    <div id="debugger">
      <div id="debug-info"></div>
      <div id="room-info"><pre>init</pre></div>
      <div id="online-users"></div>
      <div id="player-stats"></div>
    </div>
  </div>
</template>

<script setup>
import ConversationsComponent from "./components/ConversationsComponent.vue";
import TopBar from "./components/TopBar.vue";
</script>

<style>
.main-input {
  border: 1px solid #424242;
}
</style>

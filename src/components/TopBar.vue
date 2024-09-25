<template>
  <div class="relative">
    <div class="topbar">
      <div class="flex items-center space-x-2">
        <div class="icon-container" title="Connect to server">
          <PlugZap class="icon" fill="yellow" />
        </div>
        <div class="icon-container" title="Auto-Combat">
          <Swords class="icon" fill="orange" />
        </div>
        <div class="icon-container" title="Auto-Heal/Rest">
          <Cross class="icon" fill="red" />
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <div
          class="icon-container"
          :class="{ active: isSettingsOpen }"
          title="Settings"
          @click="toggleSettings"
        >
          <User class="icon" />
        </div>
      </div>
    </div>
    <Transition name="slide">
      <div v-if="isSettingsOpen" class="settings-area">
        <!-- Settings content will go here -->
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { PlugZap, Swords, Cross, User } from "lucide-vue-next";

const isSettingsOpen = ref(false);

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value;
};
</script>

<style scoped>
.topbar {
  @apply w-full h-10 bg-zinc-900 border-b border-gray-800 flex justify-between items-center px-1 text-gray-400;
  position: relative;
  z-index: 10;
}

.icon-container {
  @apply p-1 rounded-sm border border-gray-700 hover:border-gray-500 hover:text-gray-200 cursor-pointer;
}

.icon {
  @apply w-5 h-5;
}

.icon-container.active {
  @apply border-gray-500 text-gray-200 bg-gray-800;
}

.settings-area {
  @apply w-full bg-zinc-800 border-b border-gray-700;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 200px;
  z-index: 9;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

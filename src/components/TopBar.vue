<template>
  <div class="relative">
    <div class="topbar">
      <div class="flex items-center">
        <div
          class="icon-container"
          :class="{ 'icon-active': isConnectedToServer }"
          title="Connect to server"
          @click="connectToServer"
        >
          <PlugZap class="icon" :fill="isConnectedToServer ? 'yellow' : ''" />
        </div>
        <div class="separator"></div>
        <div class="icon-container" title="Go to location">
          <MoveUpRight class="icon" fill="" />
        </div>
        <div class="icon-container" title="Loop an area">
          <Repeat class="icon" fill="" />
        </div>
        <div class="icon-container" title="Step backwards">
          <UndoDot class="icon" fill="" />
        </div>
        <div class="icon-container icon-active" title="Stop moving">
          <Octagon class="icon" fill="rgba(100, 0, 0, 0.2)" />
        </div>
        <div class="separator"></div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoAll }"
          title="Toggle all auto-actions"
          @click="toggleAutoAll"
        >
          <Power class="icon" fill="rgba(0, 0, 0, 0)" />
        </div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoCombat }"
          title="Auto-Combat"
          @click="toggleAutoAction('autoCombat')"
        >
          <Swords class="icon" :fill="autoCombat ? 'red' : ''" />
        </div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoHeal }"
          title="Auto-Heal/Rest"
          @click="toggleAutoAction('autoHeal')"
        >
          <Cross class="icon" :fill="autoHeal ? 'green' : ''" />
        </div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoBless }"
          title="Auto-Bless"
          @click="toggleAutoAction('autoBless')"
        >
          <Sparkles class="icon" :fill="autoBless ? 'blue' : ''" />
        </div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoGet }"
          title="Auto-Get"
          @click="toggleAutoAction('autoGet')"
        >
          <Hand class="icon" fill="rgba(100, 100, 0, 0.8)" />
        </div>
        <div
          class="icon-container"
          :class="{ 'icon-active': autoSneak }"
          title="Auto-Sneak"
          @click="toggleAutoAction('autoSneak')"
        >
          <Footprints class="icon" :fill="autoSneak ? 'purple' : ''" />
        </div>
      </div>
      <div class="flex items-center">
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
        <AppSettings />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import AppSettings from "./AppSettings.vue";
import { ref } from "vue";
import {
  PlugZap,
  MoveUpRight,
  Repeat,
  UndoDot,
  Octagon,
  Power,
  Swords,
  Cross,
  Sparkles,
  Hand,
  Footprints,
  User,
} from "lucide-vue-next";

const isSettingsOpen = ref(false);
const isConnectedToServer = ref(false);
const isStopMoving = ref(true);

const autoAll = ref(true);
const autoCombat = ref(true);
const autoHeal = ref(true);
const autoBless = ref(true);
const autoGet = ref(true);
const autoSneak = ref(true);

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value;
};

const toggleAutoAll = () => {
  autoAll.value = !autoAll.value;
  if (autoAll.value) {
    autoCombat.value = true;
    autoHeal.value = true;
    autoBless.value = true;
    autoGet.value = true;
    autoSneak.value = true;
  }
};

const toggleAutoAction = (actionName) => {
  switch (actionName) {
    case "autoCombat":
      autoCombat.value = !autoCombat.value;
      break;
    case "autoHeal":
      autoHeal.value = !autoHeal.value;
      break;
    case "autoBless":
      autoBless.value = !autoBless.value;
      break;
    case "autoGet":
      autoGet.value = !autoGet.value;
      break;
    case "autoSneak":
      autoSneak.value = !autoSneak.value;
      break;
  }
};

const connectToServer = async () => {
  try {
    await window.electronAPI.connectToServer();
    isConnectedToServer.value = true;
  } catch (error) {
    console.error("Failed to connect to server:", error);
    isConnectedToServer.value = false;
  }
};
</script>

<style scoped>
.topbar {
  @apply w-full bg-zinc-900 border-b border-gray-700 flex justify-between items-stretch px-1 text-gray-400;
  position: relative;
  z-index: 10;
}

.icon-container {
  @apply p-1 m-1 rounded-sm border border-gray-500 hover:border-blue-400 hover:text-gray-200 cursor-pointer;
}

.icon-active {
  @apply border-blue-500;
  background-color: rgba(212, 243, 255, 0.1);
}

.icon-active .icon {
  @apply text-gray-100;
}

.icon {
  @apply w-5 h-5;
}

.separator {
  @apply w-px mx-1 bg-gray-700 self-stretch;
}

.settings-area {
  @apply w-full border-b border-gray-700;
  /*bg-zinc-800*/
  /* background-color: rgba(55, 65, 81, 0.9);
  backdrop-filter: blur(2px); */
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  /* height: 200px; */
  z-index: 9;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

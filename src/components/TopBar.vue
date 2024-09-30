<template>
  <div class="relative">
    <div class="topbar">
      <div class="flex items-center">
        <div
          class="icon-container"
          :class="{ 'icon-active': isConnectedToServer }"
          :title="
            isConnectedToServer ? 'Disconnect from server' : 'Connect to server'
          "
          @click="handleConnection"
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
          @click="toggleAutoAction('autoAll')"
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
          class="icon-container settings-button"
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
import { computed } from "vue";
import AppSettings from "./AppSettings.vue";
import { ref } from "vue";
import { useStore } from "vuex";
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

const store = useStore();

const isSettingsOpen = ref(false);
const isConnectedToServer = ref(false);
const isStopMoving = ref(true);

const autoAll = computed(() => store.state.playerConfig.auto.autoAll);
const autoCombat = computed(() => store.state.playerConfig.auto.autoCombat);
const autoHeal = computed(() => store.state.playerConfig.auto.autoHeal);
const autoBless = computed(() => store.state.playerConfig.auto.autoBless);
const autoGet = computed(() => store.state.playerConfig.auto.autoGet);
const autoSneak = computed(() => store.state.playerConfig.auto.autoSneak);

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value;
};

const toggleAutoAction = (actionName) => {
  store.dispatch("playerConfig/updateConfig", {
    section: "auto",
    newConfig: { [actionName]: !store.state.playerConfig.auto[actionName] },
  });
};

const handleConnection = () => {
  if (isConnectedToServer.value) {
    console.log("sending disconnect at " + new Date().toISOString());
    window.electronAPI.disconnectFromServer();
    isConnectedToServer.value = false;
  } else {
    window.electronAPI.connectToServer();
    isConnectedToServer.value = true;
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
  @apply p-1 m-1 rounded-sm border border-zinc-900 hover:border-zinc-400 hover:text-gray-200 cursor-pointer;
}

.icon-active {
  @apply border border-green-500 bg-zinc-700 hover:border-green-600;
}

.icon-active .icon {
  @apply text-gray-100;
}

.icon {
  @apply w-5 h-5;
}

.settings-button.active {
  @apply border border-zinc-200 text-gray-200 bg-zinc-700;
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

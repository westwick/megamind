<template>
  <div class="flex app-settings" @click.stop>
    <ul class="menu-list">
      <li v-for="tab in tabs" :key="tab.id">
        <a href="#" class="menu-item" :class="{ active: activeTab === tab.id }" @click.prevent="setActiveTab(tab.id)">
          {{ tab.name }}
        </a>
      </li>
    </ul>
    <div class="content-area">
      <div v-if="activeTab === 'profiles'">
        <div class="profiles-section">
          <div class="profiles-header">
            <button class="add-profile-btn">
              <Plus class="w-5 h-5" />
            </button>
          </div>
          <div class="profiles-list">
            <div
              v-for="profile in profiles"
              :key="profile.path"
              class="profile-item"
              :class="{ 'profile-selected': profile.path === selectedProfile }"
              @click="!editingProfileId && handleProfileSelect(profile)"
            >
              <div class="profile-content flex">
                <img
                  :src="`/images/${profile?.options?.character?.race || 'human'}.jpg`"
                  alt="Race Image"
                  class="profile-image"
                />
                <img
                  :src="`/images/${profile?.options?.character?.class || 'warrior'}.jpg`"
                  alt="Class Image"
                  class="profile-image"
                />
                <div class="profile-details">
                  <span
                    v-if="!editingProfileId || editingProfileId !== profile.path"
                    class="profile-name"
                    @click.stop="startEditing(profile)"
                  >
                    {{ profile?.options?.profileName || 'Unnamed Profile' }}
                    <Pencil class="w-4 h-4 inline-block ml-2 text-gray-400" />
                  </span>
                  <input
                    v-else
                    ref="profileNameInput"
                    v-model="editingProfileName"
                    type="text"
                    class="profile-name-input"
                    @blur="handleProfileNameUpdate"
                    @keyup.enter="handleProfileNameUpdate"
                    @click.stop
                  />
                </div>
              </div>
              <div class="profile-divider"></div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'general'">
        <DynamicSettings :settings="config[getConfigPath(activeTab)]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DynamicSettings from './DynamicSettings.vue';
import { useStore } from 'vuex';
import { Plus, Pencil } from 'lucide-vue-next';

const store = useStore();
const activeTab = ref('');
const profiles = ref([]);
const selectedProfile = ref(null);
const config = ref({
  user: {},
  combat: {},
  spells: {},
  party: {},
  pvp: {},
  cash: {},
});

const tabs = [
  { id: 'profiles', name: 'Profiles' },
  { id: 'general', name: 'General' },
  { id: 'health', name: 'Health & Mana' },
  { id: 'combat', name: 'Combat' },
  { id: 'spells', name: 'Spells' },
  { id: 'party', name: 'Party' },
  { id: 'pvp', name: 'PvP' },
  { id: 'cash', name: 'Cash Shop' },
];

const setActiveTab = async (tabId) => {
  activeTab.value = tabId;

  if (tabId === 'profiles') {
    // Refresh the profiles list
    profiles.value = await window.electronAPI.getPlayerProfiles();
  }
};

onMounted(async () => {
  setActiveTab('profiles');
});

const handleProfileSelect = (profile) => {
  if (editingProfileId.value) return;

  window.electronAPI.loadProfile(profile.path);
  selectedProfile.value = profile.path;
  store.commit('SET_IS_SETTINGS_OPEN', false);
};

window.electronAPI.onSetSelectedProfile((event, profilePath, options) => {
  selectedProfile.value = profilePath;
  config.value = options;
});

const handleAddProfile = async () => {
  await window.electronAPI.createNewProfile();
  // Refresh the profiles list
  profiles.value = await window.electronAPI.getPlayerProfiles();
};

const getConfigPath = (tab) => {
  // Map tabs to their corresponding config paths
  const pathMap = {
    combat: 'combat',
    spells: 'spells',
    party: 'party',
    pvp: 'pvp',
    cash: 'cash',
    general: 'user',
    health: 'health',
  };

  return pathMap[tab];
};

const handleConfigUpdate = ({ path, value }) => {
  console.log(`Updated ${path} to:`, value);
  config.value[path] = value;
  // Here you can handle persistence, vuex updates, etc.
};

const editingProfileId = ref(null);
const editingProfileName = ref('');
const profileNameInput = ref(null);

const startEditing = (profile) => {
  editingProfileId.value = profile.path;
  editingProfileName.value = profile.profileName || 'Unnamed Profile';
  // Focus the input on next tick after it's rendered
  setTimeout(() => {
    profileNameInput.value?.focus();
  }, 0);
};

const handleProfileNameUpdate = async () => {
  if (editingProfileId.value) {
    try {
      await window.electronAPI.updateProfileName(editingProfileId.value, editingProfileName.value);
      // Refresh the profiles list
      profiles.value = await window.electronAPI.getPlayerProfiles();
    } catch (error) {
      console.error('Failed to update profile name:', error);
    }
  }
  // Use setTimeout to delay clearing the editing state
  setTimeout(() => {
    editingProfileId.value = null;
    editingProfileName.value = '';
  }, 100);
};
</script>

<style scoped>
.app-settings {
  backdrop-filter: blur(2px);
}

.menu-list {
  @apply flex-col text-sm font-medium text-gray-300 mb-0;
  @apply flex shrink-0;
}

.menu-item {
  @apply inline-flex items-center px-4 py-2 bg-zinc-900 border-r border-gray-500 rounded-sm;
  @apply hover:bg-gray-900 w-full border-b border-gray-500;
}

.menu-item.active {
  @apply text-white bg-zinc-800/95 border-r-0;
}

.content-area {
  @apply p-4 text-gray-300 w-full bg-zinc-800/95;
}

.content-title {
  @apply text-lg font-bold text-gray-100 dark:text-white mb-2;
}

.content-text {
  @apply mb-2;
}

.settings-input {
  @apply w-20 bg-zinc-700 text-gray-200 rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.settings-label {
  @apply text-gray-200 mb-1 w-32 text-sm;
}

.profiles-list {
  @apply space-y-1 mt-4;
}

.profile-item {
  @apply bg-zinc-700/50 hover:bg-zinc-600/50 cursor-pointer transition-colors duration-200;
  @apply rounded-sm overflow-hidden;
  @apply border border-zinc-600;
  width: 95%;
  margin: 0 auto;
}

.profile-content {
  @apply px-4 py-3 flex flex-row items-center;
}

.profile-image {
  @apply w-10 h-10 mr-2;
}


/* Add these styles for the JSON editor */
:deep(.je-object__title) {
  @apply text-gray-200 text-lg font-medium mb-4;
}

:deep(.je-object__container) {
  @apply bg-zinc-700/50 p-4 rounded-sm;
}

:deep(.form-control) {
  @apply bg-zinc-600 border-zinc-500 text-gray-200;
}

:deep(.form-control:focus) {
  @apply border-blue-500 ring-1 ring-blue-500;
}

:deep(.je-label) {
  @apply text-gray-300;
}

.profile-name-input {
  @apply bg-[#1f1f1f] text-white px-2 py-1 rounded-sm w-full;
  @apply focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.profiles-header {
  @apply flex justify-end w-[95%] mx-auto mb-2;
}

.add-profile-btn {
  @apply p-2 bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors duration-200;
  @apply border border-zinc-600 rounded-sm;
}
</style>

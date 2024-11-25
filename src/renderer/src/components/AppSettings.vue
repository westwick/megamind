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
            <button class="add-profile-btn" @click="handleAddProfile">
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
                  :src="images.races[profile?.options?.character?.race || 'human']"
                  alt="Race Image"
                  class="profile-image"
                />
                <img
                  :src="images.classes[profile?.options?.character?.class || 'warrior']"
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
                    :ref="
                      (el) => {
                        if (el) profileNameInput = el;
                      }
                    "
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
        <DynamicSettings :settings="config[getConfigPath(activeTab)]" @config-value-changed="handleConfigChange" />
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
  { id: 'profiles', name: 'Profiles', configPath: null },
  { id: 'general', name: 'General', configPath: 'user' },
  { id: 'health', name: 'Health & Mana', configPath: 'health' },
  { id: 'combat', name: 'Combat', configPath: 'combat' },
  { id: 'spells', name: 'Spells', configPath: 'spells' },
  { id: 'party', name: 'Party', configPath: 'party' },
  { id: 'pvp', name: 'PvP', configPath: 'pvp' },
  { id: 'cash', name: 'Cash Shop', configPath: 'cash' },
];

const getConfigPath = (tab) => {
  const foundTab = tabs.find((t) => t.id === tab);
  return foundTab?.configPath;
};

onMounted(async () => {
  setActiveTab('profiles');
});

const setActiveTab = async (tabId) => {
  activeTab.value = tabId;

  if (tabId === 'profiles') {
    // Refresh the profiles list
    profiles.value = await window.electronAPI.getPlayerProfiles();
  }
};

const handleProfileSelect = (profile) => {
  if (editingProfileId.value) return;

  window.electronAPI.loadProfile(profile.path);
  selectedProfile.value = profile.path;
  store.commit('SET_IS_SETTINGS_OPEN', false);
};

window.electronAPI.onSetSelectedProfile((event, profilePath, options) => {
  selectedProfile.value = profilePath;
  config.value = options;
  // TODO: if current config is dirty, raise a prompt to save it
});

const handleAddProfile = async () => {
  const profile = await window.electronAPI.createNewProfile();
  profiles.value = await window.electronAPI.getPlayerProfiles();
  window.electronAPI.loadProfile(profile.path);
};

const handleConfigChange = ({ path, oldValue, newValue }) => {
  // Split the path into parts
  const parts = path
    .split('.')
    .map((part) => {
      // Handle array notation like [0]
      const match = part.match(/(\w+)\[(\d+)\]/);
      if (match) {
        return [match[1], match[2]];
      }
      return part;
    })
    .flat();

  // Create a reference to the parent object
  let current = config.value[getConfigPath(activeTab.value)];
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }

  // Update the value
  const lastPart = parts[parts.length - 1];
  current[lastPart] = newValue;

  emit('config-dirty', config.value);
};

const emit = defineEmits(['config-dirty']);

const editingProfileId = ref(null);
const editingProfileName = ref('');
const profileNameInput = ref(null);

const startEditing = (profile) => {
  editingProfileId.value = profile.path;
  editingProfileName.value = profile.options.profileName || 'Unnamed Profile';
  // Focus the input on next tick after it's rendered
  setTimeout(() => {
    profileNameInput.value?.focus();
  }, 0);
};

const handleProfileNameUpdate = async () => {
  if (editingProfileId.value) {
    // Find the profile being edited
    const profile = profiles.value.find((p) => p.path === editingProfileId.value);

    if (profile) {
      profile.options.profileName = editingProfileName.value;
      await window.electronAPI.saveProfile(JSON.parse(JSON.stringify(profile.options)), true);
      // Refresh the profiles list
      profiles.value = await window.electronAPI.getPlayerProfiles();
    }
  }
  // Use setTimeout to delay clearing the editing state
  setTimeout(() => {
    editingProfileId.value = null;
    editingProfileName.value = '';
  }, 100);
};

// Race imports
import humanImage from '../assets/images/human.jpg'
import dwarfImage from '../assets/images/dwarf.jpg'
import gnomeImage from '../assets/images/gnome.jpg'
import halflingImage from '../assets/images/halfling.jpg'
import elfImage from '../assets/images/elf.jpg'
import halfelfImage from '../assets/images/halfelf.jpg'
import darkelfImage from '../assets/images/darkelf.jpg'
import halforcImage from '../assets/images/halforc.jpg'
import goblinImage from '../assets/images/goblin.jpg'
import halfogreImage from '../assets/images/halfogre.jpg'
import kangImage from '../assets/images/kang.jpg'
import nekojinImage from '../assets/images/nekojin.jpg'
import gauntoneImage from '../assets/images/gauntone.jpg'

// Class imports
import warriorImage from '../assets/images/warrior.jpg'
import witchunterImage from '../assets/images/witchunter.jpg'
import paladinImage from '../assets/images/paladin.jpg'
import clericImage from '../assets/images/cleric.jpg'
import priestImage from '../assets/images/priest.jpg'
import missionaryImage from '../assets/images/missionary.jpg'
import ninjaImage from '../assets/images/ninja.jpg'
import thiefImage from '../assets/images/thief.jpg'
import bardImage from '../assets/images/bard.jpg'
import gypsyImage from '../assets/images/gypsy.jpg'
import warlockImage from '../assets/images/warlock.jpg'
import mageImage from '../assets/images/mage.jpg'
import druidImage from '../assets/images/druid.jpg'
import rangerImage from '../assets/images/ranger.jpg'
import mysticImage from '../assets/images/mystic.jpg'

const images = {
  races: {
    human: humanImage,
    dwarf: dwarfImage,
    gnome: gnomeImage,
    halfling: halflingImage,
    elf: elfImage,
    halfelf: halfelfImage,
    darkelf: darkelfImage,
    halforc: halforcImage,
    goblin: goblinImage,
    halfogre: halfogreImage,
    kang: kangImage,
    nekojin: nekojinImage,
    gauntone: gauntoneImage
  },
  classes: {
    warrior: warriorImage,
    witchunter: witchunterImage,
    paladin: paladinImage,
    cleric: clericImage,
    priest: priestImage,
    missionary: missionaryImage,
    ninja: ninjaImage,
    thief: thiefImage,
    bard: bardImage,
    gypsy: gypsyImage,
    warlock: warlockImage,
    mage: mageImage,
    druid: druidImage,
    ranger: rangerImage,
    mystic: mysticImage
  }
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

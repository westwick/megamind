<template>
  <div class="flex app-settings">
    <ul class="menu-list">
      <li v-for="tab in tabs" :key="tab.id">
        <a
          href="#"
          class="menu-item"
          :class="{ active: activeTab === tab.id }"
          @click.prevent="setActiveTab(tab.id)"
        >
          {{ tab.name }}
        </a>
      </li>
    </ul>
    <div class="content-area">
      <div v-if="activeTab === 'general'">
        <p class="content-text">General settings for your game experience.</p>
        <!-- Add more general settings content here -->
      </div>

      <div v-if="activeTab === 'health'">
        <div class="flex gap-16">
          <div class="flex">
            <div class="flex flex-col gap-1">
              <div class="flex items-center">
                <label for="health-input-1" class="settings-label"
                  >Rest max</label
                >
                <input
                  id="health-input-1"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="health-input-2" class="settings-label"
                  >Rest if below</label
                >
                <input
                  id="health-input-2"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="health-input-3" class="settings-label"
                  >Heal (while resting)</label
                >
                <input
                  id="health-input-3"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="health-input-4" class="settings-label"
                  >Heal (Combat)</label
                >
                <input
                  id="health-input-4"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="health-input-5" class="settings-label"
                  >Run if below</label
                >
                <input
                  id="health-input-5"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="health-input-6" class="settings-label"
                  >Hang if below</label
                >
                <input
                  id="health-input-6"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div class="flex-grow">
            <div class="flex flex-col gap-1">
              <div class="flex items-center">
                <label for="mana-input-1" class="settings-label"
                  >Rest Max</label
                >
                <input
                  id="mana-input-1"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="mana-input-2" class="settings-label"
                  >Rest if below</label
                >
                <input
                  id="mana-input-2"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="mana-input-3" class="settings-label"
                  >Heal (rest)</label
                >
                <input
                  id="mana-input-3"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="mana-input-4" class="settings-label"
                  >Heal (combat)</label
                >
                <input
                  id="mana-input-4"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="mana-input-5" class="settings-label"
                  >Run if below</label
                >
                <input
                  id="mana-input-5"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
              <div class="flex items-center">
                <label for="mana-input-6" class="settings-label"
                  >Hang if below</label
                >
                <input
                  id="mana-input-6"
                  type="number"
                  class="settings-input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'combat'">
        <p class="content-text">
          Adjust your combat preferences and strategies.
        </p>
        <!-- Add combat settings here -->
      </div>

      <div v-if="activeTab === 'spells'">
        <p class="content-text">
          Manage your spellbook and spell configurations.
        </p>
        <!-- Add spell management content here -->
      </div>

      <div v-if="activeTab === 'party'">
        <p class="content-text">Set up your party preferences and roles.</p>
        <!-- Add party-related settings here -->
      </div>

      <div v-if="activeTab === 'pvp'">
        <p class="content-text">Customize your PVP settings and strategies.</p>
        <!-- Add PVP-specific content here -->
      </div>

      <div v-if="activeTab === 'cash'">
        <p class="content-text">Manage your in-game currency and purchases.</p>
        <!-- Add cash/economy related content here -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTab: "general",
      tabs: [
        { id: "general", name: "General" },
        { id: "health", name: "Health & Mana" },
        { id: "combat", name: "Combat" },
        { id: "spells", name: "Spells" },
        { id: "party", name: "Party" },
        { id: "pvp", name: "PVP" },
        { id: "cash", name: "Cash" },
      ],
    };
  },
  computed: {
    activeTabName() {
      const activeTab = this.tabs.find((tab) => tab.id === this.activeTab);
      return activeTab ? activeTab.name : "";
    },
  },
  methods: {
    setActiveTab(tabId) {
      this.activeTab = tabId;
    },
  },
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
</style>

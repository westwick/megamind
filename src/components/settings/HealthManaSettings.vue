<template>
  <div class="flex gap-16">
    <div class="flex">
      <div class="flex flex-col gap-1">
        <SettingsInput
          v-model="healthSettings.restMax"
          label="Rest max"
          @update:modelValue="updateHealth('restMax', $event)"
        />
        <SettingsInput
          v-model="healthSettings.restIfBelow"
          label="Rest if below"
          @update:modelValue="updateHealth('restIfBelow', $event)"
        />
        <SettingsInput
          v-model="healthSettings.healWhileResting"
          label="Heal (while resting)"
          @update:modelValue="updateHealth('healWhileResting', $event)"
        />
        <SettingsInput
          v-model="healthSettings.healCombat"
          label="Heal (Combat)"
          @update:modelValue="updateHealth('healCombat', $event)"
        />
        <SettingsInput
          v-model="healthSettings.runIfBelow"
          label="Run if below"
          @update:modelValue="updateHealth('runIfBelow', $event)"
        />
        <SettingsInput
          v-model="healthSettings.hangIfBelow"
          label="Hang if below"
          @update:modelValue="updateHealth('hangIfBelow', $event)"
        />
      </div>
    </div>
    <div class="flex-grow">
      <div class="flex flex-col gap-1">
        <SettingsInput
          v-model="manaSettings.restMax"
          label="Rest Max"
          @update:modelValue="updateMana('restMax', $event)"
        />
        <SettingsInput
          v-model="manaSettings.restIfBelow"
          label="Rest if below"
          @update:modelValue="updateMana('restIfBelow', $event)"
        />
        <SettingsInput
          v-model="manaSettings.healWhileResting"
          label="Heal (rest)"
          @update:modelValue="updateMana('healWhileResting', $event)"
        />
        <SettingsInput
          v-model="manaSettings.healCombat"
          label="Heal (combat)"
          @update:modelValue="updateMana('healCombat', $event)"
        />
        <SettingsInput
          v-model="manaSettings.runIfBelow"
          label="Run if below"
          @update:modelValue="updateMana('runIfBelow', $event)"
        />
        <SettingsInput
          v-model="manaSettings.hangIfBelow"
          label="Hang if below"
          @update:modelValue="updateMana('hangIfBelow', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import SettingsInput from "./SettingsInput.vue";

const store = useStore();

const healthSettings = computed(() => store.state.playerConfig.health);
const manaSettings = computed(() => store.state.playerConfig.mana);

const updateHealth = (key, value) => {
  const newValue = parseFloat(value);
  if (!isNaN(newValue)) {
    store.dispatch("playerConfig/updateConfig", {
      section: "health",
      newConfig: { [key]: newValue },
    });
  }
};

const updateMana = (key, value) => {
  const newValue = parseFloat(value);
  if (!isNaN(newValue)) {
    store.dispatch("playerConfig/updateConfig", {
      section: "mana",
      newConfig: { [key]: newValue },
    });
  }
};
</script>

<template>
  <div class="flex gap-16">
    <div class="flex">
      <div class="flex flex-col gap-1">
        <SettingsInput
          v-model="healthSettings.restMax"
          label="Rest max"
          @update:modelValue="updateHealth('restMax', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.restMax)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="healthSettings.restIfBelow"
          label="Rest if below"
          @update:modelValue="updateHealth('restIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.restIfBelow)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="healthSettings.healWhileResting"
          label="Heal (while resting)"
          @update:modelValue="updateHealth('healWhileResting', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.healWhileResting)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="healthSettings.healCombat"
          label="Heal (Combat)"
          @update:modelValue="updateHealth('healCombat', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.healCombat)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="healthSettings.runIfBelow"
          label="Run if below"
          @update:modelValue="updateHealth('runIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.runIfBelow)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="healthSettings.hangIfBelow"
          label="Hang if below"
          @update:modelValue="updateHealth('hangIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateHealthValue(healthSettings.hangIfBelow)
            }}</span>
          </template>
        </SettingsInput>
      </div>
    </div>
    <div class="flex-grow">
      <div class="flex flex-col gap-1">
        <SettingsInput
          v-model="manaSettings.restMax"
          label="Rest Max"
          @update:modelValue="updateMana('restMax', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.restMax)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="manaSettings.restIfBelow"
          label="Rest if below"
          @update:modelValue="updateMana('restIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.restIfBelow)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="manaSettings.healWhileResting"
          label="Heal (rest)"
          @update:modelValue="updateMana('healWhileResting', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.healWhileResting)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="manaSettings.healCombat"
          label="Heal (combat)"
          @update:modelValue="updateMana('healCombat', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.healCombat)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="manaSettings.runIfBelow"
          label="Run if below"
          @update:modelValue="updateMana('runIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.runIfBelow)
            }}</span>
          </template>
        </SettingsInput>
        <SettingsInput
          v-model="manaSettings.hangIfBelow"
          label="Hang if below"
          @update:modelValue="updateMana('hangIfBelow', $event)"
        >
          <template #append>
            <span class="calculated-value">{{
              calculateManaValue(manaSettings.hangIfBelow)
            }}</span>
          </template>
        </SettingsInput>
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
const maxHealth = computed(() => store.state.playerConfig.stats.maxHealth);
const maxMana = computed(() => store.state.playerConfig.stats.maxMana);

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

const calculateHealthValue = (percentage) => {
  const value = Math.round((percentage / 100) * maxHealth.value);
  return `% (${value}/${maxHealth.value})`;
};

const calculateManaValue = (percentage) => {
  const value = Math.round((percentage / 100) * maxMana.value);
  return `% (${value}/${maxMana.value})`;
};
</script>

<style scoped>
.calculated-value {
  @apply text-gray-400;
}
</style>

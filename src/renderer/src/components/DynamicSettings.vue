<template>
  <div class="dynamic-settings">
    <template v-for="(value, key) in settings" :key="key">
      <DynamicField :field-name="key" :field-value="value" :depth="0" />
    </template>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import DynamicField from './DynamicField.vue';

const props = defineProps({
  settings: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.dynamic-settings {
  color: white;
  padding: 1rem;
}
</style>

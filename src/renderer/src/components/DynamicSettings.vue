<template>
  <div class="dynamic-settings">
    <template v-for="(value, key) in settings" :key="key">
      <DynamicField
        :field-name="key"
        :field-value="value"
        :depth="0"
        :path="key"
        @config-value-changed="handleConfigChange"
      />
    </template>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import DynamicField from './DynamicField.vue';

const props = defineProps({
  settings: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['config-value-changed']);

const handleConfigChange = (changeData) => {
  emit('config-value-changed', changeData); // forward to parent
};
</script>

<style scoped>
.dynamic-settings {
  color: white;
  padding: 1rem;
}
</style>

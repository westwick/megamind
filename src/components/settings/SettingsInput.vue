<template>
  <div class="flex items-center">
    <label :for="id" class="settings-label">{{ label }}</label>
    <input
      :id="id"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="number"
      class="settings-input"
      placeholder="0"
      min="0"
      max="100"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  label: String,
  modelValue: [Number, String],
});

const emit = defineEmits(["update:modelValue"]);

const id = `settings-input-${props.label.toLowerCase().replace(/\s+/g, "-")}`;
</script>

<style scoped>
.settings-input {
  @apply w-20 bg-zinc-700 text-gray-200 rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.settings-label {
  @apply text-gray-200 mb-1 w-32 text-sm;
}
</style>

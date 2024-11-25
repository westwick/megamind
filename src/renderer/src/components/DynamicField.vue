<template>
  <div class="field" :style="{ marginLeft: `${depth * 16}px` }">
    <!-- Primitive Types -->
    <template v-if="isPrimitive">
      <label :for="fieldName" class="field-label">{{ formatLabel(fieldName) }}</label>

      <input
        v-if="typeof fieldValue === 'string'"
        type="text"
        :value="fieldValue"
        maxlength="35"
        class="text-input"
        @input="handleChange($event.target.value)" />

      <input
        v-else-if="typeof fieldValue === 'number'"
        type="number"
        :value="fieldValue"
        class="number-input"
        @input="handleChange(Number($event.target.value))" />

      <input
        v-else-if="typeof fieldValue === 'boolean'"
        type="checkbox"
        :checked="fieldValue"
        class="checkbox-input"
        @change="handleChange($event.target.checked)" />
    </template>

    <!-- Arrays and Objects -->
    <template v-else>
      <div class="expandable-section">
        <div class="section-header" @click="toggleExpanded">
          <span class="triangle" :class="{ expanded }">▶</span>
          <span class="section-label">{{ formatLabel(fieldName) }}</span>
        </div>

        <div v-if="expanded" class="section-content">
          <template v-if="Array.isArray(fieldValue)">
            <dynamic-field
              v-for="(item, index) in fieldValue"
              :key="index"
              :field-name="''"
              :field-value="item"
              :depth="depth + 1"
              :path="`${fullPath}[${index}]`"
            />
          </template>
          <template v-else>
            <dynamic-field
              v-for="(val, key) in fieldValue"
              :key="key"
              :field-name="key"
              :field-value="val"
              :depth="depth + 1"
              :path="`${fullPath}.${key}`"
            />
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  fieldValue: {
    type: [String, Number, Boolean, Array, Object],
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  path: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['config-value-changed']);

const expanded = ref(false);
const isPrimitive = computed(() => {
  return ['string', 'number', 'boolean'].includes(typeof props.fieldValue);
});

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

const formatLabel = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const fullPath = computed(() => {
  if (!props.path) return props.fieldName;
  if (!props.fieldName) return props.path;
  return props.path === props.fieldName ? props.path : `${props.path}.${props.fieldName}`;
});

const handleChange = (newValue) => {
  emit('config-value-changed', {
    path: fullPath.value,
    oldValue: props.fieldValue,
    newValue: newValue,
  });
};
</script>

<style>
.field {
  @apply mb-2 flex items-center gap-2;
}

.field-label {
  @apply mb-0 min-w-[120px];
}

.text-input,
.number-input {
  @apply bg-[#1f1f1f] text-white border border-[#333] p-1 rounded;
}

.text-input {
  @apply w-[35ch];
}

.number-input {
  @apply w-[8ch];
}

.checkbox-input {
  @apply accent-[#1f1f1f];
}

.expandable-section {
  @apply my-2;
}

.section-header {
  @apply cursor-pointer flex items-center gap-2;
}

.triangle {
  @apply inline-block transition-transform duration-200 bg-[#1f1f1f] text-white px-1 rounded select-none;
  -webkit-text-stroke: 0px white;
  -webkit-text-fill-color: white;
  /* Force remove any default background */
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.triangle.expanded {
  @apply rotate-90;
}

.section-content {
  @apply mt-2;
}
</style>

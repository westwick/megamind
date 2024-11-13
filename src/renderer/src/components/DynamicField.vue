<template>
  <div class="field" :style="{ marginLeft: `${depth * 16}px` }">
    <!-- Primitive Types -->
    <template v-if="isPrimitive">
      <label :for="fieldName" class="field-label">{{ formatLabel(fieldName) }}</label>

      <input v-if="typeof fieldValue === 'string'" type="text" :value="fieldValue" maxlength="35" class="text-input" />

      <input v-else-if="typeof fieldValue === 'number'" type="number" :value="fieldValue" class="number-input" />

      <input v-else-if="typeof fieldValue === 'boolean'" type="checkbox" :checked="fieldValue" class="checkbox-input" />
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
            />
          </template>
          <template v-else>
            <dynamic-field
              v-for="(val, key) in fieldValue"
              :key="key"
              :field-name="key"
              :field-value="val"
              :depth="depth + 1"
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
});

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
</script>

<style scoped>
.field {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-label {
  margin-bottom: 0;
  min-width: 120px;
}

.text-input,
.number-input {
  background-color: #1f1f1f;
  color: white;
  border: 1px solid #333;
  padding: 0.25rem;
  border-radius: 4px;
}

.text-input {
  width: 35ch;
}

.number-input {
  width: 8ch;
}

.checkbox-input {
  accent-color: #1f1f1f;
}

.expandable-section {
  margin: 0.5rem 0;
}

.section-header {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.triangle {
  display: inline-block;
  transition: transform 0.2s;
  background-color: #1f1f1f !important;
  color: white;
  padding: 0 4px;
  border-radius: 2px;
  user-select: none;
  -webkit-text-stroke: 0px white;
  -webkit-text-fill-color: white;
  /* Force remove any default background */
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.triangle.expanded {
  transform: rotate(90deg);
}

.section-content {
  margin-top: 0.5rem;
}
</style>

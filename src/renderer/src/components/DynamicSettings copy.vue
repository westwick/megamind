<template>
  <div class="dynamic-settings">
    <div class="setting-group">
      <h3 class="group-title">{{ formatLabel(path.split('.').pop()) }}</h3>
      <div v-for="(value, key) in modelValue" :key="key">
        <component
          :is="getComponentType(value)"
          :model-value="value"
          :label="formatLabel(key)"
          :path="`${path}.${key}`"
          @update:model-value="updateValue(key, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const formatLabel = (key) => {
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const updateValue = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
};

const getComponentType = (value) => {
  switch (typeof value) {
    case 'string':
      return StringInput;
    case 'number':
      return NumberInput;
    case 'boolean':
      return BooleanInput;
    case 'object':
      return value instanceof Array ? ArrayInput : ObjectInput;
    default:
      return StringInput;
  }
};
</script>

<script>
// Individual components for different types
const StringInput = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <div class="input-group inline">
      <label>{{ label }}</label>
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="input"
        style="background-color: #1a1a1a !important; color: #ffffff !important;"
      />
    </div>
  `,
};

const NumberInput = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <div class="input-group inline">
      <label>{{ label }}</label>
      <input
        type="number"
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
        class="input"
        style="background-color: #1a1a1a !important; color: #ffffff !important;"
        maxlength="4"
        oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
      />
    </div>
  `,
};

const BooleanInput = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <div class="input-group checkbox">
      <label>
        <input
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
          style="background-color: #1a1a1a !important; color: #ffffff !important;"
        />
        {{ label }}
      </label>
    </div>
  `,
};

const ArrayInput = {
  props: ['modelValue', 'label', 'path'],
  emits: ['update:modelValue'],
  data() {
    return { isExpanded: false };
  },
  template: `
    <CollapsibleWrapper
      :label="label"
      :is-expanded="isExpanded"
      @toggle="isExpanded = !isExpanded"
    >
      <div v-if="isExpanded" class="array-items">
        <div v-for="(item, index) in modelValue" :key="index" class="array-item">
          <component
            :is="getComponentType(item)"
            :model-value="item"
            :label="'Item ' + index"
            :path="path + '.' + index"
            @update:model-value="updateArrayItem(index, $event)"
          />
        </div>
      </div>
      <div v-else class="preview">
        [{{ modelValue.length }} items]
      </div>
    </CollapsibleWrapper>
  `,
  methods: {
    updateArrayItem(index, value) {
      const newArray = [...this.modelValue];
      newArray[index] = value;
      this.$emit('update:modelValue', newArray);
    },
    getComponentType(value) {
      // Same as the main component's getComponentType
    },
  },
};

const ObjectInput = {
  props: ['modelValue', 'label', 'path'],
  emits: ['update:modelValue'],
  data() {
    return { isExpanded: false };
  },
  template: `
    <div class="setting-group">
      <h3 class="group-title">{{ label }}</h3>
      <div class="object-properties">
        <div v-for="(value, key) in modelValue" :key="key" class="object-property">
          <component
            :is="getComponentType(value)"
            :model-value="value"
            :label="formatLabel(key)"
            :path="path + '.' + key"
            @update:model-value="updateObjectProperty(key, $event)"
          />
        </div>
      </div>
    </div>
  `,
  methods: {
    updateObjectProperty(key, value) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [key]: value,
      });
    },
    getComponentType(value) {
      // Same as the main component's getComponentType
    },
    formatLabel(key) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
  },
};

// Update existing components and add new ones
const CollapsibleWrapper = {
  props: ['modelValue', 'label', 'isExpanded'],
  emits: ['update:modelValue', 'toggle'],
  template: `
    <div class="collapsible">
      <div class="collapsible-header" @click="$emit('toggle')">
        <span>{{ label }}</span>
        <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>
      <div v-if="isExpanded" class="collapsible-content">
        <slot></slot>
      </div>
    </div>
  `,
};
</script>

<style scoped>
.dynamic-settings {
  padding: 1rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: var(--color-text);
}

.input-group select,
.input,
.select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

input {
  background: #1a1a1a !important;
  color: #ffffff !important;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.input-group.inline {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.input-group.inline .input {
  width: 8ch; /* Just enough for 4 digits plus some padding */
  text-align: center;
}

.setting-group {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.group-title {
  margin: 0 0 1rem 0;
  font-size: 1.1em;
  font-weight: 600;
}

.collapsible {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin: 0.5rem 0;
}

.collapsible-header {
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.1);
}

.collapsible-content {
  padding: 0.5rem;
}

.preview {
  padding: 0.5rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.array-items,
.object-properties {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>

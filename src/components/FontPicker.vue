<template>
  <div class="font-picker">
    <label for="font-select">Select a font:</label>
    <div class="font-list">
      <button
        v-for="font in fonts"
        :key="font"
        @click="selectFont(font)"
        :class="{ selected: selectedFont === font }"
      >
        {{ font }}
      </button>
    </div>
    <p class="selected-font">Selected font: {{ selectedFont }}</p>

    <div class="font-size-picker">
      <label for="font-size-slider">Font size: {{ fontSize }}px</label>
      <input
        type="range"
        id="font-size-slider"
        v-model="fontSize"
        min="8"
        max="20"
        step="1"
        @input="updateFontSize"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from "vue";
import fontNames from "../assets/fonts/fontNames.js";

const { proxy } = getCurrentInstance();
const fonts = ref([]);
const selectedFont = ref("");
const fontSize = ref(16); // Default font size

onMounted(() => {
  fonts.value = fontNames;
});

const selectFont = (font) => {
  selectedFont.value = font;
  proxy.$eventBus.emit("font-changed", font);
};

const updateFontSize = () => {
  proxy.$eventBus.emit("font-size-changed", fontSize.value);
};
</script>

<style scoped>
.font-picker {
  max-width: 300px;
  margin: 0 auto;
}

.font-list {
  height: 200px;
  overflow-y: scroll;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 10px;
}

button {
  display: block;
  width: 100%;
  padding: 8px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #f0f0f0;
}

button.selected {
  background-color: #e0e0e0;
  font-weight: bold;
}

.selected-font {
  margin-top: 10px;
  font-weight: bold;
}

.font-size-picker {
  margin-top: 20px;
}

.font-size-picker label {
  display: block;
  margin-bottom: 5px;
}

.font-size-picker input {
  width: 100%;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const level = ref(0);
const currentExp = ref(0);

async function getLevel() {
  try {
    const response = await fetch("/level");
    if (response.ok) {
      level.value = await response.json();
    } else {
      console.error("Failed to fetch user level");
    }
  } catch (error) {
    console.error("Error fetching user level:", error);
  }
}

async function getExp() {
  try {
    const response = await fetch("/exp");
    if (response.ok) {
      currentExp.value = await response.json();
    } else {
      console.error("Failed to fetch user experience");
    }
  } catch (error) {
    console.error("Error fetching user experience:", error);
  }
}

const expPercentage = computed(() => {
  return ((currentExp.value / 30) * 100).toFixed(2);
});

onMounted(async () => {
  await getLevel();
  await getExp();
});
</script>

<template>
  <div class="user-level-display">
    <h3>User Level: {{ level }}</h3>
    <div class="exp-bar">
      <div class="exp-progress" :style="{ width: expPercentage + '%' }"></div>
    </div>
    <p>{{ currentExp }} / 30 EXP</p>
  </div>
</template>

<style scoped>
.user-level-display {
  text-align: center;
  margin: 20px;
}

.exp-bar {
  position: relative;
  background: #f0f0f0;
  border-radius: 8px;
  height: 20px;
  width: 100%;
  margin: 10px 0;
}

.exp-progress {
  background: #4caf50;
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease-in-out;
}
</style>

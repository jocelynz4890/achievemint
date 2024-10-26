<script setup lang="ts">
import { fetchy } from "@/utils/fetchy";
import { computed, onMounted, ref } from "vue";

const props = defineProps(["user"]);
const level = ref(0);
const currentExp = ref(0);

async function getLevel() {
  let query = props.user;
  try {
    level.value = await fetchy("/api/level", "GET", { body: query });
  } catch (_) {
    return;
  }
}

async function getExp() {
  let query = props.user;
  try {
    currentExp.value = await fetchy("/api/level/exp", "GET", { body: query });
  } catch (_) {
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
    <h3>Level: {{ level }}</h3>
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

<script setup lang="ts">
import SavedPostList from "@/components/Collection/SavedPostList.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from 'vue';

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());

const categories = [
  { type: 'Lifestyle', label: '🏠 Lifestyle 🏖️' },
  { type: 'HealthAndFitness', label: '🫀 Health and Fitness 👟' },
  { type: 'Entertainment', label: '📺 Entertainment 🎉' },
  { type: 'FoodAndCooking', label: '🍔 Food and Cooking 🍳' },
  { type: 'FashionAndBeauty', label: '👗 Fashion and Beauty 💄' },
  { type: 'EducationAndDIY', label: '🎓 Education and DIY 📕' },
];

const expandedCategories = ref(new Set<string>());
const collection = true;
const authors = undefined;
const toggleCategory = (category: string) => {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category);
  } else {
    expandedCategories.value.add(category);
  }
};
</script>

<template>
  <main>
    <section>
      <h1>{{ currentUsername }}'s collections</h1>
      <div>
        <ul>
          <li v-for="category in categories" :key="category.type">
            <button @click="toggleCategory(category.type)">
              {{ category.label }} ({{ expandedCategories.has(category.type) ? 'Click to Hide' : 'Click to Show' }})
            </button>
            <div v-if="expandedCategories.has(category.type)">
              <SavedPostList 
                :isOnProfilePage="false" 
                :defaultCategory="category.type" 
                :contentCreatorsOnly="false" 
                :author="authors" 
                :collection = true
              />
            </div>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 1em 0;
}
button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 5px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const OptionTypes = {
    All: "All",
    Lifestyle: "Lifestyle",
    HealthAndFitness: "HealthAndFitness",
    Entertainment: "Entertainment",
    FoodAndCooking: "FoodandCooking",
    FashionAndBeauty: "FashionandBeauty",
    EducationAndDIY: "EducationandDIY",
};
const options = [
      [OptionTypes.Lifestyle, "🏠 Lifestyle 🏖️"],
      [OptionTypes.HealthAndFitness, "🫀 Health and Fitness 👟"],
      [OptionTypes.Entertainment, "📺 Entertainment 🎉"],
      [OptionTypes.FoodAndCooking, "🍔 Food and Cooking 🍳"],
      [OptionTypes.FashionAndBeauty, "👗 Fashion and Beauty 💄"],
      [OptionTypes.EducationAndDIY, "🎓 Education and DIY 📕"],
    ];

const selectedValue = ref("Lifestyle");

const content = ref("");
const emit = defineEmits(["refreshPosts"]);

const createPost = async (content: string, category: string) => {
  try {
    await fetchy("/api/posts", "POST", {
      body: { content, category },
    });
  } catch (_) {
    return;
  }
  emit("refreshPosts");
  emptyForm();
};

const emptyForm = () => {
  content.value = "";
};
</script>

<template>
  <form @submit.prevent="createPost(content, selectedValue)">
    <label for="content">Post Contents:</label>
    <div class="dropdown">
      <select id="dropdown" v-model="selectedValue">
          <option v-for="option in options" :key="option[1]" :value="option[0]">
          {{ option[1] }}
          </option>
      </select>
    </div>
    <textarea id="content" v-model="content" placeholder="Create a post!" required> </textarea>
    <button type="submit" class="pure-button-primary pure-button">Create Post</button>
  </form>
</template>


<style scoped>
form {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

textarea {
  font-family: inherit;
  font-size: inherit;
  height: 6em;
  padding: 0.5em;
  border-radius: 4px;
  resize: none;
}

.dropdown {
  position: relative;
}
.dropdown-button {
  padding: 8px;
  cursor: pointer;
}
.dropdown-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  margin-top: 4px;
}
.dropdown-item {
  padding: 8px;
  cursor: pointer;
}
.dropdown-item:hover {
  background-color: #f0f0f0;
}
</style>

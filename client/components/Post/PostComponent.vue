<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["post"]);
const emit = defineEmits(["editPost", "refreshPosts"]);
const { currentUsername } = storeToRefs(useUserStore());
const category = ref(props.post.category);
const saved = ref(false);

watch(
  () => props.post.category,
  (newCategory: string) => {
    category.value = newCategory;
  }
);

const deletePost = async () => {
  try {
    await fetchy(`/api/collections/remove`, "PATCH", {body: {collectionTitle: props.post.category, post: props.post._id}});
    await fetchy(`/api/posts/${props.post._id}`, "DELETE");
    saved.value = false;
  } catch {
    return;
  }
  emit("refreshPosts");
};

const upvotes = ref(props.post.quality_rating); 

const savePost = async () => {
  upvotes.value += 1;
  saved.value = true;
  try {
    await fetchy(`/api/posts/increment/${props.post._id}`, "PATCH"); 
    await fetchy(`/api/collections/add`, "PATCH", {body: {collectionTitle: props.post.category, post: props.post._id}});
    emit("refreshPosts");
  } catch(_) {
    return;
  }
};

const unsavePost = async () => {
  upvotes.value -= 1;
  saved.value = false;
  try {
    await fetchy(`/api/posts/decrement/${props.post._id}`, "PATCH");
    await fetchy(`/api/collections/remove`, "PATCH", {body: {collectionTitle: props.post.category, post: props.post._id}});
    emit("refreshPosts");
  } catch(_) {
    return;
  }
};

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
      [OptionTypes.All, "All"],
      [OptionTypes.Lifestyle, "🏠 Lifestyle 🏖️"],
      [OptionTypes.HealthAndFitness, "🫀 Health and Fitness 👟"],
      [OptionTypes.Entertainment, "📺 Entertainment 🎉"],
      [OptionTypes.FoodAndCooking, "🍔 Food and Cooking 🍳"],
      [OptionTypes.FashionAndBeauty, "👗 Fashion and Beauty 💄"],
      [OptionTypes.EducationAndDIY, "🎓 Education and DIY 📕"],
    ];

const categoryWithEmoji = computed(() => {
  const option = options.find(([type]) => type === category.value);
  return option ? option[1] : category.value; // fallback if no match is found
});

</script>

<template>
  <span>
    <p class="author">{{ props.post.author }}</p>
    <p>Category: {{ categoryWithEmoji }}</p>
  </span>
  <p>{{ props.post.content }}</p>
  <h5>👍 This post has been saved a total of {{ upvotes }} times!</h5>
  <button v-if="!saved" @click="savePost">❤️ {{ saved ? "Click to unsave" : "Click to save to collection" }}</button>
  <button v-if="saved" @click="unsavePost">❤️ {{ saved ? "Click to unsave" : "Click to save to collection" }}</button>
  <div class="base">
    <menu v-if="props.post.author == currentUsername">
      <li><button class="btn-small pure-button" @click="emit('editPost', props.post._id)">Edit</button></li>
      <li><button class="button-error btn-small pure-button" @click="deletePost">Delete</button></li>
    </menu>
    <article class="timestamp">
      <p v-if="props.post.dateCreated !== props.post.dateUpdated">Edited on: {{ formatDate(props.post.dateUpdated) }}</p>
      <p v-else>Created on: {{ formatDate(props.post.dateCreated) }}</p>
    </article>
  </div>
</template>

<style scoped>
p {
  margin: 0em;
}

.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.base article:only-child {
  margin-left: auto;
}
</style>

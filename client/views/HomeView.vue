<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import SelectPostCategory from "@/components/Post/SelectPostCategory.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const defaultCategory = ref("Lifestyle");
const editingPost = false;
const onProfilePage = ref(false);
const contentCreatorsOnly = ref(true);
const empty = "";
const collection = false;

function updateCategory(newCategory: string) {
  defaultCategory.value = newCategory;
}

</script>

<template>
  <main>
    <h1 v-if="isLoggedIn">Explore posts by content creators</h1>
    <SelectPostCategory v-if="isLoggedIn" @update:selected-value="updateCategory" :default-category="defaultCategory" :editing-post="editingPost"/>
    <section>
      <h5 v-if="isLoggedIn">Logged in as {{ currentUsername }}!</h5>
      <h1 v-else>Please login!</h1>
    </section>
    <PostListComponent v-if="isLoggedIn" :collection="collection" :author="empty" :is-on-profile-page="onProfilePage" :content-creators-only="contentCreatorsOnly" :default-category="defaultCategory"/>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>

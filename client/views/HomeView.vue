<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import SelectPostCategory from "@/components/Post/SelectPostCategory.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const defaultCategory = ref("Lifestyle");
const editingPost = false;
const onProfilePage = false;
</script>

<template>
  <main>
    <h1>Explore posts by content creators</h1>
    <SelectPostCategory :default-category="defaultCategory" :editing-post="editingPost"/>
    <section>
      <h5 v-if="isLoggedIn">Logged in as {{ currentUsername }}!</h5>
      <h1 v-else>Please login!</h1>
    </section>
    
    <PostListComponent :is-on-profile-page="onProfilePage"/>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>

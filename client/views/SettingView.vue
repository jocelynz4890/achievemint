<script setup lang="ts">
import LevelDisplay from "@/components/Level/LevelDisplay.vue";
import PostListComponent from "@/components/Post/PostListComponent.vue";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import UpdateUserForm from "../components/Setting/UpdateUserForm.vue";

const { currentUsername } = storeToRefs(useUserStore());
const { logoutUser, deleteUser } = useUserStore();
const onProfilePage = ref(true);
const contentCreatorsOnly = ref(false);
const allCategory = "All";
const collection = false;

async function logout() {
  await logoutUser();
  void router.push({ name: "Home" });
}

async function delete_() {
  await deleteUser();
  void router.push({ name: "Home" });
}
</script>

<template>
  <main class="column">
    <h1>{{ currentUsername }}'s profile</h1>
    <LevelDisplay :user="currentUsername"/>
    <h1>{{ currentUsername }}'s posts'</h1>
    <PostListComponent :collection="collection" :author="currentUsername" :default-category="allCategory" :is-on-profile-page="onProfilePage" :content-creators-only="contentCreatorsOnly"/>
    <h1>{{ currentUsername }}'s settings</h1>
    <button class="pure-button pure-button-primary" @click="logout">Logout</button>
    <button class="button-error pure-button" @click="delete_">Delete User</button>
    <UpdateUserForm />
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>

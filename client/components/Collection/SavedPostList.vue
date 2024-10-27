<script setup lang="ts">
import CreatePostForm from "@/components/Post/CreatePostForm.vue";
import EditPostForm from "@/components/Post/EditPostForm.vue";
import PostComponent from "@/components/Post/PostComponent.vue";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, ref, watch } from "vue";
import SearchPostForm from "../Post/SearchPostForm.vue";
const userStore = useUserStore();
const { isLoggedIn, currentUsername, role } = storeToRefs(userStore);

const loaded = ref(false);
let posts = ref<Array<Record<string, string>>>([]);
let editing = ref("");
const props = defineProps(["isOnProfilePage", "defaultCategory", "contentCreatorsOnly", "author", "collection"]);
let searchAuthor = ref(props.author);
const isContentCreator = role.value === "ContentCreator";
const canShowCreate = ref(isLoggedIn.value && (isContentCreator || props.isOnProfilePage) && !props.collection);
watch(() => props.defaultCategory, (newCategory) => {
  getPosts();
});

async function getPosts() {
    await fetchy(`/api/collections/${props.defaultCategory}`, "GET", {body: {title: props.defaultCategory}});
}

function updateEditing(id: string) {
  editing.value = id;
}

onBeforeMount(async () => {
  await userStore.updateRole();
  await getPosts();
  loaded.value = true;
});
</script>

<template>
  <section v-if="canShowCreate">
    <h2>Create a post:</h2>
    <CreatePostForm @refreshPosts="getPosts" />
  </section>
  <div class="row" v-if="!isOnProfilePage">
    <h2 v-if="!searchAuthor">Posts:</h2>
    <h2 v-else>Posts by {{ searchAuthor }}:</h2>
    <SearchPostForm @getPostsByAuthor="getPosts" />
  </div>
  <section class="posts" v-if="loaded && posts.length !== 0">
    <article v-for="post in posts" :key="post._id">
      <PostComponent v-if="editing !== post._id" :post="post" @refreshPosts="getPosts" @editPost="updateEditing" />
      <EditPostForm v-else :post="post" @refreshPosts="getPosts" @editPost="updateEditing" />
    </article>
  </section>
  <p v-else-if="loaded">No posts found</p>
  <p v-else>Loading...</p>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

section,
p,
.row {
  margin: 0 auto;
  max-width: 60em;
}

article {
  background-color: var(--base-bg);
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}

.posts {
  padding: 1em;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 60em;
}
</style>

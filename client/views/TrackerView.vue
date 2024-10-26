<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <section>
      <h1>{{ currentUsername }}'s trackers</h1>
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
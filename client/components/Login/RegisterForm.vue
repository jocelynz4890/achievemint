<script setup lang="ts">
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { ref } from "vue";

const username = ref("");
const password = ref("");
const { createUser, loginUser, updateSession } = useUserStore();
const selectedOption = ref("");
enum UserType {
  RegularUser =  "RegularUser",
  ContentCreator = "ContentCreator"
}
const options = [[UserType.RegularUser, "Regular User"], [UserType.ContentCreator, "Content Creator"]];

async function register() {
  await createUser(username.value, password.value, selectedOption.value);
  await loginUser(username.value, password.value);
  void updateSession();
  void router.push({ name: "Home" });
}
</script>

<template>
  <form class="pure-form pure-form-aligned" @submit.prevent="register">
    <h3>Register User</h3>
    <fieldset>
      <div class="pure-control-group">
        <label for="aligned-name">Username</label>
        <input v-model.trim="username" type="text" id="aligned-name" placeholder="Username" required />
      </div>
      <div class="pure-control-group">
        <label for="aligned-password">Password</label>
        <input type="password" v-model.trim="password" id="aligned-password" placeholder="Password" required />
      </div>
      <div class="pure-control-group">
        <label for="aligned-role">Role</label>
        <select id="dropdown" v-model="selectedOption" required>
          <option disabled value="">Select a role</option>
          <option v-for="option in options" :key="option[1]" :value="option[0]">
            {{ option[1] }}
          </option>
        </select>
      </div>
      <div class="pure-controls">
        <button type="submit" class="pure-button pure-button-primary">Register</button>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
h3 {
  display: flex;
  justify-content: center;
}
</style>

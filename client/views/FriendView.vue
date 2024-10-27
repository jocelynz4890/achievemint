<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
// const friends = ref([]); 
// const followers = ref([]); // followings
// const friendRequests = ref([]); 
// const newFriend = ref("");
// const newFollower = ref("");

interface User {
  username: string; 
}

const friends = ref<User[]>([]);
const followers = ref<User[]>([]);
const friendRequests = ref<User[]>([]);
const newFriend = ref("");
const newFollower = ref("");

onMounted(async () => {
  try {
    const friendsData: User[] = await fetchy(`/api/friends`, "GET");
    const followersData: User[] = await fetchy(`/api/friends/followings`, "GET");
    const requestsData: User[] = await fetchy(`/api/friends/requests`, "GET");

    console.log("Friends:", friendsData);
    console.log("Followers:", followersData);
    console.log("Friend Requests:", requestsData);

    friends.value = friendsData;
    followers.value = followersData;
    friendRequests.value = requestsData;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});
const unfriend = async (friend: string) => {
  await fetchy(`/api/friends/${friend}`, "DELETE");
};

const acceptRequest = async (from: string) => {
  await fetchy(`/api/friends/accept/${from}`, "DELETE");
};

const rejectRequest = async (from: string) => {
  await fetchy(`/api/friends/reject/${from}`, "PUT", { body: from });
};

const rejectOutgoing = async (to: string) => {
  await fetchy(`/api/friends/requests/${to}`, "DELETE");
};

const sendFriendRequest = async (to: string) => {
  await fetchy(`/api/friends/requests/${to}`, "POST", { body: {to} });
};

const followUser = async (username:string, to:string) => {
  await fetchy(`/api/friends/follow`, "POST", { body: {username, to } });
};

const unfollowUser = async (username:string, to:string) => {
  await fetchy(`/api/friends/unfollow`, "POST", { body: {username, to } });
};
</script>

<template>
  <main>
    <section>
      <h1 v-if="isLoggedIn">Friends</h1>
      <div class="column" v-if="isLoggedIn">
        <div v-for="friend in friends" class="card">
          <span>{{ friend.username }}</span>
          <span @click="unfriend(friend.username)">❌</span>
        </div>
        <input type="text" placeholder="Add a friend" v-model="newFriend" />
        <button @click="sendFriendRequest(newFriend)">Send Request</button>
        
        <h2>Friend Requests</h2>
        <div v-for="request in friendRequests" class="card">
          <span>{{ request.username }}</span>
          <span @click="acceptRequest(request.username)">✅</span>
          <span @click="rejectRequest(request.username)">❌</span>
        </div>
      </div>

      <h1 v-if="isLoggedIn">Following</h1>
      <div class="column" v-if="isLoggedIn">
        <input type="text" placeholder="Follow a creator" v-model="newFollower" />
        <button @click="followUser(currentUsername, newFollower)">Follow</button>
        <div v-for="follower in followers" class="card">
          <span>{{ follower.username }}</span>
          <span @click="unfollowUser(currentUsername, follower.username)">❌</span>
        </div>
      </div>

      <h1 v-else>Please login!</h1>
    </section>
  </main>
</template>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card {
  display: flex;
  justify-content: space-between;
  width: 200px;
  padding: 10px;
  margin: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

input {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>

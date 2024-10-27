<script setup lang="ts">
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { fetchy } from "@/utils/fetchy";
import { storeToRefs } from "pinia";
import { onBeforeMount, onMounted, ref } from "vue";

const userStore = useUserStore();
const { isLoggedIn, currentUsername, role } = storeToRefs(userStore);
let isRegularUser: boolean;
onBeforeMount(async () => {
  await userStore.updateRole();
  isRegularUser = role.value==="RegularUser";
  if (!isRegularUser){
    await router.push({ name: "Home" });
  }});
// const friends = ref([]); 
// const followings = ref([]); // followings
// const friendRequests = ref([]); 
// const newFriend = ref("");
// const newFollower = ref("");

interface User {
  username: string; 
  from: string;
  to: string;
  status: "pending" | "rejected" | "accepted";
}

const friends = ref<string[]>([]);
const followings = ref<string[]>([]);
const friendRequests = ref<User[]>([]);
const requestsOutgoing = ref<User[]>([]);
const newFriend = ref("");
const newFollower = ref("");

const loadFriendsData = async () => {
  try {
    const friendsData: string[] = (await fetchy(`/api/friends/followers`, "GET"));
    const followingsData: string[] = (await fetchy(`/api/friends/followings`, "GET"));
    const requestsData: User[] = (await fetchy(`/api/friends/requests`, "GET")).requests;
    console.log((await fetchy(`/api/friends/requests`, "GET")).requests);
    console.log("friends:" + friendsData);
    console.log("followings:" + followingsData);
    console.log("requests:" + requestsData);

    friends.value = friendsData;
    followings.value = followingsData;
    friendRequests.value = requestsData.filter((req) => req.from !== currentUsername.value);
    requestsOutgoing.value = requestsData.filter((req) => req.from === currentUsername.value);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

onMounted(loadFriendsData);

const unfriend = async (friend: string) => {
  await fetchy(`/api/friends/${friend}`, "DELETE");
  await loadFriendsData();
};

const acceptRequest = async (from: string) => {
  await fetchy(`/api/friends/accept/${from}`, "PUT");
  await loadFriendsData();
};

const rejectRequest = async (from: string) => {
  await fetchy(`/api/friends/reject/${from}`, "PUT", { body: from });
  await loadFriendsData();
};

const rejectOutgoing = async (to: string) => {
  await fetchy(`/api/friends/requests/${to}`, "DELETE");
  await loadFriendsData();
};

const sendFriendRequest = async (to: string) => {
  await fetchy(`/api/friends/requests/${to}`, "POST", { body: {to} });
  await loadFriendsData();
};

const followUser = async (username:string, to:string) => {
  await fetchy(`/api/friends/follow`, "POST", { body: {username, to } });
  await loadFriendsData();
};

const unfollowUser = async (username:string, to:string) => {
  await fetchy(`/api/friends/unfollow`, "POST", { body: {username, to } });
  await loadFriendsData();
};
</script>

<template>
  <main>
    <section>
      <h1 v-if="isLoggedIn">Friends</h1>
      <div class="column" v-if="isLoggedIn">
        <span v-if="friends && friends.length === 0">No friends 😭</span>
        <div v-for="friend in friends" class="card">
          <span>{{ friend }}</span>
          <span @click="unfriend(friend)">❌</span>
        </div>
        <input type="text" placeholder="Add a friend" v-model="newFriend" />
        <button @click="sendFriendRequest(newFriend)">Send Request</button>
        
        <h2>Friend Requests Received</h2>
        <span v-if="friendRequests && friendRequests.length === 0">No requests received</span>
        <div v-for="request in friendRequests" class="card">
          <span>{{ request.from }}</span>
          <span @click="acceptRequest(request.from)">✅</span>
          <span @click="rejectRequest(request.from)">❌</span>
        </div>

        <h2>Friend Requests Outgoing</h2>
        <span v-if="requestsOutgoing && requestsOutgoing.length === 0">No requests outgoing</span>
        <div v-for="request in requestsOutgoing" class="card">
          <span>{{ request.to }}</span>
\          <span @click="rejectOutgoing(request.to)">❌</span>
        </div>
      </div>

      <!-- <h1 v-if="isLoggedIn">Following</h1>
      <div class="column" v-if="isLoggedIn">
        <input type="text" placeholder="Follow a content creator" v-model="newFollower" />
        <button @click="followUser(currentUsername, newFollower)">Follow</button>
        <span v-if="followings && followings.length === 0">Not following any content creators</span>
        <div v-for="follower in followings" class="card">
          <span>{{ follower }}</span>
          <span @click="unfollowUser(currentUsername, follower)">❌</span>
        </div>
      </div> -->

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

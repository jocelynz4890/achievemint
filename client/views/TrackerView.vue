<!-- <script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { onMounted, ref } from 'vue';
import { CalendarHeatmap } from 'vue3-calendar-heatmap';

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const userTrackers = ref([]);
const newTrackerTitle = ref("");
const trackerDays = 360; // Number of days to track
const startDate = new Date(); // Set this to the appropriate start date
const endDate = new Date(); // Set this to the appropriate end date
endDate.setDate(endDate.getDate() + trackerDays); // Adjust to track past year

const colorScheme = { 
  0: '#FFFFFF', // No data
  1: '#E6F7F0', 
  2: '#B3E8D2', 
  3: '#66D7B0', 
  4: '#0BC27C', 
  5: '#009B4D', 
  6: '#006A2B' 
};

// Fetch user trackers
const fetchUserTrackers = async () => {
  if (isLoggedIn.value) {
    const response = await fetch(`/api/trackers?owner=${currentUsername.value}`);
    if (response.ok) {
      userTrackers.value = await response.json();
    } else {
      console.error("Failed to fetch trackers.");
    }
  }
};

// Toggle the state of a day in the tracker
const toggleDay = async (trackerId) => {
  const tracker = userTrackers.value.find(t => t._id === trackerId);
  if (tracker) {
    const updatedDays = tracker.days.map(day => !day); // Toggle all days for simplicity

    const response = await fetch(`/api/trackers/${trackerId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: updatedDays }),
    });

    if (response.ok) {
      tracker.days = updatedDays; // Update local state
    } else {
      console.error("Failed to update tracker.");
    }
  }
};

// Create a new tracker
const createNewTracker = async () => {
  if (newTrackerTitle.value.trim() === "") {
    alert("Please enter a title for the tracker.");
    return;
  }

  const response = await fetch(`/api/trackers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner: currentUsername.value, title: newTrackerTitle.value }),
  });

  if (response.ok) {
    const newTracker = await response.json();
    userTrackers.value.push(newTracker); // Add to local trackers list
    newTrackerTitle.value = ""; // Clear the input field
  } else {
    console.error("Failed to create tracker.");
  }
};

// Fetch trackers on component mount
onMounted(fetchUserTrackers);

// Prepare data for heatmap
const getHeatmapData = (days) => {
  const data = [];
  const today = new Date();

  for (let i = 0; i < days.length; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      count: days[i] ? 1 : 0, // Example count, adjust based on actual needs
    });
  }
  
  return data;
};
</script>

<template>
  <main>
    <section>
      <h1>{{ currentUsername }}'s Trackers</h1>
      <div>
        <input v-model="newTrackerTitle" placeholder="New Tracker Title" />
        <button @click="createNewTracker">Create Tracker</button>
      </div>
      <div v-for="tracker in userTrackers" :key="tracker._id">
        <h2>{{ tracker.title }}</h2>
        <CalendarHeatmap
          :data="getHeatmapData(tracker.days)"
          :start-date="startDate"
          :end-date="endDate"
          :color-scheme="colorScheme"
          @click="toggleDay(tracker._id)"
        />
      </div>
      <p v-if="userTrackers.length === 0">No trackers found.</p>
    </section>
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}

input {
  margin: 10px;
}

button {
  margin-left: 5px;
}
</style> -->

<script setup lang="ts">
import { ref, watch } from "vue";

const OptionTypes = {
    All: "All",
    Lifestyle: "Lifestyle",
    HealthAndFitness: "HealthAndFitness",
    Entertainment: "Entertainment",
    FoodAndCooking: "FoodandCooking",
    FashionAndBeauty: "FashionandBeauty",
    EducationAndDIY: "EducationandDIY",
};

const props = defineProps(["defaultCategory", "editingPost"]);

const options = props.editingPost ? [
    [OptionTypes.Lifestyle, "Lifestyle"],
    [OptionTypes.HealthAndFitness, "Health and Fitness"],
    [OptionTypes.Entertainment, "Entertainment"],
    [OptionTypes.FoodAndCooking, "Food and Cooking"],
    [OptionTypes.FashionAndBeauty, "Fashion and Beauty"],
    [OptionTypes.EducationAndDIY, "Education and DIY"],
] : [[OptionTypes.All, "All"], 
    [OptionTypes.Lifestyle, "Lifestyle"],
    [OptionTypes.HealthAndFitness, "Health and Fitness"],
    [OptionTypes.Entertainment, "Entertainment"],
    [OptionTypes.FoodAndCooking, "Food and Cooking"],
    [OptionTypes.FashionAndBeauty, "Fashion and Beauty"],
    [OptionTypes.EducationAndDIY, "Education and DIY"],
];

const selectedValue = ref(props.defaultCategory);
const emit = defineEmits(["update:selectedValue"]);

// Watch for changes to selectedValue and emit the new value
watch(selectedValue, (newValue) => {
    emit("update:selectedValue", newValue);
});

</script>

<template>
  <div class="dropdown">
    <select id="dropdown" v-model="selectedValue">
        <option v-for="option in options" :key="option[1]" :value="option[0]">
        {{ option[1] }}
        </option>
    </select>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
}
.dropdown-button {
  padding: 8px;
  cursor: pointer;
}
.dropdown-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  margin-top: 4px;
}
.dropdown-item {
  padding: 8px;
  cursor: pointer;
}
.dropdown-item:hover {
  background-color: #f0f0f0;
}
</style>

<template>
  <div class="min-h-screen">
    <JisKanaKeyboard :is-visible="isKeyboardVisible" @toggle="toggleKeyboard" />
    <router-view />
  </div>
</template>

<script setup>
import JisKanaKeyboard from './components/JisKanaKeyboard.vue';
import { useGlobalJisKeyboard } from './composables/useGlobalJisKeyboard.js';

const { isKeyboardVisible, toggleKeyboard } = useGlobalJisKeyboard();
</script>

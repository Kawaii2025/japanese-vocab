<template>
  <div class="min-h-screen">
    <router-view />
    <JisKanaKeyboard :is-visible="isKeyboardVisible" @toggle="toggleKeyboard" />
  </div>
</template>

<script setup>
import JisKanaKeyboard from './components/JisKanaKeyboard.vue';
import { useGlobalJisKeyboard } from './composables/useGlobalJisKeyboard.js';

const { isKeyboardVisible, toggleKeyboard } = useGlobalJisKeyboard();
</script>

import { ref, watch } from 'vue';

const STORAGE_KEY = 'global-jis-keyboard-visible';
const isVisible = ref(false);
let initialized = false;

function initialize() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  isVisible.value = window.localStorage.getItem(STORAGE_KEY) === 'true';

  watch(
    isVisible,
    (value) => {
      window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    },
    { flush: 'post' }
  );
}

export function useGlobalJisKeyboard() {
  initialize();

  function toggleKeyboard() {
    isVisible.value = !isVisible.value;
  }

  function showKeyboard() {
    isVisible.value = true;
  }

  function hideKeyboard() {
    isVisible.value = false;
  }

  return {
    isKeyboardVisible: isVisible,
    toggleKeyboard,
    showKeyboard,
    hideKeyboard
  };
}
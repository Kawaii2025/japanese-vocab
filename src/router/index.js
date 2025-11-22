import { createRouter, createWebHistory } from 'vue-router';
import Practice from '../views/Practice.vue';
import AddWords from '../views/AddWords.vue';

const routes = [
  {
    path: '/',
    name: 'Practice',
    component: Practice
  },
  {
    path: '/add',
    name: 'AddWords',
    component: AddWords
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;

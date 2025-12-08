import { createRouter, createWebHistory } from 'vue-router';
import Practice from '../views/Practice.vue';
import AddWords from '../views/AddWords.vue';
import AddWordsMobile from '../views/AddWordsMobile.vue';
import AddWordsTable from '../views/AddWordsTable.vue';
import Management from '../views/Management.vue';
import DebugAnswer from '../views/DebugAnswer.vue';
import NotFound from '../views/NotFound.vue';

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
  },
  {
    path: '/add-mobile',
    name: 'AddWordsMobile',
    component: AddWordsMobile
  },
  {
    path: '/add-table',
    name: 'AddWordsTable',
    component: AddWordsTable
  },
  {
    path: '/management',
    name: 'Management',
    component: Management
  },
  {
    path: '/debug-answer',
    name: 'DebugAnswer',
    component: DebugAnswer
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;

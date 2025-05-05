// src/router/index.js
import {createRouter, createWebHashHistory} from 'vue-router';
import Test from '../components/Test.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Test
  }
];

const router = createRouter()({
  history: createWebHashHistory(),
  routes
});

export default router;
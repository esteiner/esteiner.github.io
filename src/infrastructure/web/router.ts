import {type ActionResult, type Route, Router } from '@vaadin/router';

export const router = new Router();

export const routes: Route[] = [
  {
    path: '/',
    component: 'landing-page',
    name: 'landing-page',
    action: async () => (await import('./pages/landing-page.js')) as ActionResult,
  },
  {
    path: '/cellar/:cellarId',
    component: 'cellar-page',
    name: 'cellar-page',
    action: async () => (await import('./pages/cellar-page.js')) as unknown as ActionResult,
  },
  {
    path: '/order',
    component: 'order-page',
    name: 'order-page',
    action: async () => (await import('./pages/order-page.js')) as ActionResult,
  },
  {
    path: '/profile',
    component: 'profile-page',
    name: 'profile-page',
    action: async () => (await import('./pages/profile-page.js')) as ActionResult,
  },
  {
    path: '/cellarwork/:cellarId',
    component: 'cellarwork-page',
    name: 'cellarwork-page',
    action: async () => (await import('./pages/cellarwork-page.js')) as ActionResult,
  },
  {
    path: '(.*)',
    component: 'page-404',
    name: '404',
    action: async () => (await import('./pages/404-page.js')) as ActionResult,
  },
];

export async function initRouter(el: HTMLElement) {
  router.setOutlet(el);
  await router.setRoutes(routes);
}

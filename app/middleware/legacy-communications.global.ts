export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/broadcasts') return navigateTo('/communications', { redirectCode: 301 })
  if (to.path === '/notifications') return navigateTo('/inbox', { redirectCode: 301 })
})

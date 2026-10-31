export default defineNuxtPlugin({
  name: 'devtools-always-visible',
  async setup() {
    if (!import.meta.dev) return

    // DevTools 3.x stores panel visibility and inactivity in separate places.
    // Keep both in sync, including when its iframe restores saved preferences.
    const [{ useNuxtDevTools }, { settings }] = await Promise.all([
      import('@nuxt/devtools/dist/runtime/use-nuxt-devtools.js'),
      import('@nuxt/devtools/dist/runtime/settings.js')
    ])
    const devtools = useNuxtDevTools()
    const ui = reactive(settings.ui)
    const stop = watch(
      () => [devtools.value?.app.frameState.value.minimizePanelInactive, ui.showPanel, ui.minimizePanelInactive],
      () => {
        ui.showPanel = true
        ui.minimizePanelInactive = -1
        const frame = devtools.value?.app.frameState
        if (frame) frame.value.minimizePanelInactive = -1
      },
      { immediate: true }
    )

    import.meta.hot?.dispose(stop)
  }
})

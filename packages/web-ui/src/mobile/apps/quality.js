
export default {
  title: 'app.quality.title',
  icon: 'fa-check',
  active: null,
  color: '#3f6bb9',
  menu: [
    { name: 'controls', title: 'app.quality.title', icon: 'fa-tags', activeColor: '#31b7ac' },
    { name: 'configuration', title: 'app.quality.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isQualityAppEnable',
  userConfigKey: 'quality',
}

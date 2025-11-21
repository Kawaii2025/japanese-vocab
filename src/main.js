import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import toastPlugin from './utils/toast.js'
import './style.css'
import 'font-awesome/css/font-awesome.min.css'

const app = createApp(App)
app.use(router)
app.use(toastPlugin)
app.mount('#app')

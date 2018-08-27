import Vue from 'vue'
import App from './App.vue'
import axios from 'axios';

import router from './router'
import store from './store'

axios.defaults.baseURL = 'https://academind-vue-axios.firebaseio.com/';
//axios.defaults.headers.common['Authorization']='...';
axios.defaults.headers.get['Accepts']="application/json";

axios.interceptors.request.use( (config) => {
  console.log("Request config:", config);
  return config;
} );

axios.interceptors.response.use( (res) => {
  console.log("Response:", res);
  return res;
} )

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})

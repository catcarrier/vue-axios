import Vue from 'vue'
import Vuex from 'vuex'
import globalAxios from 'axios';
import axios from './axios-auth'; // custom instance
import router from './router';

const API_KEY = 'AIzaSyCXov8gTbwjnFb28IBRX4xz3lIlHUyXQUU';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null
  },
  mutations: {
    'AUTH_USER': (state, userData) => {
      state.idToken = userData.token;
      state.userId = userData.userId;
    },
    'STORE_USER': (state, userData) => {
      state.user = userData;
    },
    'CLEAR_AUTH': (state) => {
      state.idToken = null;
      state.userId = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpires');
    }

  },
  actions: {
    signup({ commit, dispatch }, formData) {
      const authData = {
        email: formData.email,
        password: formData.password,
        returnSecureToken: true
      };
      axios.post('signupNewUser?key=' + API_KEY, authData)
        .then(res => {

          //console.log('signup response', res);

          // firebase assigns the new user its own id and returns this as response.data.localId
          commit('AUTH_USER', {
            token: res.data.idToken,
            userId: res.data.localId
          });

          //console.log('done with AUTH_USER')

          // calculate the date when this token expires
          const now = new Date();
          const expirationDate = now.getTime() + (res.data.expiresIn * 1000);
          const newDate = new Date(expirationDate);

          // persist the token and its expiration date
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('tokenExpires', newDate);
          localStorage.setItem('userId', res.data.localId);

          // token expires in n seconds; set up automatic expiration in n seconds
          const expirationSeconds = res.data.expiresIn;
          dispatch('setAutoLogout', expirationSeconds);

          dispatch('storeUser', formData); /* store the original form-data not the auth version */


        })
        .catch(err => {
          console.log("signupNewUser err", err)
        });
    },

    storeUser({ commit }, userData) {
      // if there is no token in state, do nothing, the user is not authenticated
      if (!this.state.idToken) { return; }

      // firebase auth is done by passing the idtoken as query param
      globalAxios.post('users.json' + '?auth=' + this.state.idToken, userData)
        .then(res => {
          console.log('storeUser response', res);
          router.push('/dashboard');
        })
        .catch(err => { 'storeUser error', console.log(err) })
    },

    login({ commit, dispatch }, formData) {
      // See: https://firebase.google.com/docs/reference/rest/auth/#section-create-email-password
      const authData = {
        email: formData.email,
        password: formData.password,
        returnSecureToken: true
      };
      axios.post('verifyPassword?key=' + API_KEY, authData)
        .then(res => {
          console.log('login response', res);
          commit('AUTH_USER', {
            token: res.data.idToken,
            userId: res.data.localId
          });

          // calculate the date when this token expires
          const now = new Date();
          const expirationDate = now.getTime() + (res.data.expiresIn * 1000);
          const newDate = new Date(expirationDate);

          // persist the token and its expiration date
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('tokenExpires', newDate);
          localStorage.setItem('userId', res.data.localId);

          // token expires in n seconds; set up automatic expiration in n seconds
          const expirationSeconds = res.data.expiresIn;
          dispatch('setAutoLogout', expirationSeconds);

          router.push('dashboard');
        })
        .catch(err => {
          console.log('login error', err);
        });
    },

    tryAutoLogin({commit}) {
      // does local storage have an unexpired token?
      const token = localStorage.getItem("token");
      const tokenExpires = localStorage.getItem("tokenExpires");
      const userId = localStorage.getItem('userId');
      if (token && tokenExpires && userId) {
        const expirationDate = new Date(tokenExpires);
        const currentDate = new Date();
        if (expirationDate > currentDate) {

          commit('AUTH_USER', {
            token: token,
            userId: userId
          });
        }
      }
    },

    logout({ commit }) {
      commit('CLEAR_AUTH');
      router.replace('/');// No Back
    },

    setAutoLogout({ commit }, intervalSeconds) {
      setTimeout(
        () => {
          commit('CLEAR_AUTH');
          router.push('/');
        }, intervalSeconds * 1000);
    },

    fetchUser({ commit, state }) {
      if (!state.idToken) {
        return;
      }

      globalAxios.get('users.json' + '?auth=' + state.idToken)
        .then(res => {

          console.log(res.data);
          
          const data = res.data;
          const users = [];
          for (let key in data) {
            const user = data[key];
            user.id = key; // the firebase key
            users.push(user);
          }
          commit('STORE_USER', users[0]);
        })
        .catch(err => { console.log(err) })
    }
  },
  getters: {
    user: state => {
      return state.user
    },
    isAuthenticated: state => {
      return state.idToken !== null;
    }
  }
})
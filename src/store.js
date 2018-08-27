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
      console.log('STORE_USER:', userData);
      state.user = userData;
    },
    'CLEAR_AUTH': (state) => {
      state.idToken = null;
      state.userId = null;
      state.user=null;
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

          // firebase assigns the new user its own id and returns this as response.data.localId
          commit('AUTH_USER', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          dispatch('storeUser', formData); /* store the original form-data not the auth version */
        })
        .catch(err => {
          console.log(err)
        });
    },

    storeUser({ commit }, userData) {
      // if there is no token in state, do nothing, the user is not authenticated
      if(!this.state.idToken) { return; }

      // firebase auth is done by passing the idtoken as query param
      globalAxios.post('users.json' + '?auth=' + this.state.idToken, userData)
        .then(res => { console.log(res) })
        .catch(err => { console.log(err) })
    },

    login({ commit }, formData) {
      // See: https://firebase.google.com/docs/reference/rest/auth/#section-create-email-password
      const authData = {
        email: formData.email,
        password: formData.password,
        returnSecureToken: true
      };
      axios.post('verifyPassword?key=' + API_KEY, authData)
        .then(res => {
          // console.log(res);
          commit('AUTH_USER', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          router.push('dashboard');
        })
        .catch(err => {
          console.log(err);
        });
    },

    logout({commit}) {
      commit('CLEAR_AUTH');
      router.replace('/'); // No Back
    },

    fetchUser({ commit, state }) {
      if(!state.idToken) { 
        return; 
      } // not authenticated

      globalAxios.get('users.json'+ '?auth=' + state.idToken)
        .then(res => {
          console.log('ures:', res)
          const data = res.data;
          const users = [];
          for (let key in data) {
            const user = data[key];
            user.id = key; // the firebase key
            users.push(user);
          }
          console.log('users:',users);
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
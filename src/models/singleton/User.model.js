/*
  Author: Sreenivas Doosa
*/


class User {
  constructor() {
    this.user = {};
  }

  setUserInfo(user) {
    this.user.info = user;
  }

  setUserSetting(setting) {
    this.user.setting = setting;
  }

  getUser() {
    return this.user;
  }
}

module.exports = new User(); // singleton

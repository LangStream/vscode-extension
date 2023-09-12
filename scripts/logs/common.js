'use strict';

export default class Common {
  static createUUID (ele) {
    ele.value = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  static showError(text) {
    document.getElementById('pageError').classList.remove('d-none');
    document.getElementById('pageError').innerText = text;
  }
  static showInfo(text) {
    document.getElementById('pageMessage').classList.remove('d-none');
    document.getElementById('pageMessage').innerText = text;
  }
};

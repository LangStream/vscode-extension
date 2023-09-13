'use strict';

export default class Common {
  static showError(text) {
    document.getElementById('pageError').classList.remove('d-none');
    document.getElementById('pageError').innerText = text;
  }
  static showInfo(text) {
    document.getElementById('pageMessage').classList.remove('d-none');
    document.getElementById('pageMessage').innerText = text;
  }
};

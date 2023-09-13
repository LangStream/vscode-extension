'use strict';
/* eslint-disable @typescript-eslint/naming-convention */

import LogsMessenger from './messenger.js';
import LogListingView from "./views/logsListing.js";

//=============================================================================
// GLOBAL CONSTANTS
//=============================================================================
const bodyTheme = document.querySelector('body')?.getAttribute('data-vscode-theme-kind');
if (bodyTheme) {
  if(bodyTheme === 'vscode-light') {
    document.querySelector('html')?.setAttribute('data-bs-theme', 'light');
  }else{
    document.querySelector('html')?.setAttribute('data-bs-theme', 'dark');
  }
}

//=============================================================================
// LOAD PAGE
//=============================================================================
window.addEventListener('load', () => {
  const messenger = new LogsMessenger();
  messenger.initialize();

  new LogListingView(messenger).initialize();

  messenger.sendMessage("ready");
});
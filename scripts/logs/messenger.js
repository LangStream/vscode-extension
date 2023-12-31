'use strict';
/* eslint-disable @typescript-eslint/naming-convention */

import AppLogMessage from "./appLogMessage.js";
import MessageManager from "./messageManager.js";
import Common from "./common.js";

export default class LogsMessenger {
  messageManager;
  vscode = acquireVsCodeApi();
  abortController;

  constructor(msgManager) {
    this.abortController = new AbortController();
    this.messageManager = msgManager;
  }
  start(){
    this.abortController = new AbortController();
    this.initialize();
  }
  stop(){
    this.abortController.abort();
  }
  initialize() {
    if (this.messageManager === undefined || this.messageManager === null) {
      this.messageManager = new MessageManager();
    }

    const options = {
      signal: this.abortController?.signal
    };

    window.addEventListener('message', event => {
      try {
        this.handleMessage(event);
      } catch (err) {
        Common.showError(`Error handling message: ${err}`);
      }
    }, options);
  }
  handleMessage(event) {
    const messageData = event.data; // The JSON data from the extension

    switch(messageData.command){
      case 'error':
        Common.showError(`${messageData.text}`);
        break;
      case "connection" :
        document.getElementById("retry-messages").classList.remove("d-none");
        document.getElementById("watching-messages").classList.remove("d-none");
        switch(messageData.text){
          case "opened":
            document.getElementById("retry-messages").classList.add("d-none");
            break;
          case "closed":
            document.getElementById("watching-messages").classList.add("d-none");
            break;
        }
        break;
      case "appLog" :
        const appLogMessage = AppLogMessage.tryCast(messageData.text);
        if (appLogMessage === undefined || appLogMessage === null) {
          throw new Error(`${messageData.text}`);
        }

        this.messageManager.add(appLogMessage);
        break;
      default: // info
        Common.showInfo(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
        break;
    }
  }
  sendMessage(command, text) {
    const message = { command: command, text: text};
    this.vscode.postMessage(message);

    console.info(`[${command}] ${text}`);
  }
}
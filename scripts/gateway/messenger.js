'use strict';
/* eslint-disable @typescript-eslint/naming-convention */

import ConsumePushMessage from "./consumePushMessage.js";
import ProduceResponse from "./produceResponse.js";
import MessageManager from "./messageManager.js";
import Common from './Common.js';

export default class GatewayMessenger {
  messageManager;
  produceTimeoutMs = 100000;
  vscode = acquireVsCodeApi();

  constructor(msgManager) {
    this.messageManager = msgManager;

    if (this.messageManager === undefined || this.messageManager === null) {
      this.messageManager = new MessageManager();
    }

    window.addEventListener('message', event => {
      try{
        this.handleMessage(event);
      }catch (err){
        Common.showError(`Error handling message: ${err}`);
      }
    });
  }

  sendModalMessage(gatewayId, key, headers, value) {
    if (gatewayId === undefined || gatewayId === null || gatewayId.length < 1) {
      window.prompt("Gateway ID is required. Close the window, choose a gateway, and try again.");
      return;
    }

    this.sendMessage("userMessage", value, gatewayId, headers, key);
  }

  sendMessage(command, text, gatewayId, headers, key) {
    const msg = {
      command: command,
      text: text,
      gatewayId: gatewayId,
      headers: headers,
      key: key,
      timeoutMs: this.produceTimeoutMs
    };

    this.vscode.postMessage(msg);
  }

  handleMessage(message) {
    //console.debug("Received message from extension", message);
    const messageData = message.data; // The JSON data from the extension

    switch (messageData.command) {
      case 'error':
        throw new Error(`[${messageData.gatewayId ?? ""}]${messageData.text}`);

      case "connection" :
        const gatewayElement = document.getElementById(messageData.gatewayId);
        if (gatewayElement === undefined || gatewayElement === null) {
          break;
        }

        document.getElementById(messageData.gatewayId).innerText = messageData.text ?? "Unknown";
        document.getElementById(messageData.gatewayId).classList.remove("text-success", "text-warning", "text-danger");

        switch (messageData.text) {
          case "connected":
          case "opened":
            document.getElementById(messageData.gatewayId).classList.add("text-success");
            break;
          case "connecting":
            document.getElementById(messageData.gatewayId).classList.add("text-warning");
            break;
          default:
            document.getElementById(messageData.gatewayId).classList.add("text-danger");
            break;
        }
        break;

      case "produceResponse" :
        const produceResponse = ProduceResponse.tryCast(messageData.text);
        if (produceResponse === undefined || produceResponse === null) {
          throw new Error(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
        }

        this.messageManager.add(messageData.gatewayId, produceResponse, messageData.contentType);
        break;

      case "consumeMessage" :
        const consumePushMessage = ConsumePushMessage.tryCast(messageData.text);
        if (consumePushMessage === undefined || consumePushMessage === null) {
          throw new Error(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
        }

        this.messageManager.add(messageData.gatewayId, consumePushMessage, messageData.contentType);
        break;

      default:
        Common.showInfo(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
        break;
    }
  }
}

import * as vscode from "vscode";
import {WebSocket} from "ws";
import GatewayMessagesDocument from "./gatewayMessagesDocument";
import Logger from "../../common/logger";
import {AgentConfiguration, GatewayTypeEnum} from "../../services/controlPlaneApi/gen";
import GatewayMessenger from "./messenger";
import {IGateway} from "../../interfaces/iGateway";
import GatewayMessageDocumentContent from "./gatewayMessageDocumentContent";
import {ToWebviewMessageCommandEnum} from "../../types/tToWebviewMessage";
import GatewayWebSocket from "../../services/gatewayWebSocket";
import {ToWebviewMessage} from "./toWebviewMessage";
import {ConsumePushMessage} from "./consumePushMessage";
import {Record} from "./record";

export default class GatewayCustomEditorProvider implements vscode.CustomReadonlyEditorProvider<GatewayMessagesDocument> {
  private readonly webSocketTimeoutMs = 10000;
  private readonly messengers: GatewayMessenger<GatewayTypeEnum>[];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.messengers = [];
  }

  private get isWindowRefresh(): boolean {
    return (this.messengers.length > 0);
  }

  private disposeMessengers(): void {
    this.messengers.forEach((messenger) => {
      messenger.dispose(true);
    });
  }

  private handleMessageFromWebview(webview: vscode.Webview, documentContent: GatewayMessageDocumentContent, message: any): void {
    Logger.debug("Received message from webview");
    Logger.debug(message);

    message = message as IFromWebviewMessage;

    switch (message.command) {
      case FromWebviewMessageCommandEnum.setAuthToken:
        const token = (message.text === "" || message.text === null ? undefined : message.text);

        const clientConsumerGateway = documentContent.consumerGateways.find((gateway) => { return gateway.id === message.gatewayId; });
        if(clientConsumerGateway !== undefined) {
          clientConsumerGateway.authorizationToken = token;
        }

        const clientProducerGateway = documentContent.producerGateways.find((gateway) => { return gateway.id === message.gatewayId; });
        if(clientProducerGateway !== undefined) {
          clientProducerGateway.authorizationToken = token;
        }

        break;

      case FromWebviewMessageCommandEnum.setParamValue:
        const param = message.text as {key: string, value:string};

        const paramConsumerGateway = documentContent.consumerGateways.find((gateway) => { return gateway.id === message.gatewayId; });
        if(paramConsumerGateway !== undefined) {
          if(paramConsumerGateway.parameterValues === undefined) {
            paramConsumerGateway.parameterValues = {};
          }

          paramConsumerGateway.parameterValues[param.key] = param.value;
        }

        const paramProducerGateway = documentContent.producerGateways.find((gateway) => { return gateway.id === message.gatewayId; });
        if(paramProducerGateway !== undefined) {
          if(paramProducerGateway.parameterValues === undefined) {
            paramProducerGateway.parameterValues = {};
          }

          paramProducerGateway.parameterValues[param.key] = param.value;
        }

        break;

      case FromWebviewMessageCommandEnum.ready:
        if (this.isWindowRefresh) { //The websocket is already open, most likely because the tab lost focus
          this.refreshMessengerState(webview, true);
          break;
        }

        this.connectMessengers(webview, documentContent);

        break;

      case FromWebviewMessageCommandEnum.userMessage:
        const producerGatewayWebSocket = documentContent.producerGatewayWebSockets.find((gatewayWebSocket) => {
          return (gatewayWebSocket.gatewayId === message.gatewayId);
        });

        if (producerGatewayWebSocket === undefined) {
          Logger.warn("Received message from unknown gateway: %o", message);
          break;
        }

        Logger.info(`Sending message to gateway ${producerGatewayWebSocket.gatewayId}`);

        GatewayMessenger.addGatewaySearchParams(producerGatewayWebSocket.websocketBaseUrl, message.params, message.options, message.cred);

        this.handleMessageToGateway(webview, producerGatewayWebSocket, message);

        break;
    }
  }

  private handleMessageToGateway(webview: vscode.Webview, producerGatewayWebSocket: GatewayWebSocket, message: IFromWebviewMessage): void {
    const messenger = new GatewayMessenger(GatewayTypeEnum.produce, producerGatewayWebSocket.gatewayId, (message) => { webview.postMessage(message); });

    messenger.connect(producerGatewayWebSocket.websocketBaseUrl, this.webSocketTimeoutMs).then(() => {
      const record = new Record(message.headers, message.key, message.text);

      Logger.debug("Sending message to gateway");
      Logger.debug(record);

      messenger.sendMessageToGateway(record, message.sendTimeoutMs);
      Logger.debug(`Successfully sent message to gateway ${message.gatewayId}`);
    }).catch((error: any) => {
      Logger.warn(`Error connecting to gateway with URL ${producerGatewayWebSocket.websocketBaseUrl}`);
      Logger.warn(error);
      const webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.error, "errored - " + error.message, message.gatewayId);
      messenger.postMessageToWebview(webViewMessage);
    }).finally(() => {
      messenger.dispose();
    });
  }

  private connectMessengers(webview: vscode.Webview, documentContent: GatewayMessageDocumentContent): void {
    Logger.debug("Connecting messengers");
    const socketConnectPromises: Promise<void>[] = [];

    documentContent.consumerGatewayWebSockets.forEach((consumerGatewayWebSocket) => {
      GatewayMessenger.addGatewaySearchParams(consumerGatewayWebSocket.websocketBaseUrl);
      consumerGatewayWebSocket.websocketBaseUrl.searchParams.set('option:position', 'latest');

      const messenger = new GatewayMessenger(GatewayTypeEnum.consume, consumerGatewayWebSocket.gatewayId, (message) => { webview.postMessage(message); });

      socketConnectPromises.push(messenger.connect(consumerGatewayWebSocket.websocketBaseUrl, this.webSocketTimeoutMs).then(() => {
        this.messengers.push(messenger);
      }));
    });

    Promise.all(socketConnectPromises).then(() => {
    }).catch((error: any) => {
      Logger.warn("Error connecting to gateway");
      Logger.warn(error);

      const webviewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.error, "errored - " + error.message);
      webview.postMessage(webviewMessage);
    });
  }

  private refreshMessengerState(webview: vscode.Webview, postMessageCache:boolean = true): void {
    Logger.debug("Refreshing messenger state");
    this.messengers.forEach((messenger) => {
      let webViewMessage: ToWebviewMessage | undefined = undefined;

      switch (messenger.connectionState) {
        case WebSocket.OPEN:
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "opened", messenger.gatewayId);
          break;
        case WebSocket.CONNECTING:
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "connecting", messenger.gatewayId);
          break;
        case WebSocket.CLOSING:
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "closing", messenger.gatewayId);
          break;
        case WebSocket.CLOSED:
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "closed", messenger.gatewayId);
          break;
      }

      if (webViewMessage !== undefined) {
        messenger.postMessageToWebview(webViewMessage);
      }

      if(postMessageCache) {
        messenger.messages.forEach((message) => {
          webview.postMessage(message);
        });
      }
    });
  }

  private buildView(panel: vscode.WebviewPanel, displayTitle: string, producerGateways: IGateway[], consumerGateways: IGateway[], agents: AgentConfiguration[]): void {
    const gatewayIndexPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'gateway', 'index.js');
    const gatewayIndexUri = panel.webview.asWebviewUri(gatewayIndexPathOnDisk);
    const listMinPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'libs', 'list.min.js');
    const listMinUri = panel.webview.asWebviewUri(listMinPathOnDisk);
    const bootstrapJsOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'libs', 'bootstrap.bundle.min.js');
    const bootstrapJsUri = panel.webview.asWebviewUri(bootstrapJsOnDisk);
    const stylePath = vscode.Uri.joinPath(this.context.extensionUri, 'styles', 'bootstrap.min.css');
    const stylesUri = panel.webview.asWebviewUri(stylePath);
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'html', 'gatewayCustomEditor.html');

    vscode.workspace.openTextDocument(htmlPath).then((htmlDoc) => {
      let htmlDocText = htmlDoc.getText();
      htmlDocText = htmlDocText.replace(/CSPSOURCE/g, panel.webview.cspSource)
        .replace("STYLESURI", stylesUri.toString())
        .replace("PRODUCERGATEWAYS", JSON.stringify(producerGateways))
        .replace("CONSUMERGATEWAYS", JSON.stringify(consumerGateways))
        .replace("AGENTS", JSON.stringify(agents))
        .replace("BOOTSTRAPJSURI", bootstrapJsUri.toString())
        .replace("LISTMINURI", listMinUri.toString())
        .replace("GATEWAYINDEX", gatewayIndexUri.toString())
        .replace("TITLE", displayTitle);

      panel.webview.html = htmlDocText;
    });
  }

  public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Thenable<GatewayMessagesDocument> | GatewayMessagesDocument {
    return GatewayMessagesDocument.create(uri, openContext.backupId); //let vscode catch errors
  }

  public resolveCustomEditor(gatewayMessagesDocument: GatewayMessagesDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void {
    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true
    };

    webviewPanel.onDidDispose(() => {
      this.disposeMessengers();
      gatewayMessagesDocument.dispose();
    });

    // webviewPanel.onDidChangeViewState(async () => {
    //   webviewPanel.visible;
    //   webviewPanel.active;
    // });

    token.onCancellationRequested(() => { webviewPanel.dispose(); });

    webviewPanel.webview.onDidReceiveMessage((message: any) => { this.handleMessageFromWebview(webviewPanel.webview, gatewayMessagesDocument.content, message); });

    this.buildView(webviewPanel,
      `${gatewayMessagesDocument.uri.path}`,
      gatewayMessagesDocument.content.producerGateways,
      gatewayMessagesDocument.content.consumerGateways,
      gatewayMessagesDocument.content.agents);
  }
}

interface IFromWebviewMessage {
  command: FromWebviewMessageCommandEnum;
  text?: string;
  gatewayId?: string;
  headers?: { [key: string]: string; };
  params?: { [key: string]: string; };
  options?: { [key: string]: string; };
  cred?: string;
  key?: string;
  sendTimeoutMs: number;
}

enum FromWebviewMessageCommandEnum {
  setParamValue = "setParamValue",
  setAuthToken = "setAuthToken",
  ready = "ready",
  userMessage = "userMessage"
}


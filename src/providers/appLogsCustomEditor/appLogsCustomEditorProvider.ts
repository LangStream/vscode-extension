import * as vscode from "vscode";
import AppLogsDocument from "./appLogsDocument";
import Logger from "../../common/logger";
import axios, {CancelTokenSource} from "axios";
import * as path from "path";
import {sleep} from "../../utils/sleep";
import AppLogsDocumentContent from "./appLogsDocumentContent";
import {ToWebviewMessage} from "./toWebviewMessage";
import {ToWebviewMessageCommandEnum} from "../../types/tToWebviewMessage";
import AppLogMessage from "./appLogMessage";

export default class AppLogsCustomEditorProvider implements vscode.CustomReadonlyEditorProvider<AppLogsDocument> {
  private readonly messageCache: AppLogMessage[];
  private cancellationTokenSource: CancelTokenSource | undefined = undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.messageCache = [];
  }

  private get isWindowRefresh(): boolean {
    return (this.cancellationTokenSource !== undefined);
  }

  private buildView(panel: vscode.WebviewPanel, displayTitle:string): void {
    const logsIndexPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'logs', 'index.js');
    const logsIndexUri = panel.webview.asWebviewUri(logsIndexPathOnDisk);
    const listMinPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'libs', 'list.min.js');
    const listMinUri = panel.webview.asWebviewUri(listMinPathOnDisk);
    const bootstrapJsOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts', 'libs', 'bootstrap.bundle.min.js');
    const bootstrapJsUri = panel.webview.asWebviewUri(bootstrapJsOnDisk);
    const stylePath = vscode.Uri.joinPath(this.context.extensionUri, 'styles','bootstrap.min.css');
    const stylesUri = panel.webview.asWebviewUri(stylePath);
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'html', 'appLogsCustomEditor.html');

    vscode.workspace.openTextDocument(htmlPath).then((htmlDoc) => {
      let htmlDocText = htmlDoc.getText();
      htmlDocText = htmlDocText.replace(/CSPSOURCE/g, panel.webview.cspSource)
                                          .replace("STYLESURI", stylesUri.toString())
                                          .replace("BOOTSTRAPJSURI", bootstrapJsUri.toString())
                                          .replace("LISTMINURI", listMinUri.toString())
                                          .replace("LOGSINDEX", logsIndexUri.toString())
                                          .replace("TITLE", displayTitle);

      panel.webview.html = htmlDocText;
    });
  }

  private handleMessageFromWebview(webview: vscode.Webview,
                                   documentContent: AppLogsDocumentContent,
                                   message: any): void {
    Logger.info("Received message");
    Logger.info(message);

    switch(message.command){
      case "connection":
        switch(message.text){
          case "close":
            Logger.info("Closing logs stream");
            this.cancellationTokenSource?.cancel('Close stream');
            this.cancellationTokenSource = undefined;

            webview.postMessage(new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "closed"));
            break;
        }
        break;
      case "ready":
        if (this.isWindowRefresh) { //The websocket is already open, most likely because the tab lost focus
          this.refreshStreamState(webview, true);
          break;
        }

        // Do not await, let it run in the background
        this.openLogsStream(webview, documentContent);
        break;
    }
  }

  private async openLogsStream(webview: vscode.Webview, documentContent: AppLogsDocumentContent): Promise<void> {
    const cancellationToken = axios.CancelToken;
    this.cancellationTokenSource = cancellationToken.source();

    const url = new URL(documentContent.webServiceUrl);
    url.pathname = path.join("api", "applications", documentContent.tenantName, documentContent.applicationId, "logs");

    if(documentContent.workerFilters !== undefined){
      url.searchParams.set("filter", documentContent.workerFilters.join(","));
    }

    Logger.debug("Opening logs stream to " + url.href);

    return axios({
      method: 'get',
      headers: {
        accept: 'application/x-ndjson'
      },
      url: url.href,
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
      responseType: "stream",
      maxRedirects: 0, // avoid buffering the entire stream,
      cancelToken: this.cancellationTokenSource.token
    }).then(async (axiosResponse) => {
      if (axiosResponse === undefined) {
        Logger.error("No response from logs stream");
        return;
      }

      const stream = axiosResponse.data;

      webview.postMessage(new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "opened"));

      stream.on('data', (data: any) => {
        if (data === undefined) {
          return;
        }

        const appLogMessage = AppLogMessage.tryCast(data.toString());
        if (appLogMessage === undefined) {
          Logger.warn("Failed to parse log message");
          Logger.debug(data.toString());
          return;
        }

        // Drop the message if it's a repeat
        if(this.messageCache.findIndex((message) => message.hash === appLogMessage.hash) !== -1){
          return;
        }

        this.messageCache.push(appLogMessage);

        const webviewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.appLog, appLogMessage);
        webview?.postMessage(webviewMessage);
      });

      // Block until the stream is closed
      while (!stream.complete && this.cancellationTokenSource !== undefined) {
        await sleep(2000);
      }

      webview?.postMessage(new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "closed"));
    }).catch((err: any) => {
      webview.postMessage(new ToWebviewMessage(ToWebviewMessageCommandEnum.error, "errored - " + err.message));
    });
  }

  private refreshStreamState(webview: vscode.Webview, postMessageCache:boolean = true): void {
    Logger.debug("Refreshing socket state");

    webview.postMessage(new ToWebviewMessage(ToWebviewMessageCommandEnum.connection, "opened"));

    if(postMessageCache) {
      this.messageCache.forEach((appLogMessage) => {
        const webviewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.appLog, appLogMessage);
        webview.postMessage(webviewMessage);
      });
    }
  }

  public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Thenable<AppLogsDocument> | AppLogsDocument {
    Logger.info("Opening custom document");
    return AppLogsDocument.create(uri, openContext.backupId); //let vscode catch errors
  }

  public async resolveCustomEditor(appLogsDocument: AppLogsDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true
    };

    webviewPanel.onDidDispose(async () => {
      Logger.info("Closing logs stream");
      this.cancellationTokenSource?.cancel('Close stream');
      this.cancellationTokenSource = undefined;
      appLogsDocument.dispose();
    });

    token.onCancellationRequested(() => {
      webviewPanel.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((message: any) => { this.handleMessageFromWebview(webviewPanel.webview, appLogsDocument.content, message); });

    this.buildView(webviewPanel, `${appLogsDocument.uri.path}`);
  }
}
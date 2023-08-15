import * as vscode from "vscode";
import AppLogsDocument from "./appLogsDocument";
import Logger from "../../common/logger";
import axios, {AxiosRequestConfig, CancelToken, CancelTokenSource} from "axios";
import * as path from "path";
import {sleep} from "../../utils/sleep";
import {CancellationToken} from "vscode";

export default class AppLogsCustomEditorProvider implements vscode.CustomReadonlyEditorProvider<AppLogsDocument> {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Thenable<AppLogsDocument> | AppLogsDocument {
    Logger.info("Opening custom document");
    return AppLogsDocument.create(uri, openContext.backupId); //let vscode catch errors
  }

  public async resolveCustomEditor(appLogsDocument: AppLogsDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
    const cancellationToken = axios.CancelToken;
    let source: CancelTokenSource | undefined = undefined;

    const url = new URL(appLogsDocument.content.webServiceUrl);
    url.pathname = path.join("api", "applications", appLogsDocument.content.tenantName, appLogsDocument.content.applicationId, "logs");

    if(appLogsDocument.content.workerFilters !== undefined){
      url.searchParams.set("filter", appLogsDocument.content.workerFilters.join(","));
    }

    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true
    };

    webviewPanel.onDidDispose(async () => {
      Logger.info("Closing logs stream");
      source?.cancel('Close stream');
      source = undefined;
    });

    token.onCancellationRequested(() => {
      webviewPanel.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((message) => {
      // Logger.info("Received message");
      // Logger.info(message);

      switch(message.command){
        case "connection":
          switch(message.text){
            case "close":
              Logger.info("Closing logs stream");
              source?.cancel('Close stream');
              source = undefined;
              break;
          }
          break;
        case "ready":
          source = cancellationToken.source();
          Logger.info("Opening logs stream");

          axios({
            method: 'get',
            headers: {
              accept: 'application/x-ndjson'
            },
            url: url.href,
            transformRequest: axios.defaults.transformRequest,
            transformResponse: axios.defaults.transformResponse,
            responseType: "stream",
            maxRedirects: 0, // avoid buffering the entire stream,
            cancelToken: source.token
          }).then(async (axiosResponse) => {
            if (axiosResponse === undefined) {
              Logger.error("No response from logs stream");
              return;
            }

            const stream = axiosResponse.data;

            webviewPanel.webview.postMessage({command: "connection", text: "opened"});

            stream.on('data', (data: any) => {
              try{
                webviewPanel?.webview?.postMessage({command: "appLog", text: data.toString()});
              }catch{
                //no op because the webview may have been disposed
              }
            });

            while (!stream.complete && source !== undefined) {
              await sleep(1000);
            }

            try{
              webviewPanel.webview.postMessage({command: "connection", text: "closed"});
            }catch{
              //no op because the webview may have been disposed
            }
          }).catch((err: any) => {
            webviewPanel?.webview?.postMessage({command: "error", text: "errored - " + err.message});
          });
          break;
      }
    });

    webviewPanel.webview.html = this.buildView(webviewPanel, `${appLogsDocument.uri.path}`);
  }

  private buildView(panel: vscode.WebviewPanel, displayTitle:string): string {
    const appLogsPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','appLogs.js');
    const appLogsUri = panel.webview.asWebviewUri(appLogsPathOnDisk);
    const listMinPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','list.min.js');
    const listMinUri = panel.webview.asWebviewUri(listMinPathOnDisk);
    const msgMrgPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','logManager.js');
    const msgMrgUri = panel.webview.asWebviewUri(msgMrgPathOnDisk);
    const bootstrapJsOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','bootstrap.bundle.min.js');
    const bootstrapJsUri = panel.webview.asWebviewUri(bootstrapJsOnDisk);
    const stylePath = vscode.Uri.joinPath(this.context.extensionUri, 'styles','bootstrap.min.css');
    const stylesUri = panel.webview.asWebviewUri(stylePath);

    return `
    <!DOCTYPE html>
    <html lang="en" data-bs-theme="dark">
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${panel.webview.cspSource}; img-src ${panel.webview.cspSource} https:; script-src 'unsafe-inline' ${panel.webview.cspSource};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesUri}" rel="stylesheet">
      <meta charset="UTF-8">
      <title>${displayTitle}</title>
      <style>
        #messages-container {
          height: 80%;
          overflow: auto;
          display: flex;
          flex-direction: column-reverse;
        }
      </style>
      </head>
      <body class="vsCodePulsarAdminWizard">
        <div class="container " style="height: 97vh!important;">
           <div class="row mb-2">
             <div class="col-12">
                <div class="alert alert-info d-none" role="alert" id="pageMessage"></div>
                <div class="alert alert-danger d-none" role="alert" id="pageError"></div>
             </div>
          </div>
          <div class="row overflow-y-scroll" style="height: 96%!important;">
            <div class="col-12 h-100" id="messages-container">
              <div class="" id="messages-list" class="list-group"><div class="list"></div></div>
            </div>
          </div>
          <div class="row mt-4">
            <div class="col-12">
              <div class="d-none" id="retry-messages">
                Connection closed. <a href="#" id="retry-messages-link" onclick="reconnectSocket();">Retry</a>.
              </div>
              <div class="d-none" id="watching-messages">
               Watching for messages. <a href="#" id="retry-messages-link" onclick="closeSocket();">Close</a>.
              </div>
            </div>
           </div>
        </div>
        <script src="${bootstrapJsUri}"></script>
        <script src="${listMinUri}"></script>
        <script src="${msgMrgUri}"></script>
        <script src="${appLogsUri}"></script>
      </body>
      </html>
    `;
  }
}
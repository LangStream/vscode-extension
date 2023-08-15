import * as vscode from "vscode";
import {ErrorEvent, MessageEvent, WebSocket} from "ws";
import GatewayMessagesDocument from "./gatewayMessagesDocument";
import Logger from "../../common/logger";
import {AgentConfiguration, Gateway} from "../../services/controlPlaneApi/gen";

export default class GatewayCustomEditorProvider implements vscode.CustomReadonlyEditorProvider<GatewayMessagesDocument> {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Thenable<GatewayMessagesDocument> | GatewayMessagesDocument {
    //Logger.info("Opening custom document");
    return GatewayMessagesDocument.create(uri, openContext.backupId); //let vscode catch errors
  }

  public async resolveCustomEditor(gatewayMessagesDocument: GatewayMessagesDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
    const gatewayWebSockets: [gateway:Gateway, websocket:WebSocket][] = [];
    //let webRequestArgs: ClientRequestArgs | undefined = undefined;

    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true
    };

    webviewPanel.onDidDispose(async () => {
      gatewayWebSockets.forEach(([gateway, webSocket]) => {
        try{
          Logger.info("Closing gateway socket " +  gateway.id);
          webSocket.close(); // no matter what state the socket is in, attempt to close
        }catch(e){
          Logger.error('Closing sockets', e);
        }
      });
    });

    token.onCancellationRequested(() => {
      webviewPanel.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((message) => {
      // Logger.info("Received message");
      // Logger.info(message);
      switch(message.command){
        case "ready":
          if(gatewayWebSockets?.length > 0){
          //   // // The webview has been reset, re-send the messages
          //   // GatewayMessagesDocument.content.messages.forEach((message: TTopicMessage) => {
          //   //   webviewPanel.webview.postMessage(message);
          //   // });
          //
          //   switch(websocket.readyState){
          //     case WebSocket.OPEN:
          //       webviewPanel.webview.postMessage({command: "connection", text: "opened"});
          //       break;
          //     case WebSocket.CLOSED:
          //       webviewPanel.webview.postMessage({command: "connection", text: "closed"});
          //       break;
          //     case WebSocket.CLOSING:
          //       webviewPanel.webview.postMessage({command: "connection", text: "closing"});
          //       break;
          //     case WebSocket.CONNECTING:
          //       webviewPanel.webview.postMessage({command: "connection", text: "connecting"});
          //       break;
          //   }
          //
            break; //The websocket is already open, most likely because the user moved the tab
          }

          gatewayMessagesDocument.content.gatewayWebSockets.forEach((gatewayWebSocket) => {
            try{
              const websocket = new WebSocket(gatewayWebSocket.webSocketUrl);

              websocket.onopen = () => {
                webviewPanel.webview.postMessage({command: "connection", text: "opened", gatewayId: gatewayWebSocket.gateway.id});
              };

              websocket.onerror = (e: ErrorEvent) => {
                webviewPanel.webview.postMessage({command: "error", text: "errored - " + e.message, gatewayId: gatewayWebSocket.gateway.id});
              };

              websocket.onclose = () => {
                try{
                  webviewPanel.webview.postMessage({command: "connection", text: "closed", gatewayId: gatewayWebSocket.gateway.id});
                }catch{
                  //no op because the webview may have been disposed
                }
              };

              websocket.onmessage = async (e: MessageEvent) => {
                //const readerMessage = gatewayMessage.fromWsMessage(e);
                // Logger.info("Received message from gateway");
                // Logger.info(e);
                webviewPanel?.webview?.postMessage({command: "gatewayMessage", text: e, gatewayId: gatewayWebSocket.gateway.id});
              };

              gatewayWebSockets.push([gatewayWebSocket.gateway, websocket]);
            }catch (e:any) {
              webviewPanel.webview.postMessage({command: "error", text: "errored - " + e.message, gatewayId: gatewayWebSocket.gateway.id});
            }
          });
          break;
        case("userMessage"):
          const gatewayWebSocket = gatewayWebSockets?.find(([gateway]) => { return (gateway.id === message.gatewayId); });
          if(gatewayWebSocket === undefined){
            Logger.warn("Received message from unknown gateway: %o", message);
            break;
          }

          if(gatewayWebSocket[1].readyState !== WebSocket.OPEN){
            Logger.warn("Received message for gateway with closed socket: %o", message);
            break;
          }

          gatewayWebSocket[1].send(message.text, (error) => {
            Logger.error("Sending message to gateway", error);
          });

          break;
      }
    });

    webviewPanel.webview.html = this.buildView(webviewPanel,
      `${gatewayMessagesDocument.uri.path}`,
      gatewayMessagesDocument.content.gatewayWebSockets,
      gatewayMessagesDocument.content.agents);
  }

  private buildView(panel: vscode.WebviewPanel, displayTitle:string, gatewayWebSockets: {gateway: Gateway, webSocketUrl: URL}[], agents:AgentConfiguration[]): string {
    const gateMsgPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','gatewayMessages.js');
    const gatewayMsgUri = panel.webview.asWebviewUri(gateMsgPathOnDisk);
    const listMinPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','list.min.js');
    const listMinUri = panel.webview.asWebviewUri(listMinPathOnDisk);
    const msgMrgPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'scripts','messageManager.js');
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
          <div class="row h-100">
            <div class="col-3">
              <div class="row h-50">
                <div class="col-12 pb-4">
                <div class="card h-100">
  <div class="card-header">Agents</div>
  <div class="card-body overflow-scroll"><ul id="agents-list"></ul></div>
</div>
</div>
              </div>
              <div class="row h-50">
                <div class="col-12">
                <div class="card h-100">
  <div class="card-header">Gateways</div>
  <div class="card-body overflow-scroll"><ul id="gateways-list" class="list-group"></ul></div>
</div>
</div>
              </div>
            </div>
            <div class="col-9">
              <div class="" id="messages-container" style="height: 93%!important;">
                <div class="col-12 no-gutters bg-light-subtle border rounded h-100 p-2" id="messages-list" class="list-group"><div class="list"></div></div>
              </div>
              <div class="row mt-4">
                <div class="col-12">
                  <div class="input-group d-none" id="producer-message-form">
                    <textarea class="form-control" aria-label="Message" id="message-text" aria-describedby="button-addon2" style="width: 59%!important;" onkeyup="enableButton()"></textarea>
                    <select class="form-select" id="producer-gateway-id" aria-label="Choose gateway" style="width: 3%!important;" onchange="enableButton()">
                      <option value="" selected>Choose...</option>
                    </select>
                    <button class="btn btn-outline-success" id="send-button" disabled type="button" onclick="sendUserMessage(document.getElementById('producer-gateway-id').value,document.getElementById('message-text').value)">Send</button>
                  </div>
                  <div class="" id="consume-only-form">
                  (No produce gateways configured, watching for messages)
                  </div>
                </div>
             </div>
            </div>
           </div>
        </div>
        <script type="text/javascript">
          const gateways = ${ [ JSON.stringify(gatewayWebSockets.map((gatewayWebSocket) => { return gatewayWebSocket.gateway; })) ] };
          const agents = ${ JSON.stringify(agents) };
        </script>
        <script src="${bootstrapJsUri}"></script>
        <script src="${listMinUri}"></script>
        <script src="${msgMrgUri}"></script>
        <script src="${gatewayMsgUri}"></script>
      </body>
      </html>
    `;
  }
}
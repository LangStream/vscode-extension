import * as vscode from "vscode";
import {ErrorEvent, MessageEvent, WebSocket} from "ws";
import GatewayMessagesDocument from "./gatewayMessagesDocument";
import Logger from "../../common/logger";
import {AgentConfiguration, Gateway, GatewayTypeEnum} from "../../services/controlPlaneApi/gen";

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
            break; //The websocket is already open, most likely because the user moved the tab
          }

          gatewayMessagesDocument.content.gatewayWebSockets.forEach((gatewayWebSocket) => {
            try{
              const websocket = new WebSocket(gatewayWebSocket.webSocketUrl);

              websocket.on("open", () => {
                webviewPanel.webview.postMessage({command: "connection", text: "opened", gatewayId: gatewayWebSocket.gateway.id});
              });


              websocket.on("error", (err: any) => {
                webviewPanel.webview.postMessage({command: "error", text: "errored - " + err, gatewayId: gatewayWebSocket.gateway.id});
              });

              websocket.on("close", (data: any) => {
                try{
                  webviewPanel.webview.postMessage({command: "connection", text: "closed", gatewayId: gatewayWebSocket.gateway.id});
                }catch{
                  //no op because the webview may have been disposed
                }
              });

              websocket.on("message", (data: any) => {
                const message = data.toString();
Logger.info("Received message from gateway");
Logger.info(message);

                const consumePushMessage = ConsumePushMessage.tryCast(message);
                if(consumePushMessage !== undefined){
                  Logger.info("Received consume push message from gateway");
                  webviewPanel?.webview?.postMessage({command: "consumeMessage", text: consumePushMessage, gatewayId: gatewayWebSocket.gateway.id});
                  return;
                }

                const produceResponse = ProduceResponse.tryCast(message);
                if(produceResponse !== undefined){
                  Logger.info("Received produce response from gateway");
                  webviewPanel?.webview?.postMessage({command: "produceResponse", text: produceResponse, gatewayId: gatewayWebSocket.gateway.id});
                  return;
                }

                Logger.warn("Received unknown message from gateway");
                Logger.warn(message);
              });

              gatewayWebSockets.push([gatewayWebSocket.gateway, websocket]);
            }catch (e:any) {
              webviewPanel.webview.postMessage({command: "error", text: "errored - " + e.message, gatewayId: gatewayWebSocket.gateway.id});
            }
          });
          break;
        case("userMessage"):
          const gateway = gatewayWebSockets.find((gatewayWebSocket) => { return (gatewayWebSocket[0].id === message.gatewayId); });
          if(gateway === undefined){
            Logger.warn("Received message from unknown gateway: %o", message);
            break;
          }

          Logger.info(`Sending message to gateway ${gateway[0].id}`);

          const produceRequest = new ProduceRequest(null, message.text, null);

          gateway[1].send(JSON.stringify(produceRequest), (err) => {
            if(err){
              Logger.warn("Error sending message to gateway", err);
              webviewPanel.webview.postMessage({command: "error", text: "errored - " + err, gatewayId: gateway[0].id});
              return;
            }

            Logger.info(`Successfully sent message to gateway ${gateway[0].id}`);
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
        ul.striped-list > li:nth-of-type(odd) > table > tbody > tr > td {
            background-color: var(--vscode-input-background) ;
        }
        ul.striped-list > li:last-child {
            border-bottom: none;
        }
      </style>
      </head>
      <body class="vsCodePulsarAdminWizard">
        <div class="container-fluid" style="height: 97vh!important;">
           <div class="row mb-2">
             <div class="col-12">
                <div class="alert alert-info d-none" role="alert" id="pageMessage"></div>
                <div class="alert alert-danger d-none" role="alert" id="pageError"></div>
             </div>
          </div>
          <div class="row h-100">
            <div class="col-3 h-100">
              <div class="row h-50">
                <div class="col-12 pb-4 h-100">
                <div class="card h-100">
  <div class="card-header">Agents</div>
  <div class="card-body overflow-scroll"><ul class="list-group striped-list" id="agents-list"></ul></div>
</div>
</div>
              </div>
              <div class="row h-50">
                <div class="col-12 h-100">
                <div class="card h-100">
  <div class="card-header">Gateways</div>
  <div class="card-body overflow-scroll"><ul id="gateways-list" class="list-group striped-list"></ul></div>
</div>
</div>
              </div>
            </div>
            <div class="col-9 h-100">
              <div class="" id="messages-container" style="height: 93%!important;">
                <div class="col-12 overflow-y-scroll no-gutters bg-light-subtle border rounded h-100 p-2" id="messages-list" class="list-group"><div class="list"></div></div>
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

class ProduceRequest {
  constructor(public readonly key: string | null,
              public readonly value: string | null,
              public readonly headers: string | null){}
}

class ProduceResponse {
  constructor(public readonly status: Status,
              public readonly reason: string){}
  public static tryCast(json: string): ProduceResponse | undefined {
    try {
      const a = JSON.parse(json);

      if(a.status === undefined){
        return undefined;
      }

      if(a.reason === undefined){
        return undefined;
      }

      return new ProduceResponse(a.status, a.reason);
    } catch {
      return undefined;
    }
  }
}

enum Status {
  OK = "OK",
  BAD_REQUEST = "BAD_REQUEST",
  PRODUCER_ERROR = "PRODUCER_ERROR",
}

class ConsumePushMessage {
  constructor(public readonly record: Record, public readonly  offset:string){}
  public static tryCast(json: string): ConsumePushMessage | undefined {
    try{
      const a = JSON.parse(json);

      if(a.record === undefined){
        return undefined;
      }

      if(a.offset === undefined){
        return undefined;
      }

      return new ConsumePushMessage(a.record, a.offset);
    }catch{
      return undefined;
    }
  }
}

class Record {
  constructor(public readonly headers: Map<string,string> | null,
              public readonly key: {} | null,
              public readonly value: {} | null){}
}
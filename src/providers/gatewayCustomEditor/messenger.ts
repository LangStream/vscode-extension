import {ClientOptions, WebSocket, MessageEvent} from "ws";
import {GatewayTypeEnum} from "../../services/controlPlaneApi/gen";
import Logger from "../../common/logger";
import {sleep} from "../../utils/sleep";
import {ToWebviewMessageCommandEnum, TToWebviewMessage} from "../../types/tToWebviewMessage";
import {ToWebviewMessage} from "./toWebviewMessage";
import {ResponseStatusEnum} from "./responseStatusEnum";
import {ProduceResponse} from "./produceResponse";
import {ConsumePushMessage} from "./consumePushMessage";
import {Record} from "./record";

export default class GatewayMessenger<T extends GatewayTypeEnum> {
  private webSocket: WebSocket | undefined;
  private readonly socketMessageCache: {}[];
  private pingTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(private readonly gatewayType: T,
              public readonly gatewayId: string,
              public readonly postMessageAction: (message: TToWebviewMessage) => void) {
    this.socketMessageCache = [];
  }

  private postToWebview(command: ToWebviewMessageCommandEnum, text?: string, gatewayId?: string, contentType?: string){
    const message = new ToWebviewMessage(command, text, gatewayId, contentType);
    this.postMessageToWebview(message);
  }

  public postMessageToWebview(message: TToWebviewMessage){
    this.socketMessageCache.push(message);

    // Messages are only delivered if the webview is live (either visible or in the background with retainContextWhenHidden)
    this.postMessageAction(message);
  }

  private onOpen(): void {
    this.postToWebview(ToWebviewMessageCommandEnum.connection, "opened", this.gatewayId);
  }

  private onMessage(msg: any): void {
    let message = "";
    let webViewMessage: TToWebviewMessage | undefined = undefined;

    try{
      msg = msg as MessageEvent;
      message = msg.data.toString();
    }catch {
      message = msg.toString();
    }

    switch (this.gatewayType){
      case GatewayTypeEnum.consume:
        const consumePushMessage = ConsumePushMessage.tryCast(message);
        if(consumePushMessage !== undefined){
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.consumeMessage, consumePushMessage, this.gatewayId, consumePushMessage.contentType());
        }

        break;
      case GatewayTypeEnum.produce:
        const produceResponse = ProduceResponse.tryCast(message);
        if(produceResponse !== undefined){
          webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.produceResponse, produceResponse, this.gatewayId);
        }

        break;
    }

    if(webViewMessage !== undefined){
      this.postMessageToWebview(webViewMessage);
      return;
    }
  }

  private onError(event: any): void {
    let webViewMessage: TToWebviewMessage | undefined = undefined;

    switch (this.gatewayType){
      case GatewayTypeEnum.consume:
        webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.error, "errored - " + event, this.gatewayId);
        break;
      case GatewayTypeEnum.produce:
        const produceResponse = new ProduceResponse(ResponseStatusEnum.PRODUCER_ERROR, event);
        webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.produceResponse, produceResponse, this.gatewayId);
        break;
    }

    if(webViewMessage !== undefined){
      this.postMessageToWebview(webViewMessage);
      return;
    }
  }

  private onClose(): void {
    clearTimeout(this.pingTimeout);
    this.postToWebview(ToWebviewMessageCommandEnum.connection, "closed", this.gatewayId);
  }

  private heartbeat(): void {
    clearTimeout(this.pingTimeout);

    this.pingTimeout = setTimeout(() => {
      this.webSocket?.terminate();
    }, 30000 + 1000);
  }

  public dispose(hardClose: boolean = false): void {
    if(hardClose){
      this.webSocket?.terminate(); //Hard close the socket
      return;
    }

    this.webSocket?.close(); //Soft close the socket
  }

  public async connect(address: string | URL, connectTimeoutMs: number): Promise<void> {
    const clientOptions: ClientOptions = {
      followRedirects: true,
      handshakeTimeout: connectTimeoutMs,
    };

    const timeout = setTimeout(() => {
      throw new Error("Connect request timed out");
    }, connectTimeoutMs);

    const ws = new WebSocket(address, clientOptions);

    ws.addEventListener("error", function(this:GatewayMessenger<T>, event:any){ this.onError(event); }.bind(this));
    ws.addEventListener("open", function(this:GatewayMessenger<T>){ this.onOpen(); }.bind(this));
    ws.addEventListener("message", function(this:GatewayMessenger<T>, msg: any){ this.onMessage(msg); }.bind(this));
    ws.addEventListener("close", function(this:GatewayMessenger<T>){ this.onClose(); }.bind(this));
    ws.on('ping',function(this:GatewayMessenger<T>){ this.heartbeat(); }.bind(this)); //not implemented in gateway

    while(ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED){
      //wait for connection to open
      await sleep(1000);

      switch(ws.readyState){
        case WebSocket.CONNECTING:
          this.postToWebview(ToWebviewMessageCommandEnum.connection, "connecting", this.gatewayId);
          break;
        case WebSocket.CLOSING:
          this.postToWebview(ToWebviewMessageCommandEnum.connection, "closing", this.gatewayId);
          break;
      }
    }

    clearTimeout(timeout);

    if(ws.readyState === WebSocket.CLOSED){
      throw new Error("Server did not allow connection");
    }

    this.webSocket = ws;
  }

  public close(): void {
    try{
      Logger.info("Closing messengers");
      this.webSocket?.close(); // no matter what state the socket is in, attempt to close
    }catch(e){
      Logger.error('Closing sockets', e);
    }
  }

  public get connectionState(): number | undefined {
    if(this.webSocket === undefined){
      return undefined;
    }

    return this.webSocket.readyState;
  }

  public get messages(): {}[] {
    return this.socketMessageCache;
  }

  public sendMessageToGateway(message: Record, sendTimeoutMs: number): void {
    if(this.webSocket === undefined || this.webSocket.readyState !== WebSocket.OPEN){
      throw new Error("Websocket is not open");
    }

    const promises = [
        // sleep(sendTimeoutMs).then(() => {
        //   const webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.error, "Send message timed out", this.gatewayId);
        //   this.postMessageToWebview(webViewMessage);
        // }),
        this.webSocket.send(message.toJson(), (error) => {
          if (error) {
            Logger.warn("Error sending message to gateway", error);
            this.postToWebview(ToWebviewMessageCommandEnum.error, "errored - " + error.message, this.gatewayId);
            return;
          }
        })
    ];

    Promise.race(promises);

    // Display the message that will be sent
    // const consumePushMessage = new ConsumePushMessage(message, "");
    // const webViewMessage = new ToWebviewMessage(ToWebviewMessageCommandEnum.consumeMessage, consumePushMessage, this.gatewayId, consumePushMessage.contentType());
    // this.postMessageToWebview(webViewMessage);
  }

  public static addGatewaySearchParams(baseUrl: URL, params?: {[key: string]: string}, options?: {[key: string]: string}, cred?: string): void {
    //{ command: command, text: text, gatewayId: gatewayId, headers: headers, params: params, cred: cred, key: key }
    //?param:a=urlencode(b) &param:a=urlencode(b) &option:a=urlencode(b) &option:a=urlencode(b) &credentials=urlencode(asdf)

    if(params !== undefined){
      Object.keys(params).forEach((paramKey) => {
        baseUrl.searchParams.set(`param:${paramKey}`, encodeURI(params[paramKey]));
      });
    }

    // Currently, there are provisions for "options" but cli has no way to set them
    if(options !== undefined){
      Object.keys(options).forEach((optionKey) => {
        baseUrl.searchParams.set(`option:${optionKey}`, encodeURI(options[optionKey]));
      });
    }

    if(cred !== undefined && cred !== null){
      baseUrl.searchParams.set(`credentials`, encodeURI(cred));
    }
  }
}


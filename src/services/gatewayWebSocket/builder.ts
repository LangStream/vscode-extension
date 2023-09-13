import {IGateway} from "../../interfaces/iGateway";
import GatewayWebSocket from "./index";

export default class Builder {
  private _gateway: IGateway | undefined;
  private _webSocketUrl: URL | undefined;

  constructor() {
    this._gateway = undefined;
    this._webSocketUrl = undefined;
  }

  public gateway (gateway: IGateway): Builder {
    if (gateway === null) {
      throw new Error('Gateway is a required value');
    }

    this._gateway = gateway;

    return this;
  }

  public webSocketUrl (webSocketUrl: URL): Builder {
    if (webSocketUrl === null) {
      throw new Error('WebSocketUrl is a required value');
    }

    this._webSocketUrl = webSocketUrl;

    return this;
  }

  public build (): GatewayWebSocket {
    if (this._gateway === undefined) {
      throw new Error('Gateway is a required value');
    }

    if (this._webSocketUrl === undefined) {
      throw new Error('WebSocketUrl is a required value');
    }

    return new GatewayWebSocket(this._gateway, this._webSocketUrl);
  }
}
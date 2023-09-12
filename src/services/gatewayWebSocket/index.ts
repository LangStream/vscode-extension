import {IGateway} from "../../interfaces/iGateway";
import Builder from "./builder";

export default class GatewayWebSocket {
  constructor(private readonly gateway: IGateway, private readonly websocketUrl: URL) {
  }

  public static builder (): Builder {
    return new Builder();
  }

  public get gatewayId(): string {
    if(this.gateway === undefined || this.gateway.id === undefined){
      throw new Error("Gateway is undefined or id is not set");
    }

    return this.gateway.id;
  }

  public get websocketBaseUrl(): URL {
    return this.websocketUrl;
  }
}
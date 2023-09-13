import * as path from "path";
import ApplicationService from "../../services/application";
import {AgentConfiguration, GatewayTypeEnum} from "../../services/controlPlaneApi/gen";
import {IGateway} from "../../interfaces/iGateway";
import GatewayWebSocket from "../../services/gatewayWebSocket";
import {TSavedControlPlane} from "../../types/tSavedControlPlane";

export default class GatewayMessageDocumentContent{
  public static async build(controlPlaneName: string,
                            tenantName: string,
                            applicationId: string,
                            savedControlPlanes: TSavedControlPlane[]): Promise<GatewayMessageDocumentContent> {
    const savedControlPlane = savedControlPlanes.find((cp) => { return cp.name === controlPlaneName; });
    if(!savedControlPlane) {
      throw new Error(`Could not find control plane config for ${controlPlaneName}`);
    }

    const applicationService = new ApplicationService(savedControlPlane);
    const applicationDescription = await applicationService.get(tenantName, applicationId);

    if(!applicationDescription) {
      throw new Error(`Could not find application config for ${tenantName}/${applicationId}`);
    }

    if(applicationDescription.application?.gateways?.gateways === undefined) {
      throw new Error(`Could not find gateways config for ${tenantName}/${applicationId}`);
    }

    if(applicationDescription.application?.modules === undefined) {
      throw new Error(`Could not find modules config for ${tenantName}/${applicationId}`);
    }

    const gatewayWebSocketUrls: {gateway:IGateway, webSocketUrl:URL}[] = [];
    let agents:AgentConfiguration[] = [];

    applicationDescription.application.gateways.gateways.forEach((gateway) => {
      const webSocketUrl = new URL(savedControlPlane.apiGatewayUrl);
      webSocketUrl.pathname += path.join("v1", gateway.type!, tenantName, applicationId, gateway.id!);

      gatewayWebSocketUrls.push({
        gateway: gateway,
        webSocketUrl: webSocketUrl
      });
    });

    for(const module of applicationDescription.application.modules){
      if(module?.pipelines === undefined) {
        continue;
      }

      for(const pipeline of module?.pipelines){
        if(pipeline?.agents === undefined) {
          continue;
        }

        agents = pipeline?.agents;
      }
    }

    return new GatewayMessageDocumentContent(controlPlaneName,
      tenantName,
      applicationId,
      agents,
      gatewayWebSocketUrls);
  }

  private readonly _producerGateways:IGateway[] = [];
  private readonly _consumerGateways:IGateway[] = [];
  private readonly _producerGatewayWebSockets: GatewayWebSocket[] = [];
  private readonly _consumerGatewayWebSockets: GatewayWebSocket[] = [];

  constructor(public readonly controlPlaneName: string,
              public readonly tenantName: string,
              public readonly applicationId: string,
              public readonly agents: AgentConfiguration[],
              gatewayWebSocketUrls: {gateway:IGateway, webSocketUrl:URL}[]) {

    gatewayWebSocketUrls.forEach(({gateway, webSocketUrl}) => {
      const gatewayWebSocket = GatewayWebSocket.builder()
        .gateway(gateway)
        .webSocketUrl(webSocketUrl)
        .build();

      switch(gateway.type){
        case GatewayTypeEnum.produce:
          this._producerGatewayWebSockets.push(gatewayWebSocket);
          this._producerGateways.push(gateway);
          break;
        case GatewayTypeEnum.consume:
          this._consumerGatewayWebSockets.push(gatewayWebSocket);
          this._consumerGateways.push(gateway);
          break;
      }
    });
  }

  public get producerGateways():IGateway[] {
    return this._producerGateways;
  }

  public get consumerGateways():IGateway[] {
    return this._consumerGateways;
  }

  public get producerGatewayWebSockets(): GatewayWebSocket[]{
    return this._producerGatewayWebSockets;
  }

  public get consumerGatewayWebSockets(): GatewayWebSocket[]{
    return this._consumerGatewayWebSockets;
  }
}
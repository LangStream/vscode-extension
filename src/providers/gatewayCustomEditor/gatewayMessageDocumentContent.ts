import * as path from "path";
import ConfigurationProvider from "../configuration";
import ApplicationService from "../../services/application";
import {AgentConfiguration, Gateway} from "../../services/controlPlaneApi/gen";
import Logger from "../../common/logger";

export default class GatewayMessageDocumentContent{
  public static async build(controlPlaneName: string,
                            tenantName: string,
                            applicationId: string): Promise<GatewayMessageDocumentContent> {
    Logger.info("Building new gateway message document content");
    const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();

    const savedControlPlane = savedControlPlanes.find((cp) => { return cp.name === controlPlaneName; });
    if(!savedControlPlane) {
      throw new Error(`Could not find control plane config for ${controlPlaneName}`);
    }

    const applicationService = new ApplicationService(savedControlPlane);
    const storedApplication = await applicationService.get(tenantName, applicationId);

    if(!storedApplication) {
      throw new Error(`Could not find application config for ${tenantName}/${applicationId}`);
    }

    if(storedApplication.instance?.gateways?.gateways === undefined) {
      throw new Error(`Could not find gateways config for ${tenantName}/${applicationId}`);
    }

    if(storedApplication?.instance?.modules === undefined) {
      throw new Error(`Could not find modules config for ${tenantName}/${applicationId}`);
    }

    const gatewayWebSockets: {gateway:Gateway, webSocketUrl:URL}[] = [];
    let agents:AgentConfiguration[] = [];

    storedApplication?.instance?.gateways.gateways.forEach((gateway) => {
      const webSocketUrl = new URL(savedControlPlane.apiGatewayUrl);
      webSocketUrl.pathname += path.join("v1", gateway.type!, tenantName, applicationId, gateway.id!);

      gatewayWebSockets.push({
        gateway: gateway,
        webSocketUrl: webSocketUrl
      });
    });

    for(const moduleKey of Object.keys(storedApplication?.instance?.modules)){
      const module = storedApplication?.instance?.modules[moduleKey];
      if(module?.pipelines === undefined) {
        continue;
      }

      for(const pipelineKey of Object.keys(module?.pipelines)){
        const pipeline = module?.pipelines[pipelineKey];
        if(pipeline?.agents === undefined) {
          continue;
        }

        agents = pipeline?.agents;
      }
    }

    return new GatewayMessageDocumentContent(controlPlaneName,
      tenantName,
      applicationId,
      gatewayWebSockets,
      agents);
  }

  constructor(public readonly controlPlaneName: string,
              public readonly tenantName: string,
              public readonly applicationId: string,
              public readonly _gatewayWebSockets: {gateway:Gateway, webSocketUrl:URL}[],
              public readonly _agents:AgentConfiguration[]) {}

  public static async fromJson(json: string): Promise<GatewayMessageDocumentContent>{
    try{
      const parsed = JSON.parse(json);

      if(!parsed.controlPlaneName || parsed.controlPlaneName.length < 1){
        throw new Error("controlPlaneName is not set");
      }

      if(!parsed.tenantName || parsed.tenantName.length < 1){
        throw new Error("tenantName is not set");
      }

      if(!parsed.applicationId || parsed.applicationId.length < 1){
        throw new Error("applicationId is not set");
      }

      const content = await GatewayMessageDocumentContent.build(parsed.controlPlaneName,
        parsed.tenantName,
        parsed.applicationId
      );

      return content;
    }catch (e: any) {
      throw new Error(`The file is not formatted correctly - ${e.message}`);
    }
  }

  public get gatewayWebSockets(){
    return this._gatewayWebSockets;
  }

  public get agents(){
    return this._agents;
  }
}
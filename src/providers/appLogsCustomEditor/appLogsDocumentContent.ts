import ConfigurationProvider from "../configuration";
import Logger from "../../common/logger";

export default class AppLogsDocumentContent {
  public static async build(controlPlaneName: string,
                            tenantName: string,
                            applicationId: string,
                            filterWorkerIds: string[] = []): Promise<AppLogsDocumentContent> {
    Logger.info("Building new app logs message document content");
    const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();

    const savedControlPlane = savedControlPlanes.find((cp) => { return cp.name === controlPlaneName; });
    if(!savedControlPlane) {
      throw new Error(`Could not find control plane config for ${controlPlaneName}`);
    }

    return new AppLogsDocumentContent(savedControlPlane.webServiceUrl,
      tenantName,
      applicationId,
      filterWorkerIds);
  }

  constructor(public readonly webServiceUrl: string,
              public readonly tenantName: string,
              public readonly applicationId: string,
              private readonly _workerFilters: string[] = []) {}

  public static async fromJson(json: string): Promise<AppLogsDocumentContent>{
    try{
      const parsed = JSON.parse(json);

      if(!parsed.webServiceUrl || parsed.webServiceUrl.length < 1){
        throw new Error("controlPlaneName is not set");
      }

      if(!parsed.tenantName || parsed.tenantName.length < 1){
        throw new Error("tenantName is not set");
      }

      if(!parsed.applicationId || parsed.applicationId.length < 1){
        throw new Error("applicationId is not set");
      }

      const content = await AppLogsDocumentContent.build(parsed.webServiceUrl,
        parsed.tenantName,
        parsed.applicationId
      );

      return content;
    }catch (e: any) {
      throw new Error(`The file is not formatted correctly - ${e.message}`);
    }
  }

  public get workerFilters(){
    return this._workerFilters;
  }
}
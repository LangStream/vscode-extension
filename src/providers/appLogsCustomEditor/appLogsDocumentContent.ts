import ConfigurationProvider from "../configuration";
import Logger from "../../common/logger";

export default class AppLogsDocumentContent {
  public static async build(controlPlaneName: string,
                            tenantName: string,
                            applicationId: string,
                            agentId?: string,
                            filterWorkerIds?: string[]): Promise<AppLogsDocumentContent> {
    Logger.info("Building new app logs message document content");
    const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();

    const savedControlPlane = savedControlPlanes.find((cp) => { return cp.name === controlPlaneName; });
    if(!savedControlPlane) {
      throw new Error(`Could not find control plane config for ${controlPlaneName}`);
    }

    return new AppLogsDocumentContent(savedControlPlane.webServiceUrl,
      tenantName,
      applicationId,
      agentId,
      filterWorkerIds);
  }

  constructor(public readonly webServiceUrl: string,
              public readonly tenantName: string,
              public readonly applicationId: string,
              public readonly agentId?: string,
              private readonly _workerFilters: string[] = []) {}
  public addWorkerFilter(workerFilter: string){
    this._workerFilters.push(workerFilter);
  }

  public get workerFilters(){
    return this._workerFilters;
  }
}
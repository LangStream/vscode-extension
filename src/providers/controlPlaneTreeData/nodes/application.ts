import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {ITenantNode} from "./tenant";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {
  Application,
  ApplicationLifecycleStatusStatusEnum,
  ApplicationStatus,
  StoredApplication
} from "../../../services/controlPlaneApi/gen";
import {ErrorNode, IErrorNode} from "./error";
import ApplicationService from "../../../services/application";
import StreamingApplication from "../../../common/streamingApplication";
import Logger from "../../../common/logger";
import * as path from "path";

export interface IApplicationNode extends vscode.TreeItem {
  readonly controlPlane: TSavedControlPlane;
  readonly streamingApplication?: StreamingApplication;
  readonly applicationStatus: ApplicationStatus
  readonly tenantName: string;
  readonly storedApplication: StoredApplication;
}

export class ApplicationNode extends vscode.TreeItem implements IApplicationNode {
  public readonly streamingApplication: StreamingApplication | undefined = undefined;
  public readonly applicationStatus: ApplicationStatus;

  constructor(readonly tenantName: string, readonly controlPlane: TSavedControlPlane, readonly storedApplication: StoredApplication) {
    super(storedApplication.applicationId ?? "unknown", vscode.TreeItemCollapsibleState.Collapsed);

    this.label = this.findAppName(storedApplication);
    this.applicationStatus = storedApplication.status ?? {};

    try{
      this.streamingApplication = StreamingApplication.fromInstance(<Application>storedApplication.instance);
    }catch(e){
      Logger.error(`Failed to create streaming application from instance`, e);
    }

    const status = this.applicationStatus.status?.status ?? "unknown";
    const hasGateways = this.storedApplication.instance?.gateways?.gateways?.length ?? 0 > 0;
    this.contextValue = `${Constants.CONTEXT_VALUES.application}.${status}.${hasGateways ? "gateway": "no-gateway"}`;
    this.description = `App ${status.toLowerCase()}`;
    this.tooltip = this.applicationStatus.status?.reason ?? "";

    switch (this.applicationStatus.status?.status) {
      case ApplicationLifecycleStatusStatusEnum.deployed:
        this.iconPath = {
          light: path.join(__dirname, '..',  'images', 'light', 'application-green.png'),
          dark: path.join(__dirname, '..', 'images', 'dark', 'application-green.png'),
        };
        break;
      case ApplicationLifecycleStatusStatusEnum.errorDeploying:
      case ApplicationLifecycleStatusStatusEnum.errorDeleting:
        this.iconPath = {
          light: path.join(__dirname, '..',  'images', 'light', 'application-red.png'),
          dark: path.join(__dirname, '..', 'images', 'dark', 'application-red.png'),
        };
        break;
      case ApplicationLifecycleStatusStatusEnum.created:
      case ApplicationLifecycleStatusStatusEnum.deploying:
      case ApplicationLifecycleStatusStatusEnum.deleting:
      default:
        this.iconPath = {
          light: path.join(__dirname, '..',  'images', 'light', 'application-yellow.png'),
          dark: path.join(__dirname, '..', 'images', 'dark', 'application-yellow.png'),
        };
        break;
    }
  }

  private findAppName(storedApplication: StoredApplication): string {
    const unknownName = "unknown";

    if(storedApplication.instance?.modules === undefined){
      return unknownName;
    }

    const firstModuleKey = Object.keys(storedApplication.instance.modules)[0];
    if(firstModuleKey === undefined ||
        storedApplication.instance.modules[firstModuleKey] === undefined ||
        storedApplication.instance.modules[firstModuleKey].pipelines === undefined){
      return unknownName;
    }

    const firstPipelineKey = Object.keys(storedApplication.instance.modules[firstModuleKey].pipelines!)[0];
    if(firstPipelineKey === undefined ||
        storedApplication.instance.modules[firstModuleKey].pipelines![firstPipelineKey] === undefined){
      return unknownName;
    }

    return storedApplication.instance.modules[firstModuleKey].pipelines![firstPipelineKey].name ?? unknownName;
  }
}

export default class ApplicationTree {
  public async getChildren(tenantNode: ITenantNode): Promise<TAllExplorerNodeTypes[]> {
    if(!tenantNode) { return []; }

    const applicationService = new ApplicationService(tenantNode.controlPlane);
    const tenantName = <string>tenantNode.label;

    const applicationIds = await applicationService.listIds(tenantName);

    if(applicationIds.length === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noApplications)];
    }

    const applicationNodes: (IApplicationNode|IErrorNode)[] = [];

    for(const applicationId of applicationIds) {
      const storedApplication = await applicationService.get(tenantName, applicationId);
      if(storedApplication === undefined) {
        applicationNodes.push(new ErrorNode(`Failed to get application details for ${applicationId}`));
        continue;
      }

      applicationNodes.push(new ApplicationNode(tenantName, tenantNode.controlPlane, storedApplication));
    }

    return applicationNodes;
  }
}
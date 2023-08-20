import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {ITenantNode} from "./tenant";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {ErrorNode, IErrorNode} from "./error";
import ApplicationService from "../../../services/application";
import {ApplicationLifecycleStatusStatusEnum} from "../../../services/controlPlaneApi/gen/models";
import * as path from "path";

export interface IApplicationNode extends vscode.TreeItem {
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationStatus?: lsModels.AgentStatusDescription;
  readonly applicationDefinition: lsModels.ApplicationDefinition;
  readonly applicationId: string;
}

export class ApplicationNode extends vscode.TreeItem implements IApplicationNode {
  constructor(readonly applicationId: string,
              readonly tenantName: string,
              readonly controlPlane: TSavedControlPlane,
              readonly applicationStatus: lsModels.AgentStatusDescription | undefined,
              readonly applicationDefinition: lsModels.ApplicationDefinition) {
    const status = applicationStatus?.status?.status ?? "unknown";
    super(applicationId, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `Application`;
    this.contextValue = `${Constants.CONTEXT_VALUES.application}.${status}${(applicationDefinition.gateways?.gateways?.length ?? 0) > 0 ? ".gateway" : ""}`;

    switch(status) {
      case ApplicationLifecycleStatusStatusEnum.deployed:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "application-green.png"),
          dark: path.join(__dirname, "..", "images", "dark", "application-green.png")
        };
        break;
      case ApplicationLifecycleStatusStatusEnum.deleting:
      case ApplicationLifecycleStatusStatusEnum.deploying:
      case ApplicationLifecycleStatusStatusEnum.created:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "application-yellow.png"),
          dark: path.join(__dirname, "..", "images", "dark", "application-yellow.png")
        };
        break;
      default:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "application-red.png"),
          dark: path.join(__dirname, "..", "images", "dark", "application-red.png")
        };
        break;
    }
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
      const applicationDescription = await applicationService.get(tenantName, applicationId);
      if(applicationDescription === undefined) {
        applicationNodes.push(new ErrorNode(`Failed to get application details for ${applicationId}`));
        continue;
      }

      if(applicationDescription.application === undefined) {
        applicationNodes.push(new ErrorNode(`Failed to get application definition for ${applicationId}`));
        continue;
      }

      applicationNodes.push(new ApplicationNode(applicationId,
        tenantName,
        tenantNode.controlPlane,
        applicationDescription.status,
        applicationDescription.application));
    }

    return applicationNodes;
  }
}
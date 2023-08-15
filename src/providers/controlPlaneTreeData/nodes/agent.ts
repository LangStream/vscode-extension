import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {
  AgentLifecycleStatusStatusEnum,
  AgentStatus,
} from "../../../services/controlPlaneApi/gen";
import {IApplicationNode} from "./application";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import * as path from "path";

export interface IAgentNode extends vscode.TreeItem {
  readonly agentStatus: AgentStatus;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationId: string;
}

export class AgentNode extends vscode.TreeItem implements IAgentNode {
  constructor(readonly label:string, readonly agentStatus: AgentStatus, readonly controlPlane: TSavedControlPlane, readonly tenantName: string, readonly applicationId: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    const status = agentStatus.status?.status ?? "unknown";

    this.contextValue = `${Constants.CONTEXT_VALUES.agent}.${status}`;
    this.description = `Agent ${status.toLowerCase()}`;
    this.tooltip = agentStatus.status?.reason ?? "";

    switch (agentStatus.status?.status) {
      case AgentLifecycleStatusStatusEnum.deployed:
        this.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor(`debugIcon.startForeground`));
        break;
      case AgentLifecycleStatusStatusEnum.error:
        this.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor(`debugIcon.stopForeground`));
        break;
      case AgentLifecycleStatusStatusEnum.created:
      case AgentLifecycleStatusStatusEnum.deploying:
      default:
        this.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor(`debugIcon.pauseForeground`));
        break;
    }
  }
}

export default class AgentTree {
  public async getChildren(applicationNode: IApplicationNode): Promise<TAllExplorerNodeTypes[]> {
    if(!applicationNode) { return []; }

    const agentKeys = Object.keys(applicationNode.applicationStatus.agents || {});

    if(agentKeys.length === 0 || applicationNode.applicationStatus.agents === undefined) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noAgents)];
    }

    return agentKeys.map(agentKey => { return new AgentNode(agentKey, applicationNode.applicationStatus.agents![agentKey], applicationNode.controlPlane, applicationNode.tenantName, <string>applicationNode.storedApplication.applicationId);});
  }
}
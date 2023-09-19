import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {IErrorNode} from "./error";
import * as path from "path";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";

export interface ICompositeAgentNode extends vscode.TreeItem {
  readonly executorDescription: lsModels.ExecutorDescription;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationId: string;
}

export class CompositeAgentNode extends vscode.TreeItem implements ICompositeAgentNode {
  constructor(readonly executorDescription: lsModels.ExecutorDescription, readonly controlPlane: TSavedControlPlane, readonly tenantName: string, readonly applicationId: string) {
    super("unknown", vscode.TreeItemCollapsibleState.None);
    this.description = `CompositeAgent`;
    this.contextValue = Constants.CONTEXT_VALUES.compositeAgent;
    this.label = executorDescription.id ?? "unknown";

    const status = this.decideStatus(executorDescription);

    switch(status) {
      case lsModels.AgentLifecycleStatusStatusEnum.deployed:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "agent-green.png"),
          dark: path.join(__dirname, "..", "images", "dark", "agent-green.png")
        };
        break;
      case lsModels.AgentLifecycleStatusStatusEnum.deploying:
      case lsModels.AgentLifecycleStatusStatusEnum.created:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "agent-yellow.png"),
          dark: path.join(__dirname, "..", "images", "dark", "agent-yellow.png")
        };
        break;
      case "replicaError":
      default: //error | unknown
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "agent-red.png"),
          dark: path.join(__dirname, "..", "images", "dark", "agent-red.png")
        };
        break;
    }
  }

  private decideStatus(executorDescription: lsModels.ExecutorDescription): string {
    // Start by using the overall status
    let status = executorDescription.status?.status ?? "unknown";

    // Look at each executor and see if any of them are in error
    executorDescription.replicas?.forEach((replica) => {
      if(replica.status === lsModels.ReplicaStatusStatusEnum.error) {
        status = "replicaError";
      }
    });

    return status;
  }
}

export default class CompositeAgentTree {
  constructor(private readonly controlPlane: TSavedControlPlane, private readonly tenantName: string, private readonly applicationId: string) {

  }
  public async getChildren(executors: lsModels.ExecutorDescription[]): Promise<TAllExplorerNodeTypes[]> {
    if(!executors) { return []; }

    if((executors.length ?? 0) === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noCompositeAgents)];
    }

    const agentNodes: (ICompositeAgentNode|IErrorNode)[] = [];

    for(const executor of executors) {
      agentNodes.push(new CompositeAgentNode(executor, this.controlPlane, this.tenantName, this.applicationId));
    }

    return agentNodes;
  }
}
import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {AgentWorkerStatus} from "../../../services/controlPlaneApi/gen";
import {IAgentNode} from "./agent";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";

export interface IWorkerNode extends vscode.TreeItem {
  readonly workerStatus: AgentWorkerStatus;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationId: string;
}

export class WorkerNode extends vscode.TreeItem implements IWorkerNode {
  constructor(readonly label:string, readonly workerStatus: AgentWorkerStatus, readonly controlPlane: TSavedControlPlane, readonly tenantName: string, readonly applicationId: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    const status = workerStatus.status ?? "unknown";

    this.contextValue = `${Constants.CONTEXT_VALUES.worker}.${status}`;
    this.description = `Worker ${status.toLowerCase()}`;
  }
}

export default class WorkerTree {
  constructor(readonly controlPlane: TSavedControlPlane, readonly tenantName: string, readonly applicationId: string) {
  }
  public async getChildren(agentNode: IAgentNode): Promise<TAllExplorerNodeTypes[]> {
    if(!agentNode) { return []; }

    const workerKeys = Object.keys(agentNode.agentStatus.workers || {});

    if(workerKeys.length === 0 || agentNode.agentStatus.workers === undefined) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noWorkers)];
    }

    return workerKeys.map(workerKey => { return new WorkerNode(workerKey, agentNode.agentStatus.workers![workerKey], this.controlPlane, this.tenantName, this.applicationId);});
  }
}
import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {IErrorNode} from "./error";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {IGateway} from "../../../interfaces/iGateway";

export interface IGatewayNode extends vscode.TreeItem {
  readonly gateway: lsModels.Gateway;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
}

export class GatewayNode extends vscode.TreeItem implements IGatewayNode {
  constructor(readonly gateway: lsModels.Gateway, readonly controlPlane: TSavedControlPlane, readonly tenantName: string) {
    super(gateway.id ?? "unknown", vscode.TreeItemCollapsibleState.None);
    this.description = `Gateway`;
    this.contextValue = Constants.CONTEXT_VALUES.gateway;
  }
}

export default class GatewayTree {
  constructor(private readonly controlPlane: TSavedControlPlane, private readonly tenantName: string) {
  }
  public async getChildren(gateways: IGateway[]): Promise<TAllExplorerNodeTypes[]> {
    if(!gateways) { return []; }

    if(gateways.length === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noGateways)];
    }

    const gatewayNodes: (IGatewayNode|IErrorNode)[] = [];

    for(const gateway of gateways) {
      gatewayNodes.push(new GatewayNode(gateway, this.controlPlane, this.tenantName));
    }

    return gatewayNodes;
  }
}
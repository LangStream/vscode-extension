import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {IControlPlaneNode} from "./controlPlane";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {ErrorNode, IErrorNode} from "./error";
import TenantService from "../../../services/tenant";
import * as path from "path";

export interface ITenantNode extends vscode.TreeItem {
  readonly controlPlane: TSavedControlPlane;
}

export class TenantNode extends vscode.TreeItem implements ITenantNode {
  constructor(readonly label: string, readonly controlPlane: TSavedControlPlane) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = Constants.CONTEXT_VALUES.tenant;
    this.description = "Tenant";

    this.iconPath = {
      light: path.join(__dirname, '..',  'images', 'light', 'tenant-blue.png'),
      dark: path.join(__dirname, '..', 'images', 'dark', 'tenant-blue.png'),
    };
  }
}

export default class TenantTree {
  public async getChildren(controlPlaneNode: IControlPlaneNode): Promise<TAllExplorerNodeTypes[]> {
    if(!controlPlaneNode) { return []; }

    // Look up tenants
    const tenantService = new TenantService(controlPlaneNode.savedControlPlane);

    const tenantNames = await tenantService.listNames();

    if(tenantNames.length === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noTenants)];
    }

    const tenantNodes: (ITenantNode|IErrorNode)[] = [];

    for(const tenantName of tenantNames) {
      const tenantDetail = await tenantService.get(tenantName);
      if(tenantDetail === undefined) {
        tenantNodes.push(new ErrorNode(`Failed to get details for ${tenantName}`));
        continue;
      }

      tenantNodes.push(new TenantNode(tenantDetail.name || "unknown", controlPlaneNode.savedControlPlane));
    }

    return tenantNodes;
  }
}
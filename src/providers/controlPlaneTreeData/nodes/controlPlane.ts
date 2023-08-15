import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import * as path from "path";

export interface IControlPlaneNode extends vscode.TreeItem {
  readonly savedControlPlane: TSavedControlPlane;
}

export class ControlPlaneNode extends vscode.TreeItem implements IControlPlaneNode {
  constructor(readonly savedControlPlane: TSavedControlPlane) {
    super(savedControlPlane.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.contextValue = Constants.CONTEXT_VALUES.controlPlane;
    this.tooltip = savedControlPlane.webServiceUrl;
    this.description = "Control Plane";

    this.iconPath = {
      light: path.join(__dirname, '..',  'images', 'light', 'control-plane-black.png'),
      dark: path.join(__dirname, '..', 'images', 'dark', 'control-plane-black.png'),
    };
  }
}

export class ControlPlaneProviderTree {
  async getChildren(savedControlPlanes: TSavedControlPlane[]): Promise<TAllExplorerNodeTypes[]> {
    if(!savedControlPlanes){ return [];  }

    if(savedControlPlanes.length === 0) {
      return []; //must be blank to show welcome message
    }

    return savedControlPlanes.map((savedControlPlane) => {
      return new ControlPlaneNode(savedControlPlane);
    });
  }
}
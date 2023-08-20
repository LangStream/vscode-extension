import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";

export interface IFolderNode extends vscode.TreeItem {
  readonly folderType: Constants.ExplorerFolderTypes;
  readonly treeContents: any;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
}

export default class FolderNode extends vscode.TreeItem implements IFolderNode {
  constructor(readonly label: string,
              readonly folderType: Constants.ExplorerFolderTypes,
              readonly treeContents: any,
              readonly controlPlane: TSavedControlPlane,
              readonly tenantName: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = Constants.CONTEXT_VALUES.folder;
  }
}
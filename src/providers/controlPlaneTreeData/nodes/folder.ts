import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";

export interface IFolderNode extends vscode.TreeItem {
  readonly folderType: Constants.ExplorerFolderTypes;
  readonly applicationId: string;
  readonly treeContents: any;
}

export default class FolderNode extends vscode.TreeItem implements IFolderNode {
  constructor(readonly label: string,
              readonly folderType: Constants.ExplorerFolderTypes,
              readonly applicationId: string,
              readonly treeContents: any) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = Constants.CONTEXT_VALUES.folder;
  }
}
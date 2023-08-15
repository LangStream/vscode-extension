import * as vscode from "vscode";
import {CONTEXT_VALUES} from "../../../common/constants";

export interface IErrorNode extends vscode.TreeItem {
  readonly errorObj: any;
}

export class ErrorNode extends vscode.TreeItem implements IErrorNode {
  constructor(readonly errorObj: any) {
    super("", vscode.TreeItemCollapsibleState.None);
    this.contextValue = CONTEXT_VALUES.error;

    if(errorObj.response && errorObj.response.data) {
      this.label = errorObj.response.data.message;
    }

    this.label += " ("+errorObj.message+")";
  }
}
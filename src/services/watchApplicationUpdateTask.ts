import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import {ApplicationLifecycleStatusStatusEnum, ApplicationDescription} from "./controlPlaneApi/gen";
import ApplicationService from "./application";
import * as vscode from "vscode";
import * as Constants from "../common/constants";

export default class WatchApplicationUpdateTask implements TObservableTask<ApplicationDescription> {
  private beganDeploying = false;
  constructor(private readonly controlPanelName: string,
              private readonly tenantName: string,
              private readonly applicationId: string,
              private readonly applicationService: ApplicationService,
              private readonly progressCallBack: () => Promise<void>) {
  }

  errorThreshold = 5; //this because the application can be in a state of errorDeploying for a while

  pollingInterval = 1200;
  timeout = 200000;

  action(): Promise<ApplicationDescription | undefined> {
    return this.applicationService.get(this.tenantName, this.applicationId);
  }

  complete(hasErrors: boolean, actionResult: ApplicationDescription | undefined): boolean {
    // Wait till update has begun deploying before looking for deployed
    if(actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.deploying){
      this.beganDeploying = true;
    }

    return this.beganDeploying && (hasErrors || (actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.deployed));
  }

  hasErrors(actionResult: ApplicationDescription | undefined): boolean {
    return actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.errorDeploying;
  }

  onFinish(waitExpired: boolean, wasCancelled: boolean, hasErrors: boolean, wasAborted: boolean): void {
    if(waitExpired){
      vscode.window.showInformationMessage(`Timeout waiting for status of application, ${this.viewLogsMarkdown.value} or ${this.viewOutputWindowMarkdown.value} for more details`);
      return;
    }

    if(hasErrors){
      vscode.window.showErrorMessage(`Too many errors occurred during deployment,  ${this.viewLogsMarkdown.value} or ${this.viewOutputWindowMarkdown.value} for a possible cause`);
      return;
    }

    if(wasCancelled || wasAborted){
      return;
    }

    vscode.window.showInformationMessage(`Application updated ${this.viewLogsMarkdown.value}`);
  }

  onProgress(actionResult: ApplicationDescription | undefined): ProgressReport {
    //console.log("onProgress", actionResult);
    const increment = (100/(this.timeout/this.pollingInterval));
    this.progressCallBack();

    if (actionResult === undefined) {
      return {message: "Waiting to update", increment: increment};
    }

    switch (actionResult.status?.status?.status) {
      case ApplicationLifecycleStatusStatusEnum.created:
        return {message: `Agents starting`, increment: increment};
      case ApplicationLifecycleStatusStatusEnum.deploying:
        return {message: `Application starting`, increment: increment};
      case ApplicationLifecycleStatusStatusEnum.deployed:
        return {message: `Application deployed ${this.viewLogsMarkdown.value}`, increment: increment};
      default:
        return {message: `Deploying`, increment: increment};
    }
  }

  private get viewLogsMarkdown(): vscode.MarkdownString {
    const args = [this.controlPanelName, this.tenantName, this.applicationId];
    const watchLogsCommandUri = vscode.Uri.parse(`command:${Constants.COMMAND_OPEN_APP_LOGS_FROM_DEPLOY}?${encodeURIComponent(JSON.stringify(args))}`);
    return new vscode.MarkdownString(`[view logs](${watchLogsCommandUri})`);
  }

  private get viewOutputWindowMarkdown(): vscode.MarkdownString {
    const watchLogsCommandUri = vscode.Uri.parse(`command:${Constants.COMMAND_VIEW_OUTPUT_WINDOW}`);
    return new vscode.MarkdownString(`[view output window](${watchLogsCommandUri})`);
  }
}
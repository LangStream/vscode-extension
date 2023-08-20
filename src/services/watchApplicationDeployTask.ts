import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import {ApplicationLifecycleStatusStatusEnum, ApplicationDescription} from "./controlPlaneApi/gen";
import ApplicationService from "./application";
import * as vscode from "vscode";
import * as Constants from "../common/constants";

export default class WatchApplicationDeployTask implements TObservableTask<ApplicationDescription> {
  constructor(private readonly controlPanelName: string,
              private readonly tenantName: string,
              private readonly applicationId: string,
              private readonly applicationService: ApplicationService,
              private readonly progressCallBack: () => Promise<void>) {
  }

  errorThreshold = 20;

  pollingInterval = 1200;
  timeout = 300000;

  action(): Promise<ApplicationDescription | undefined> {
    return this.applicationService.get(this.tenantName, this.applicationId);
  }

  complete(hasErrors: boolean, actionResult: ApplicationDescription | undefined): boolean {
    return hasErrors || (actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.deployed);
  }

  hasErrors(actionResult: ApplicationDescription | undefined): boolean {
    //console.log("hasErrors", actionResult);
    return actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.errorDeploying;
  }

  onFinish(waitExpired: boolean, wasCancelled: boolean, hasErrors: boolean): void {
    if(waitExpired){
      vscode.window.showInformationMessage(`Timeout waiting for status of application, ${this.viewLogsMarkdown.value} or ${this.viewOutputWindowMarkdown.value} for more details`);
      return;
    }

    if(hasErrors){
      vscode.window.showErrorMessage(`Too many errors occurred during deployment,  ${this.viewLogsMarkdown.value} or ${this.viewOutputWindowMarkdown.value} for a possible cause`);
      return;
    }

    if(wasCancelled){
      vscode.window.showErrorMessage(`Deployment cancelled`);
      return;
    }

    vscode.window.showInformationMessage(`Application deployed ${this.viewLogsMarkdown.value}`);
  }

  onProgress(actionResult: ApplicationDescription | undefined): ProgressReport {
    console.log("onProgress", actionResult);
    const increment = (100/(this.timeout/this.pollingInterval));

    this.progressCallBack(); // fire and forget, don't let it block the progress

    if (actionResult === undefined) {
      return {message: "Waiting to deploy", increment: increment};
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
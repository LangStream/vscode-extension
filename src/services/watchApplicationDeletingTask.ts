import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import {window} from "vscode";
import ApplicationService from "./application";
import {ApplicationDescription, ApplicationLifecycleStatusStatusEnum} from "./controlPlaneApi/gen";

export default class WatchApplicationDeletingTask implements TObservableTask<ApplicationDescription> {
  constructor(private readonly tenantName: string,
              private readonly applicationId: string,
              private readonly applicationService: ApplicationService,
              private readonly progressCallBack: () => Promise<void>) {
  }

  action = () => {
    return this.applicationService.get(this.tenantName, this.applicationId);
  };
  errorThreshold = 0;
  pollingInterval = 1000;
  timeout = 120000;
  complete = (hasErrors: boolean, applicationDescription?: ApplicationDescription) => {
    return (hasErrors || applicationDescription === undefined);
  };
  onProgress = (/*storedApplication?: StoredApplication*/) => {
    //console.log(storedApplication);
    this.progressCallBack();
    const increment = (100/(this.timeout/this.pollingInterval));

    return new class implements ProgressReport {
      message = "Application being deleted";
      increment = increment;
    };
  };
  onFinish = (waitExpired:boolean, wasCancelled: boolean, hasErrors: boolean, wasAborted: boolean): void => {
    if(waitExpired){
      window.showInformationMessage(`Timeout waiting for status of application ${this.tenantName}/${this.applicationId}`);
      return;
    }

    if(hasErrors){
      window.showErrorMessage(`Too many errors found for application ${this.tenantName}/${this.applicationId}. Check status for more details`);
      return;
    }

    if(wasCancelled || wasAborted){
      return;
    }

    window.showInformationMessage(`Application ${this.tenantName}/${this.applicationId} deleted`);
  };
  hasErrors = (actionResult: ApplicationDescription | undefined) => {
    return actionResult?.status?.status?.status === ApplicationLifecycleStatusStatusEnum.errorDeleting;
  };
};
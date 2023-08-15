import {StoredApplication, TenantConfiguration} from "./controlPlaneApi/gen";
import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import ControlPlaneTreeDataProvider from "../providers/controlPlaneTreeData/explorer";
import {window} from "vscode";
import ApplicationService from "./application";

export default class WatchApplicationDeletingTask implements TObservableTask<StoredApplication> {
  constructor(private readonly tenantName: string, private readonly applicationId: string, private readonly applicationService: ApplicationService, private readonly controlPlaneTreeDataProvider: ControlPlaneTreeDataProvider) {
  }

  action = () => {
    return this.applicationService.get(this.tenantName, this.applicationId);
  };

  errorThreshold = 0;
  pollingInterval = 1000;
  timeout = 120000;
  complete = (hasErrors: boolean, storedApplication?: StoredApplication) => {
    return (hasErrors || storedApplication === undefined);
  };
  onProgress = (storedApplication?: StoredApplication) => {
    console.log(storedApplication);
    const increment = (100/(this.timeout/this.pollingInterval));

    return new class implements ProgressReport {
      message = "Application being deleted";
      increment = increment;
    };
  };

  onFinish = (waitExpired:boolean, wasCancelled: boolean, hasErrors: boolean): void => {
    this.controlPlaneTreeDataProvider.refresh();

    if(waitExpired){
      window.showInformationMessage(`Timeout waiting for status of application ${this.tenantName}/${this.applicationId}`);
      return;
    }

    if(hasErrors){
      window.showErrorMessage(`Too many errors found for application ${this.tenantName}/${this.applicationId}. Check status for more details`);
      return;
    }

    if(wasCancelled){
      window.showErrorMessage(`Cancelled deleting application ${this.tenantName}/${this.applicationId}`);
      return;
    }

    window.showInformationMessage(`Application ${this.tenantName}/${this.applicationId} deleted`);
  };
  hasErrors = () => {
    return false;
  };
};
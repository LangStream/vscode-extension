import {TenantConfiguration} from "./controlPlaneApi/gen";
import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import {window} from "vscode";
import TenantService from "./tenant";

export default class WatchTenantDeletingTask implements TObservableTask<TenantConfiguration> {
  constructor(private readonly tenantName: string, private readonly tenantService: TenantService, private readonly progressCallBack: () => Promise<void>) {
  }

  action = () => {
    return this.tenantService.get(this.tenantName);
  };
  errorThreshold = 3;
  pollingInterval = 1000;
  timeout = 120000;
  complete = (hasErrors: boolean, tenantConfiguration?: TenantConfiguration) => {
    return tenantConfiguration === undefined;
  };
  onProgress = () => {
    //console.log(tenantConfiguration);
    const increment = (100/(this.timeout/this.pollingInterval));
    this.progressCallBack();

    return new class implements ProgressReport {
      message = "Tenant being deleted";
      increment = increment;
    };
  };

  onFinish = (waitExpired:boolean, wasCancelled: boolean, hasErrors: boolean): void => {

    if(waitExpired){
      window.showInformationMessage(`Timeout waiting for status of tenant ${this.tenantName}`);
      return;
    }

    if(hasErrors){
      window.showErrorMessage(`Too many errors found for tenant ${this.tenantName}. Check status for more details`);
      return;
    }

    window.showInformationMessage(`Tenant ${this.tenantName} deleted`);
  };
  hasErrors = () => {
    return false;
  };
};
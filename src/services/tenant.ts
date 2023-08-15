import ControlPlaneService from "./controlPlane";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import Logger from "../common/logger";
import {TenantConfiguration} from "./controlPlaneApi/gen";

export default class TenantService {
  private controlPlaneService: ControlPlaneService;
  constructor(controlPlane: TSavedControlPlane) {
    this.controlPlaneService = new ControlPlaneService(controlPlane.webServiceUrl);
  }

  public async delete(tenantName: string) {
    return new Promise<void>((resolve, reject) => {

      this.controlPlaneService.deleteTenant(tenantName).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Delete tenant`, e);
        reject(e);
      });
    });
  }

  public async add(tenantName: string) {
    return new Promise<void>((resolve, reject) => {

      this.controlPlaneService.addTenant(tenantName).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Add tenant`, e);
        reject(e);
      });
    });
  }

  public async get(tenantName: string) {
    return new Promise<TenantConfiguration>((resolve, reject) => {

      this.controlPlaneService.getTenant(tenantName).then((tenantConfig) => {
        if(tenantConfig === undefined){
          reject(new Error('Count not find tenant configuration'));
          return;
        }

        resolve(tenantConfig);
      }).catch((e: any) => {
        Logger.error(`Get tenant`, e);
        reject(e);
      });
    });
  }

  public async listNames() {
    return new Promise<string[]>((resolve, reject) => {

      this.controlPlaneService.listTenantNames().then((tenantNames) => {
        resolve(tenantNames);
      }).catch((e: any) => {
        Logger.error(`List tenants`, e);
        reject(e);
      });
    });
  }
}
import ControlPlaneService from "./controlPlane";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import Logger from "../common/logger";
import * as fs from "fs";
import {ApplicationDescription} from "./controlPlaneApi/gen";

export default class ApplicationService {
  private controlPlaneService: ControlPlaneService;
  constructor(controlPlane: TSavedControlPlane) {
    this.controlPlaneService = new ControlPlaneService(controlPlane.webServiceUrl);
  }

  public async delete(tenantName: string, applicationId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.controlPlaneService.deleteApplication(tenantName, applicationId).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Delete application`, e);
        reject(e);
      });
    });
  }

  public async get(tenantName: string, applicationId: string): Promise<ApplicationDescription | undefined> {
    return new Promise<ApplicationDescription | undefined>((resolve, reject) => {
      this.controlPlaneService.getApplication(tenantName, applicationId).then((appDescription) => {
        resolve(appDescription);
      }).catch((e: any) => {
        Logger.error(`Get application`, e);
        reject(e);
      });
    });
  }

  public async listIds(tenantName: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.controlPlaneService.listApplicationIds(tenantName).then((ids) => {
        resolve(ids);
      }).catch((e: any) => {
        Logger.error(`List application ids`, e);
        reject(e);
      });
    });
  }

  public async deploy(tenantName: string,
                      applicationId: string,
                      applicationArtifactPath: fs.PathLike,
                      instanceManifestPath: fs.PathLike,
                      secretsManifestPath?: fs.PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.controlPlaneService.deployApplication(tenantName, applicationId, applicationArtifactPath, instanceManifestPath, secretsManifestPath).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Deploy app`, e);
        reject(e);
      });
    });
  }

  public async update(tenantName: string,
                      applicationId: string,
                      applicationArtifactPath: fs.PathLike,
                      instanceManifestPath: fs.PathLike,
                      secretsManifestPath?: fs.PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.controlPlaneService.updateApplication(tenantName, applicationId, applicationArtifactPath, instanceManifestPath, secretsManifestPath).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Update app`, e);
        reject(e);
      });
    });
  }

  public async getLogs(tenantName: string, applicationId: string, filter?: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.controlPlaneService.getApplicationLogs(tenantName, applicationId, filter).then((logs) => {
        resolve(logs);
      }).catch((e: any) => {
        Logger.error(`Get app logs`, e);
        reject(e);
      });
    });
  };
}
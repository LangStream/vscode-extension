import ControlPlaneService from "./controlPlane";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import Logger from "../common/logger";
import {ApplicationRuntimeInfo, Dependency, StoredApplication} from "./controlPlaneApi/gen";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as crypto from "crypto";
import {PathLike} from "fs";
import {zipFiles} from "../utils/zip";

export default class ApplicationService {
  private controlPlaneService: ControlPlaneService;
  constructor(controlPlane: TSavedControlPlane) {
    this.controlPlaneService = new ControlPlaneService(controlPlane.webServiceUrl);
  }

  public async delete(tenantName: string, applicationId: string) {
    return new Promise<void>((resolve, reject) => {

      this.controlPlaneService.deleteApplication(tenantName, applicationId).then(() => {
        resolve();
      }).catch((e: any) => {
        Logger.error(`Delete application`, e);
        reject(e);
      });
    });
  }

  public async get(tenantName: string, applicationId: string) {
    return new Promise<StoredApplication | undefined>((resolve, reject) => {
      this.controlPlaneService.getApplication(tenantName, applicationId).then((storedApp) => {
        resolve(storedApp);
      }).catch((e: any) => {
        Logger.error(`Get tenant`, e);
        reject(e);
      });
    });
  }

  public async listIds(tenantName: string) {
    return new Promise<string[]>((resolve, reject) => {
      this.controlPlaneService.listApplicationIds(tenantName).then((ids) => {
        resolve(ids);
      }).catch((e: any) => {
        Logger.error(`List application ids`, e);
        reject(e);
      });
    });
  }

  public async deploy(tenantName: string, applicationId: string, applicationArtifactPath: fs.PathLike): Promise<void> {
    return this.controlPlaneService.deployApplication(tenantName, applicationId, applicationArtifactPath);
  }

  public async update(tenantName: string, applicationId: string, applicationArtifactPath: fs.PathLike): Promise<void> {
    return this.controlPlaneService.updateApplication(tenantName, applicationId, applicationArtifactPath);
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

  public async getRuntimeInfo(tenantName: string, applicationId: string): Promise<ApplicationRuntimeInfo | undefined> {
    return new Promise<ApplicationRuntimeInfo | undefined>((resolve, reject) => {
      this.controlPlaneService.getApplicationRuntimeInfo(tenantName, applicationId).then((runtimeInfo) => {
        resolve(runtimeInfo);
      }).catch((e: any) => {
        Logger.error(`Get runtime info`, e);
        reject(e);
      });
    });
  };

  public async zipApplication(zipDestinationPath: PathLike,
                              modulePath: PathLike,
                              instancePath: PathLike,
                              configurationPath: PathLike | undefined,
                              secretsPath: PathLike | undefined,
                              gatewaysPath: PathLike | undefined,
                              pythonPath: PathLike | undefined,
                              dependenciesPaths: [string, PathLike][] = []): Promise<void> {
    const fileInfo:[string, PathLike][] = [
      ["pipeline.yaml", modulePath],
      ["instance.yaml", instancePath]
    ];

    if(configurationPath !== undefined){ fileInfo.push(["configuration.yaml", configurationPath]); }
    if(secretsPath !== undefined){ fileInfo.push(["secrets.yaml", secretsPath]); }
    if(gatewaysPath !== undefined){ fileInfo.push(["gateways.yaml", gatewaysPath]); }
    if(pythonPath !== undefined){
      const a = this.gatherDirFiles("python", pythonPath.toString());
      fileInfo.push(...a); }

    fileInfo.push(...dependenciesPaths);

    return zipFiles(zipDestinationPath, ...fileInfo);
  }

  private gatherDirFiles(zipDirPath:string, pathToDir: string): [string, PathLike][] {
    const a: [string, PathLike][] = [];

    fs.readdirSync(pathToDir, { withFileTypes: true }).forEach((value: fs.Dirent) => {
      if(value.isFile()) {
        a.push([`${zipDirPath}/${value.name}`, path.join(pathToDir, value.name)]);
      }

      if(value.isDirectory()) {
        a.push(...this.gatherDirFiles(`${zipDirPath}/${value.name}`, path.join(pathToDir, value.name)));
      }
    });

    return a;
  }

  public async downloadDependencies(saveFolderPath: PathLike, dependencies: Dependency[]): Promise<[string, PathLike][]> {
    return new Promise<[string, PathLike][]>(async (resolve, reject) => {
      const dependencyPaths: [string, PathLike][] = [];
      const errors: Error[] = [];

      for (const dependency of dependencies) {
        if (dependency.url === undefined) {
          errors.push(new Error('url is undefined'));
          continue;
        }

        if (dependency.type === undefined) {
          errors.push(new Error('type is undefined'));
          continue;
        }

        if (dependency.sha512sum === undefined) {
          errors.push(new Error('sha512sum is undefined'));
          continue;
        }

        Logger.debug(`Downloading dependency type '${dependency.type}' from '${dependency.url}'`);
        const url = new URL(dependency.url);

        let outputPath = "";
        let zipFilePath = "";

        switch (dependency.type) {
          case "java-library":
            outputPath = path.join(<string>saveFolderPath, "java", "lib");
            zipFilePath = 'java/lib';
            break;
          default:
            errors.push(new Error("unsupported dependency type: " + dependency.type));
            continue;
        }

        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, {recursive: true});
        }

        const fileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        const filePath = path.join(outputPath, fileName);
        zipFilePath = `${zipFilePath}/${fileName}`;

        // Block thread until file is downloaded
        const axiosResponse = await axios.get(url.href, {responseType: 'arraybuffer'});

        if(axiosResponse.status !== 200){
          errors.push(new Error(`Failed to download file, status code: ${axiosResponse.status}`));
          return;
        }

        if(axiosResponse.data === undefined){
          errors.push(new Error(`Failed to download file, the file is either empty or undefined`));
          return;
        }

        const fileData = Buffer.from(axiosResponse.data, 'binary');

        // Check hash
        const hashSum = crypto.createHash('sha512');
        hashSum.update(fileData);

        const hex = hashSum.digest('hex');

        if (dependency.sha512sum !== hex) {
          Logger.error(`File hash mismatch, expected: ${dependency.sha512sum}, actual: ${hex}`);
          errors.push(new Error('File hash could not be validated'));
          return;
        }

        try{
          fs.writeFileSync(filePath, fileData);
          dependencyPaths.push([zipFilePath, filePath]);
        }catch(e: any) {
          errors.push(e);
        }
      }

      if (dependencyPaths.length < dependencies.length || errors.length > 0) {
        reject(new Error(errors.map(error => error.message).join(', ')));
        return;
      }

      resolve(dependencyPaths);
    });
  }
}
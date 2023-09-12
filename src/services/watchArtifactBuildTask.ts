import {ProgressReport, TObservableTask} from "../types/tObservableTask";
import * as fs from "fs";
import * as fflate from "fflate";
import Logger from "../common/logger";
import * as vscode from "vscode";

export default class WatchArtifactBuildTask implements TObservableTask<Uint8Array> {
  constructor(private readonly zipFilePath: string) {}
  action(): Promise<Uint8Array | undefined> {
    return new Promise<Uint8Array | undefined>((resolve, reject) => {
      try{
        fs.readFile(this.zipFilePath, (err, data) => {
          if(err){
            if(err.code !== 'ENOENT'){
              reject(err);
            }

            resolve(undefined);
          }

          Logger.debug(`Artifact size: ${data?.length/1000 ?? "??"} kb`);
          resolve(data as Uint8Array);
        });
      }catch (e) {
        reject(e);
      }
    });
  }
  complete(hasErrors: boolean, fileBuffer: Uint8Array | undefined): boolean {
    if(hasErrors){
      return true;
    }

    if(fileBuffer === undefined){
      return false;
    }

    try{
      fflate.unzipSync(fileBuffer);
      return true;
    }catch(e){
      Logger.error('Error testing zip', e);
      return false;
    }
  }
  hasErrors(fileBuffer: Uint8Array | undefined): boolean {
    return false;
  }
  onFinish(waitExpired: boolean, wasCancelled: boolean, hasErrors: boolean, wasAborted: boolean): void {
    if(waitExpired){
      vscode.window.showInformationMessage(`Timeout while waiting for artifact to be created`);
      return;
    }

    if(wasCancelled){
      return;
    }

    if(hasErrors){
      vscode.window.showErrorMessage(`Errors were reported while waiting for artifact to be created`);
      return;
    }
  }
  onProgress(fileBuffer: Uint8Array | undefined): ProgressReport {
    const increment = (100/(this.timeout/this.pollingInterval));

    return new class implements ProgressReport {
      increment = increment;
      message = `Creating application artifact...`;
    };
  }

  pollingInterval= 500;
  timeout= 30000;
  errorThreshold=0;
}
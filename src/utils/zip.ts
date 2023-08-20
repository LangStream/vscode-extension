import * as fs from "fs";
import {PathLike} from "fs";
import * as fflate from "fflate";
import Logger from "../common/logger";
import {TArtifactItem} from "../types/tArtifactItem";

export async function zipFiles(zipDestinationPath: PathLike, files: TArtifactItem[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Logger.debug(`Zipping files to ${zipDestinationPath}`);
    const fileObj: fflate.Zippable = {};

    try{
      files.forEach(([zipPath, diskPath]) => {
        Logger.debug(`Adding ${diskPath} to zip at ${zipPath}`);
        fileObj[zipPath] = fs.readFileSync(diskPath);
      });
    } catch(e:any) {
      reject(e);
      return;
    }

    fflate.zip(fileObj, (err, data)=> {
      if(err){
        reject(err);
        return;
      }

      const zipFileData = data as Uint8Array;

      try{
        fs.writeFile(zipDestinationPath, zipFileData, (err) => {
          if(err){
            reject(err);
            return;
          }

          resolve();
        });
      } catch(e:any) {
        reject(e);
      }
    });
  });
}
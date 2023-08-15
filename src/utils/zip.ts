import * as fs from "fs";
import * as fflate from "fflate";
import Logger from "../common/logger";
import {PathLike} from "fs";

export async function zipFiles(zipDestinationPath: PathLike, ...fileInfo: [zipPath: string, diskPath: PathLike][]): Promise<void> {
  Logger.debug(`Zipping files to ${zipDestinationPath}`);

  return new Promise<void>((resolve, reject) => {
    const fileObj: fflate.Zippable = {};

    try{
      fileInfo.forEach(([zipPath, diskPath]) => {
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
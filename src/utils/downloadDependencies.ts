import {PathLike} from "fs";
import {IDependency} from "../interfaces/iDependency";
import {TArtifactItem} from "../types/tArtifactItem";
import Logger from "../common/logger";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import * as crypto from "node:crypto";

export async function downloadDependencies(saveFolderPath: PathLike, dependencies: IDependency[]): Promise<TArtifactItem[]> {
  const promises = dependencies.map(async (dependency) => {
    return downloadDependency(dependency, saveFolderPath);
  });

  return Promise.all(promises);
}

async function downloadDependency(dependency: IDependency, saveFolderPath: PathLike): Promise<TArtifactItem> {
  if (dependency.url === undefined) {
    throw new Error('url is undefined');
  }

  if (dependency.type === undefined) {
    throw new Error('type is undefined');
  }

  if (dependency.sha512sum === undefined) {
    throw new Error('sha512sum is undefined');
  }

  Logger.debug(`Downloading dependency type '${dependency.type}' from '${dependency.url}'`);
  const url = new URL(dependency.url);

  let outputPath = "";
  let artifactFilePath = "";

  switch (dependency.type) {
    case "java-library":
      outputPath = path.join(<string>saveFolderPath, "java", "lib");
      artifactFilePath = 'java/lib';
      break;
    default:
      throw new Error("unsupported dependency type: " + dependency.type);
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, {recursive: true});
  }

  const fileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
  const filePath = path.join(outputPath, fileName);
  artifactFilePath = `${artifactFilePath}/${fileName}`;

  // Block thread until file is downloaded
  const axiosResponse = await axios.get(url.href, {responseType: 'arraybuffer'});

  if(axiosResponse.status !== 200){
    throw new Error(`Failed to download file, status code: ${axiosResponse.status}`);
  }

  if(axiosResponse.data === undefined){
    throw new Error(`Failed to download file, the file is either empty or undefined`);
  }

  const fileData = Buffer.from(axiosResponse.data, 'binary');

  // Check hash
  const hashSum = crypto.createHash('sha512');
  hashSum.update(fileData);

  const hex = hashSum.digest('hex');

  if (dependency.sha512sum !== hex) {
    Logger.error(`File hash mismatch, expected: ${dependency.sha512sum}, actual: ${hex}`);
    throw new Error('File hash could not be validated');
  }

  try{
    fs.writeFileSync(filePath, fileData);
  }catch(e: any) {
    Logger.error(`Error saving dependency`, e);
    throw new Error('An error occurred while saving the dependency');
  }

  return [artifactFilePath, filePath];
}
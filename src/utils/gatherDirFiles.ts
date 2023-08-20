import {TArtifactItem} from "../types/tArtifactItem";
import * as fs from "fs";
import * as path from "path";

export function gatherDirFiles(zipDirPath:string, pathToDir: string): TArtifactItem[] {
  const artifactItems: TArtifactItem[] = [];

  fs.readdirSync(pathToDir, { withFileTypes: true }).forEach((value: fs.Dirent) => {
    if(value.isFile()) {
      artifactItems.push([`${zipDirPath}/${value.name}`, path.join(pathToDir, value.name)]);
    }

    if(value.isDirectory()) {
      artifactItems.push(...gatherDirFiles(`${zipDirPath}/${value.name}`, path.join(pathToDir, value.name)));
    }
  });

  return artifactItems;
}
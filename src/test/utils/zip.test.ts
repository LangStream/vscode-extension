import {expect} from "chai";
import {zipFiles} from "../../utils/zip";
import * as fflate from "fflate";
import * as fs from "fs";

describe("Zip util tests", () => {
  it("should zip up files", async () => {
    const zipFilePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\utils\\test.zip";
    const modulePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\application\\pipeline.yaml";
    const configurationPath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\application\\configuration.yaml";
    const instancePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\instance.yaml";
    const secretsPath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\secrets.yaml";

    const files:[zipPath: string, diskPath: fs.PathLike][] = [["application/pipeline.yaml", modulePath], ["instance.yaml", instancePath]];
    if(configurationPath){files.push(["application/configuration.yaml", configurationPath]);}
    if(secretsPath){files.push(["secrets.yaml", secretsPath]);}

    await zipFiles(zipFilePath, ...files);

    const fileBuffer = fs.readFileSync(zipFilePath);
    expect(fileBuffer.length).to.be.greaterThan(0);

    const unzipped:fflate.Unzipped = fflate.unzipSync(fileBuffer);
    expect(unzipped).to.not.be.undefined;
    const unzippedFiles = Object.keys(unzipped);
    expect(unzippedFiles.length).to.be.equal(4);
    expect(unzippedFiles).to.include("application/pipeline.yaml");
    expect(unzippedFiles).to.include("application/configuration.yaml");
    expect(unzippedFiles).to.include("instance.yaml");
    expect(unzippedFiles).to.include("secrets.yaml");

    fs.rmSync(zipFilePath, {force: true});
  });
});
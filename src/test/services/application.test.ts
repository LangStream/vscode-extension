import {expect} from "chai";
import ApplicationService from "../../services/application";
import {TSavedControlPlane} from "../../types/tSavedControlPlane";
import {sleep} from "../../utils/sleep";
import {PathLike} from "fs";
import * as fs from "fs";
import * as fflate from "fflate";
import {Dependency} from "../../services/controlPlaneApi/gen";
import * as path from "path";

describe("Application service tests", () => {
  let applicationService: ApplicationService;
  const savedControlPane: TSavedControlPlane = {
    name: "test",
    webServiceUrl: "http://localhost:8090",
    apiGatewayUrl: "ws://localhost:8091",
  };

  before(() => {
    applicationService = new ApplicationService(savedControlPane);
  });

  it("should list application ids", async () => {
    const tenantName = "default";
    const appIds = await applicationService.listIds(tenantName);
    console.log(appIds);
    expect(appIds).to.not.be.undefined;
    expect(appIds).length.to.be.greaterThan(0);
  });

  it("should delete application", async () => {
    const tenantName = "default";
    const applicationId = "test-cassandra-on-s4k";
    await applicationService.delete(tenantName, applicationId);
    await sleep(1000);
    const storedApp = await applicationService.get(tenantName, applicationId);
    expect(storedApp).to.be.undefined;
  });

  it("should get application", async () => {
    const tenantName = "default";
    const appIds = await applicationService.listIds(tenantName);
    const storedApp = await applicationService.get(tenantName, appIds[0]);
    console.log(storedApp);
    expect(storedApp).to.not.be.undefined;
  });

  it("should get application logs", async () => {
    const tenantName = "default";
    const applicationId = "test-cassandra-on-s4k";
    const logs = await applicationService.getLogs(tenantName, applicationId);
    console.log(logs);
    expect(logs).to.not.be.undefined;
    expect(logs).length.to.be.greaterThan(0);
  });

  it("should download dependencies", async () => {
    const saveFolderPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\services\\temp";
    const dependencies = [
      new class implements Dependency{
        name = "Kafka Connect Sink for Apache Cassandra from DataStax";
        url ="https://github.com/datastax/kafka-sink/releases/download/1.5.0/kafka-connect-cassandra-sink-1.5.0.jar";
        sha512sum ="242bf60363d36bd426232451cac836a24ae8d510857372a128f601503ad77aa9eabf14c4f484ca0830b6a68d9e8664e3820739ad8dd3deee2c58e49a94a20a3c";
        type = "java-library";
      }
    ];

    const dependenciesPaths:[string, PathLike][] = await applicationService.downloadDependencies(saveFolderPath, dependencies);
    expect(dependenciesPaths).to.not.be.undefined;
    expect(dependenciesPaths.length).to.equal(1);
    expect(dependenciesPaths[0][0]).to.equal("java/lib/kafka-connect-cassandra-sink-1.5.0.jar");
    expect(dependenciesPaths[0][1]).to.equal(path.join(saveFolderPath, "java", "lib", "kafka-connect-cassandra-sink-1.5.0.jar"));

    fs.rmSync(saveFolderPath, {force: true, recursive: true});
  });

  it("should zip application, dependencies, and python", async () => {
    const zipFilePath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\services\\temp.zip";
    const modulePath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\application\\pipeline.yaml";
    const configurationPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\application\\configuration.yaml";
    const gatewaysPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\application\\gateways.yaml";
    const instancePath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\instance.yaml";
    const secretsPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\secrets.yaml";
    const pythonPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\test-app\\application\\python";
    const dependenciesPaths:[string, PathLike][] = [
      ["java/lib/some-dependency.txt", "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\some-dependency.txt"],
      ["java/lib/another-dependency.json", "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\another-dependency.json"],
    ];

    await applicationService.zipApplication(zipFilePath, modulePath, instancePath, configurationPath, secretsPath, gatewaysPath, pythonPath, dependenciesPaths);

    const fileBuffer = fs.readFileSync(zipFilePath);
    expect(fileBuffer.length).to.be.greaterThan(0);

    const unzipped:fflate.Unzipped = fflate.unzipSync(fileBuffer);
    expect(unzipped).to.not.be.undefined;
    const unzippedFiles = Object.keys(unzipped);
    expect(unzippedFiles.length).to.be.equal(9);
    expect(unzippedFiles).to.include("pipeline.yaml");
    expect(unzippedFiles).to.include("configuration.yaml");
    expect(unzippedFiles).to.include("gateways.yaml");
    expect(unzippedFiles).to.include("python/example.py");
    expect(unzippedFiles).to.include("python/another/example2.py");
    expect(unzippedFiles).to.include("instance.yaml");
    expect(unzippedFiles).to.include("secrets.yaml");
    expect(unzippedFiles).to.include("java/lib/some-dependency.txt");
    expect(unzippedFiles).to.include("java/lib/another-dependency.json");

    fs.rmSync(zipFilePath, {force: true});
  });
});
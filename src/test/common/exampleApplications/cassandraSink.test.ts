import CassandraSinkExampleApplication from "../../../common/exampleApplications/cassandraSink";
import {
  ApplicationDescription,
  ApplicationLifecycleStatusStatusEnum,
  Gateway,
  GatewayTypeEnum
} from "../../../services/controlPlaneApi/gen";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import ApplicationService from "../../../services/application";
import {expect} from "chai";
import {sleep} from "../../../utils/sleep";
import * as fs from "fs";
import KafkaSecret from "../../../common/secrets/kafka";
import CassandraSecret from "../../../common/secrets/cassandra";
import * as yaml from 'yaml';
import TDeployableApplication from "../../../types/tDeployableApplication";
import {downloadDependencies} from "../../../utils/downloadDependencies";
import {IDependency} from "../../../interfaces/iDependency";
import {TArtifactItem} from "../../../types/tArtifactItem";
import {zipFiles} from "../../../utils/zip";
import {writeApplicationAsFiles} from "../../../utils/writeApplicationAsFiles";
import * as path from "path";

describe("Cassandra sink example application tests", () => {
  const snippetsDirPath = path.join(__dirname, "..", "..", "..", "..", "snippets");
  const applicationFolder = path.join(__dirname,"temp");
  const zipFilePath = path.join(__dirname,"temp.zip");
  const secrets = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "secrets-for-test.yaml"));
  const savedControlPane: TSavedControlPlane = {
    name: "test",
    webServiceUrl: "http://localhost:8090",
    apiGatewayUrl: "ws://localhost:8091",
  };
  let applicationService: ApplicationService;
  let exampleApplication: CassandraSinkExampleApplication;

  before(() => {
    const secretsForTests = yaml.parse(secrets.toString());
    applicationService = new ApplicationService(savedControlPane);

    const kafkaSecret = new KafkaSecret(secretsForTests.kafka["bootstrap-servers"], secretsForTests.kafka["username"], secretsForTests.kafka["password"]);
    const cassandraSecret = new CassandraSecret(secretsForTests.cassandra["secure-connect-bundle"], secretsForTests.cassandra["username"], secretsForTests.cassandra["password"]);
    exampleApplication = new CassandraSinkExampleApplication(snippetsDirPath, kafkaSecret, cassandraSecret);
  });

  it("should be a valid application", async () => {
    const firstAgent = exampleApplication.modules[0].pipelines[0];

    // Check topics
    expect(exampleApplication.modules[0].topics[0].name).to.equal("input-topic");
    expect(firstAgent.input).to.equal("input-topic");
    expect(firstAgent.output).to.be.undefined;

    // Match topics to gateways
    exampleApplication.gateways.forEach((gateway:Gateway) => {
      switch (gateway.type){
        case GatewayTypeEnum.produce:
          expect(firstAgent.input).to.equal(gateway.topic);
          break;
        case GatewayTypeEnum.consume:
          expect(firstAgent.output).to.equal(gateway.topic);
          break;
      }
    });

    // Check type
    expect(firstAgent.type).to.equal("sink");

    // Check configurations & secrets
    exampleApplication.secrets.forEach((secret) => {
      switch (secret.name){
        case "kafka":
          const admin:any = exampleApplication.instance.streamingCluster.configuration!["admin"];

          // @ts-ignore
          expect(secret.data["bootstrap-servers"]).to.not.be.undefined;
          expect(admin["bootstrap.servers"]).to.equal("{{{ secrets.kafka.bootstrap-servers }}}");

          expect(secret.data["username"]).to.not.be.undefined;
          expect(admin["sasl.jaas.config"]).to.contain("{{{ secrets.kafka.username }}}");

          expect(secret.data["password"]).to.not.be.undefined;
          expect(`{${admin["sasl.jaas.config"]}}`).to.contain("{{{ secrets.kafka.password }}}");
          break;

        case "cassandra":
          // @ts-ignore
          expect(secret.data["secure-connect-bundle"]).to.not.be.undefined;
          expect(firstAgent.configuration!["cloud.secureConnectBundle"]).to.equal("{{{ secrets.cassandra.secure-connect-bundle }}}");

          expect(secret.data["username"]).to.not.be.undefined;
          expect(firstAgent.configuration!["auth.username"]).to.equal("{{{ secrets.cassandra.username }}}");

          expect(secret.data["password"]).to.not.be.undefined;
          expect(firstAgent.configuration!["auth.password"]).to.equal("{{{ secrets.cassandra.password }}}");
          break;
      }
    });
  });

  it("should write application as files", async () => {
    cleanup(applicationFolder, zipFilePath);
    const applicationFilePaths:TArtifactItem[] = writeApplicationAsFiles(applicationFolder, exampleApplication);

    expect(applicationFilePaths).to.not.be.undefined;
    expect(applicationFilePaths.length).to.equal(5);

    // Test pipeline.yaml
    const pipelinePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("pipeline.yaml"))![1];
    const module = yaml.parse(fs.readFileSync(pipelinePath).toString());
    expect(module).to.not.be.undefined;
    expect(module.name).to.equal(exampleApplication.modules[0].name);

    // Topics
    expect(module.topics[0].name).to.equal(exampleApplication.modules[0].topics[0].name);

    // Agents
    expect(module.pipeline[0]).to.not.be.undefined;
    expect(module.pipeline[0].name).to.equal(exampleApplication.modules[0].pipelines[0].name);
    // @ts-ignore
    expect(module.pipeline[0].type).to.equal(exampleApplication.modules[0].pipelines[0].type);

    // Test gateways.yaml
    const gatewaysPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("gateways.yaml"))![1];
    const gateways = yaml.parse(fs.readFileSync(gatewaysPath).toString());
    expect(gateways.gateways[0].type).to.equal(exampleApplication.gateways[0].type);

    // Test configuration.yaml
    const configurationPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("configuration.yaml"))![1];
    const configuration = yaml.parse(fs.readFileSync(configurationPath).toString());
    expect(configuration.configuration.dependencies[0].name).to.equal(exampleApplication.configuration.dependencies[0].name);

    // Test instance.yaml
    const instancePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("instance.yaml"))![1];
    const instance = yaml.parse(fs.readFileSync(instancePath).toString());
    expect(instance.instance.streamingCluster.type).to.equal(exampleApplication.instance.streamingCluster.type);

    // Test secrets.yaml
    const secretsPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("secrets.yaml"))![1];
    const secrets = yaml.parse(fs.readFileSync(secretsPath).toString());
    expect(secrets.secrets[0].name).to.equal(exampleApplication.secrets[0].name);
    expect(secrets.secrets[1].name).to.equal(exampleApplication.secrets[1].name);

    cleanup(applicationFolder, zipFilePath);
  });

  it("should successfully deploy to control plane", async () => {
    const tenantName = "default";
    const applicationId = "test-cassandra";

    cleanup(applicationFolder, zipFilePath);

    const applicationFilePaths = writeApplicationAsFiles(applicationFolder, exampleApplication);
    const dependencyPaths = await downloadDependencies(applicationFolder, exampleApplication.configuration.dependencies);

    const deployableApplication = new class implements TDeployableApplication {
      name = "Cassandra example";
      configurationPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("configuration.yaml"))?.[1];
      controlPlane = savedControlPane;
      gatewaysPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("gateways.yaml"))?.[1];
      id = applicationId;
      instancePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("instance.yaml"))?.[1];
      modulePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("pipeline.yaml"))![1];
      secretsPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("secrets.yaml"))?.[1];
      applicationDescription = undefined;
      tenantName = tenantName;
      findDependencies(): IDependency[] { return []; }
    };

    const artifactFiles: TArtifactItem[] = [];
    artifactFiles.push(["pipeline.yaml", deployableApplication.modulePath]);
    artifactFiles.push(["configuration.yaml", deployableApplication.configurationPath!]);
    artifactFiles.push(["gateways.yaml", deployableApplication.gatewaysPath!]);
    artifactFiles.push(...dependencyPaths);

    await zipFiles(zipFilePath, artifactFiles);

    await applicationService.deploy(tenantName, applicationId, zipFilePath, deployableApplication.instancePath!, deployableApplication.secretsPath!);

    const storedApp = await watchDeploy(applicationService, tenantName, applicationId);
    expect(storedApp).to.not.be.undefined;

    expect(storedApp!.status?.status?.status).to.equal(ApplicationLifecycleStatusStatusEnum.deployed);
    cleanup(applicationFolder, zipFilePath);
  });
});

function cleanup(applicationFolder:string, zipFilePath:string){
  try{
    fs.rmSync(applicationFolder, {recursive: true});
    fs.rmSync(zipFilePath);
  }catch{}
}

async function watchDeploy(applicationService: ApplicationService, tenantName: string, applicationId: string): Promise<ApplicationDescription | undefined> {
  let errored = false;
  let storedApp: ApplicationDescription | undefined = undefined;
  const timer = setTimeout(() => {
    errored = true;
  }, 30 * 1000);

  while(!errored && (storedApp === undefined || storedApp?.status?.status?.status !== ApplicationLifecycleStatusStatusEnum.deployed)){
    storedApp = await applicationService.get(tenantName, applicationId);
    console.info("Status ", storedApp?.status?.status);
    await sleep(1000);
  }

  clearTimeout(timer);
  return  storedApp;
}

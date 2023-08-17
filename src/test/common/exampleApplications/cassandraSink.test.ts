import CassandraSinkExampleApplication from "../../../common/exampleApplications/cassandraSink";
import {
  ApplicationLifecycleStatusStatusEnum, Dependency,
  Gateway,
  GatewayTypeEnum,
  StoredApplication
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

describe("Cassandra sink example application tests", () => {
  const snippetsDirPath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\snippets";
  const applicationFolder = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\common\\exampleApplications\\temp";
  const zipFilePath = "C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\common\\exampleApplications\\temp.zip";
  const savedControlPane: TSavedControlPlane = {
    name: "test",
    webServiceUrl: "http://localhost:8090",
    apiGatewayUrl: "ws://localhost:8091",
  };
  let secretsForTests: any;
  let applicationService: ApplicationService;

  before(() => {
    const f = fs.readFileSync("C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\src\\test\\assets\\secrets-for-test.yaml");
    secretsForTests = yaml.parse(f.toString());
    applicationService = new ApplicationService(savedControlPane);
  });

  it("should be a valid application", async () => {
    const sampleApplication = new CassandraSinkExampleApplication(snippetsDirPath);

    //const firstPipeline = sampleApplication.Module.pipeline[0];
    const firstAgent = sampleApplication.Module.pipeline[0];

    // Check topics
    expect(sampleApplication.Module.topics[0].name).to.equal("input-topic");
    expect(firstAgent.input).to.equal("input-topic");
    expect(firstAgent.output).to.be.undefined;

    // Match topics to gateways
    sampleApplication.Gateways.forEach((gateway:Gateway) => {
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
    sampleApplication.Secrets.forEach((secret) => {
      switch (secret.name){
        case "kafka":
          const admin:any = sampleApplication.Instance.streamingCluster.configuration!["admin"];

          expect(secret.data["bootstrap-servers"]).to.not.be.undefined;
          expect(admin["bootstrap.servers"]).to.equal("{{ secrets.kafka.bootstrap-servers }}");

          expect(secret.data["username"]).to.not.be.undefined;
          expect(admin["sasl.jaas.config"]).to.contain("{{ secrets.kafka.username }}");

          expect(secret.data["password"]).to.not.be.undefined;
          expect(`{${admin["sasl.jaas.config"]}}`).to.contain("token:{{ secrets.kafka.password }}");
          break;

        case "cassandra":
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

  it("should successfully deploy to control plane", async () => {
    const tenantName = "default";
    const applicationId = "test-cassandra-on-s4k";
    const applicationService = new ApplicationService(savedControlPane);

    cleanup(applicationFolder, zipFilePath);

    const kafkaSecret = new KafkaSecret(secretsForTests.kafka["bootstrap-servers"], secretsForTests.kafka["username"], secretsForTests.kafka["password"]);
    const cassandraSecret = new CassandraSecret(secretsForTests.cassandra["secure-connect-bundle"], secretsForTests.cassandra["username"], secretsForTests.cassandra["password"]);
    const exampleApplication = new CassandraSinkExampleApplication(snippetsDirPath, kafkaSecret, cassandraSecret);
    const applicationFilePaths = exampleApplication.writeAsFiles(applicationFolder);
    const dependencyPaths = await applicationService.downloadDependencies(applicationFolder, exampleApplication.Configuration.dependencies);

    const deployableApplication = new class implements TDeployableApplication {
      name = "Cassandra example";
      configurationPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("configuration.yaml"))?.[1];
      controlPlane = savedControlPane;
      gatewaysPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("gateways.yaml"))?.[1];
      id = applicationId;
      instancePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("instance.yaml"))?.[1];
      modulePath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("pipeline.yaml"))![1];
      secretsPath = applicationFilePaths.find(([zipPath]) => zipPath.endsWith("secrets.yaml"))?.[1];
      storedApplication = undefined;
      tenantName = tenantName;
      findDependencies(): Dependency[] { return []; }
    };

    await applicationService.zipApplication(zipFilePath,
      deployableApplication.modulePath,
      <string>deployableApplication.instancePath,
      deployableApplication.configurationPath,
      deployableApplication.secretsPath,
      deployableApplication.gatewaysPath,
      undefined,
      dependencyPaths);

    await applicationService.deploy(tenantName, applicationId, zipFilePath);

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

async function watchDeploy(applicationService: ApplicationService, tenantName: string, applicationId: string): Promise<StoredApplication | undefined> {
  let errored = false;
  let storedApp: StoredApplication | undefined = undefined;
  const timer = setTimeout(() => {
    errored = true;
  }, 30 * 1000);

  while(!errored && (storedApp === undefined || storedApp?.status?.status?.status !== ApplicationLifecycleStatusStatusEnum.deployed)){
    console.info("Status ", storedApp?.status?.status?.status);
    storedApp = await applicationService.get(tenantName, applicationId);
    await sleep(1000);
  }

  clearTimeout(timer);
  return  storedApp;
}

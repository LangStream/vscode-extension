import {expect} from "chai";
import ApplicationService from "../../services/application";
import {TSavedControlPlane} from "../../types/tSavedControlPlane";
import {sleep} from "../../utils/sleep";

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
});
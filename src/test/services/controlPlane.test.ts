import {expect} from "chai";
import ControlPlaneService from "../../services/controlPlane";
import {zipFiles} from "../../utils/zip";

describe("Control plane client tests", () => {
  const webServiceUrl = "http://localhost:8090";
  const token = "";

  before(() => {

  });

  it("should list tenants", async () => {
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    const tenants = await controlPlaneService.listTenantNames();
    expect(tenants).to.be.an("array");
    expect(tenants).to.have.length.greaterThan(0);
  });

  it("should add tenant", async () => {
    const tenantName = "test-tenant1";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    await controlPlaneService.addTenant(tenantName);
  });

  it("should get tenant config", async () => {
    const tenantName = "default";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    const tenantConfig = await controlPlaneService.getTenant(tenantName);
    expect(tenantConfig).to.be.an("object");
    expect(tenantConfig?.name).to.equal(tenantName);
  });

  it("should delete tenant", async () => {
    const tenantName = "test-tenant1";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    await controlPlaneService.deleteTenant(tenantName);
  });

  it("should list applications", async () => {
    const tenantName = "test-tenant1";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);

    try{await controlPlaneService.addTenant(tenantName);}catch{}

    const applicationNames = await controlPlaneService.listApplicationIds(tenantName);
    expect(applicationNames).to.be.an("array");
  });

  it("should error getting application details", async () => {
    const tenantName = "test-tenant1";
    const applicationId = "application-1";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);

    try{
      await controlPlaneService.getApplication(tenantName, applicationId);
    }catch(err:any){
      expect(err.name).to.equal("AxiosError");
      expect(err.code).to.equal("ERR_BAD_REQUEST");
    }
  });

  it("should deploy application", async () => {
    // const tenantName = "test-tenant1";
    // const applicationId = "application-1";
    // const zipFilePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\services\\test.zip";
    // const modulePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\application\\pipeline.yaml";
    // const configurationPath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\application\\configuration.yaml";
    // const instancePath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\instance.yaml";
    // const secretsPath = "C:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\src\\test\\assets\\test-app\\secrets.yaml";
    //
    // await zipFiles(zipFilePath, modulePath, instancePath, configurationPath ?? "", secretsPath ?? "");
    //
    // const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    //
    // try{await controlPlaneService.addTenant(tenantName);}catch{}
    //
    // await controlPlaneService.deployApplication(tenantName, applicationId, zipFilePath);
  });

  it("should delete application", async () => {
    const tenantName = "test-tenant1";
    const applicationId = "application-1";
    const controlPlaneService = new ControlPlaneService(webServiceUrl, token);
    await controlPlaneService.deleteApplication(tenantName, applicationId);
  });

});
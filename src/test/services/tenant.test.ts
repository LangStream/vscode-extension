import {TSavedControlPlane} from "../../types/tSavedControlPlane";
import TenantService from "../../services/tenant";
import {expect} from "chai";

describe("Tenant service tests", () => {
  let tenantService: TenantService;
  const savedControlPane: TSavedControlPlane = {
    name: "test",
    webServiceUrl: "http://localhost:8090",
    apiGatewayUrl: "ws://localhost:8091",
  };

  before(() => {
    tenantService = new TenantService(savedControlPane);
  });

  it("should list tenant names", async () => {
    const tenantNames = await tenantService.listNames();
    expect(tenantNames).to.not.be.undefined;
    expect(tenantNames).length.to.be.greaterThan(0);
  });
});
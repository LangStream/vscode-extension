import GatewayMessageDocumentContent from "../../../providers/gatewayCustomEditor/gatewayMessageDocumentContent";
import {AgentConfiguration, GatewayTypeEnum} from "../../../services/controlPlaneApi/gen";
import {IGateway} from "../../../interfaces/iGateway";
import {expect} from "chai";

describe("Gateway message document content tests", () => {
  before(() => {
  });

  it("should create a new document", async () => {
    const agentConfigurations: AgentConfiguration[] = [
      new class implements AgentConfiguration {
        configuration = {
          a: {},
          c: {}
        };
        id = "an-agent-id";
        name = "agent name";
        input = {

        };
        output = {

        };
        type = "agent-type";
      }
    ];

    const gatewayWebSocketUrls: {gateway:IGateway, webSocketUrl:URL}[] = [
      {
        gateway: {
          id: "consume-gateway-id",
          type: GatewayTypeEnum.consume,
          topic: "a-topic"
        },
        webSocketUrl: new URL("http://localhost")
      },
      {
        gateway: {
          id: "produce-gateway-id",
          type: GatewayTypeEnum.produce,
          topic: "a-topic"
        },
        webSocketUrl: new URL("http://localhost")
      },
      {
        gateway: {
          id: "produce-gateway-id2",
          type: GatewayTypeEnum.produce,
          topic: "a-topic2"
        },
        webSocketUrl: new URL("http://localhost")
      }
    ];

    const document = new GatewayMessageDocumentContent("controlPlaneName",
                                                       "tenantName",
                                                       "applicationId",
                                                        agentConfigurations,
                                                        gatewayWebSocketUrls);

    expect(document.producerGateways).to.be.lengthOf(2);
    expect(document.consumerGateways).to.be.lengthOf(1);
    expect(document.producerGatewayWebSockets).to.be.lengthOf(2);
    expect(document.consumerGatewayWebSockets).to.be.lengthOf(1);
  });
});
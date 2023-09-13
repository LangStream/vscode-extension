'use strict';
const gatewayBootstrapper = require("../../gateway/bootstrapper");
const gatewayMessenger = require("../../gateway/messenger");
const sinon = require("sinon");
const expect = require("chai").expect;

describe("GatewayBootstrapper tests", () => {
  const mockMessageManager = sinon.mock({
    showError: (err) => { console.error(err); },
    showInfo: (msg) => { console.log(msg); },
  });
  const messenger = new gatewayMessenger(mockMessageManager);

  it("should create an instance of bootstrapper", () => {
    const bootstrapper = new gatewayBootstrapper(messenger);
    expect(bootstrapper).to.be.an.instanceOf(gatewayBootstrapper);
  });

  it("should find params and authentication", () => {
    const consumerGateways = [
      {
        id: "consume-auth-google",
        type: "consume",
        topic: "output-topic",
        parameters: ["param3", "param1"],
        authentication: {
          provider: "google",
          configuration: {
            clientId: "123asd"
          },
        }
      }
    ];

    const producerGateways = [
      {
        id: "produce-auth-google",
        type: "produce",
        topic: "input-topic",
        parameters: ["param1", "param2"],
        authentication: {
          provider: "google",
          configuration: {
            clientId: "123asd"
          },
        }
      }
    ];

    const bootstrapper = new gatewayBootstrapper(messenger)
      .setConsumers(consumerGateways)
      .setProducers(producerGateways)
      .build();

    expect(bootstrapper.discoveredParameters["param1"]).to.contain("produce-auth-google");
    expect(bootstrapper.discoveredParameters["param1"]).to.contain("consume-auth-google");

    expect(bootstrapper.discoveredParameters["param2"]).to.contain("produce-auth-google");
    expect(bootstrapper.discoveredParameters["param3"]).to.contain("consume-auth-google");

    expect(bootstrapper.discoveredAuthentications[0][1]).to.equal(producerGateways[0].authentication);
    expect(bootstrapper.discoveredAuthentications[0][0]).to.contain("produce-auth-google");
    expect(bootstrapper.discoveredAuthentications[0][0]).to.contain("consume-auth-google");
  });

  it("should have existing values", () => {
    const consumerGateways = [
      {
        id: "consume-auth-google",
        type: "consume",
        topic: "output-topic",
        parameters: ["param3", "param1"],
        parameterValues: {
          param1: "value1",
          param3: "value3"
        },
        authentication: {
          provider: "google",
          configuration: {
            clientId: "123asd"
          },
        },
        authorizationToken: "123"
      }
    ];

    const producerGateways = [
      {
        id: "produce-auth-google",
        type: "produce",
        topic: "input-topic",
        parameters: ["param1", "param2"],
        parameterValues: {
          param1: "value1",
          param2: "value2"
        },
        authentication: {
          provider: "google",
          configuration: {
            clientId: "123asd"
          },
        },
        authorizationToken: "123"
      }
    ];

    const bootstrapper = new gatewayBootstrapper(messenger)
      .setConsumers(consumerGateways)
      .setProducers(producerGateways)
      .build();

    expect(bootstrapper.hasValues()).to.be.true;
  });
});
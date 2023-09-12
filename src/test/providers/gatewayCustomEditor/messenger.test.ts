import {expect} from "chai";
import GatewayMessenger from "../../../providers/gatewayCustomEditor/messenger";
import {GatewayTypeEnum} from "../../../services/controlPlaneApi/gen";
import {ToWebviewMessageCommandEnum, TToWebviewMessage} from "../../../types/tToWebviewMessage";
import * as ws from 'ws';
import * as wss from "../../fixtures/websocketServer";
import {sleep} from "../../../utils/sleep";
import {Record} from "../../../providers/gatewayCustomEditor/record";
import {ProduceResponse} from "../../../providers/gatewayCustomEditor/produceResponse";
import {ConsumePushMessage} from "../../../providers/gatewayCustomEditor/consumePushMessage";

describe("Gateway messenger tests", () => {
  const webSocketServiceAddress = new URL("ws://localhost:8080");
  let server: wss.WebSocketFixture = new wss.WebSocketFixture();

  before(() => { server.startServer(8080); });

  after(() => { server?.stopServer(); });

  it("should create a new messenger", async () => {
    const messenger = new GatewayMessenger(GatewayTypeEnum.produce, "gatewayId", (message) => {  });
    expect(messenger).to.not.be.undefined;
  });

  it("should open and close the socket", async () => {
    const postedMessages: TToWebviewMessage[] = [];
    const messenger = new GatewayMessenger(GatewayTypeEnum.consume, "gatewayId", (msg) => { postedMessages.push(msg); });
    webSocketServiceAddress.searchParams.set("gatewayId", "gatewayId");
    await messenger.connect(webSocketServiceAddress, 5000);
    expect(messenger).to.not.be.undefined;
    expect(messenger.connectionState).to.equal(ws.OPEN);

    messenger.close();
    await sleep(200);

    expect(messenger.connectionState).to.equal(ws.CLOSED);
    expect(postedMessages.findIndex((msg) => { return msg.text === "opened"; })).to.be.greaterThan(-1);
    expect(postedMessages.findIndex((msg) => { return msg.text === "closed"; })).to.be.greaterThan(-1);
  });

  it("should send a producer message and get a ProduceResponse back", async () => {
    const postedMessages: TToWebviewMessage[] = [];

    const messenger = new GatewayMessenger(GatewayTypeEnum.produce, "gatewayId", (msg) => { postedMessages.push(msg); });
    webSocketServiceAddress.searchParams.set("gatewayId", "gatewayId");
    await messenger.connect(webSocketServiceAddress, 5000);

    const record: Record = new Record({a:"b"}, GatewayTypeEnum.produce, "some-value");
    messenger.sendMessageToGateway(record, 5000);

    messenger.close();
    await sleep(200);

    expect(postedMessages.findIndex((msg) => { return msg.text === "opened"; })).to.be.greaterThan(-1);
    expect(postedMessages.findIndex((msg) => { return msg.text === "closed"; })).to.be.greaterThan(-1);
    expect(postedMessages.findIndex((msg) => { return ProduceResponse.tryCast(msg.text!) !== undefined; })).to.be.greaterThan(-1);
  });

  it("should send a consumer message and get a Record back", async () => {
    const postedMessages: TToWebviewMessage[] = [];

    const messenger = new GatewayMessenger(GatewayTypeEnum.consume, "gatewayId", (msg) => { postedMessages.push(msg); });
    webSocketServiceAddress.searchParams.set("gatewayId", "gatewayId");
    await messenger.connect(webSocketServiceAddress, 5000);

    const record: Record = new Record({a:"b"}, GatewayTypeEnum.consume, "some-value");
    messenger.sendMessageToGateway(record, 5000);

    messenger.close();
    await sleep(200);

    expect(postedMessages.findIndex((msg) => { return msg.text === "opened"; })).to.be.greaterThan(-1);
    expect(postedMessages.findIndex((msg) => { return msg.text === "closed"; })).to.be.greaterThan(-1);
    expect(postedMessages.findIndex((msg) => { return ConsumePushMessage.tryCast(msg.text!) !== undefined; })).to.be.greaterThan(-1);
  });

  it("should post a message to webview", async () => {
    const postedMessages: TToWebviewMessage[] = [];

    const messenger = new GatewayMessenger(GatewayTypeEnum.produce, "gatewayId", (msg) => { postedMessages.push(msg); });

    webSocketServiceAddress.searchParams.set("gatewayId", "gatewayId");

    const message: TToWebviewMessage = {
      command: ToWebviewMessageCommandEnum.connection,
      text: "the text",
      gatewayId: "a-gateway-id",
      contentType: "plain/text"
    };

    await messenger.postMessageToWebview(message);
    expect(postedMessages.length).to.equal(1);
  });

  it("should format the querystring", async () => {
    const params = {
      "param1": "123",
      "param2": "456"
    };

    const options = {
      "opt1": "asd",
      "opt2": "8888"
    };

    const cred = "asdasd-asdasdas-das++**&^%$#@!@dasdasd-b452455y24-5g245gafdavSDvWQ45621345YWEBWE___";

    GatewayMessenger.addGatewaySearchParams(webSocketServiceAddress, params, options, cred);

    expect(webSocketServiceAddress.searchParams.get("param:param1")).to.equal(params.param1);
    expect(webSocketServiceAddress.searchParams.get("param:param2")).to.equal(params.param2);
    expect(webSocketServiceAddress.searchParams.get("option:opt1")).to.equal(options.opt1);
    expect(webSocketServiceAddress.searchParams.get("option:opt2")).to.equal(options.opt2);
    expect(webSocketServiceAddress.searchParams.get("credentials")).to.equal(encodeURI(cred));
  });
});
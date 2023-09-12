'use strict';
const messageManager = require("../../gateway/messageManager");
// eslint-disable-next-line @typescript-eslint/naming-convention
const ConsumePushMessage = require("../../gateway/consumePushMessage");
const expect = require("chai").expect;

describe("MessageManager tests", () => {

  before(() => {
    // const windowRef = global.window;
    // global.window = {document: {querySelector: () => null}};
    //global.window = windowRef;

    global.List = class {
      constructor() {
        this.items = [];
      }
      add(item) {
        this.items.push(item);
      }
      search() {}
      filter() {}
    };
  });

  it("should add a new message", () => {
    const record = {
      value: "test",
      headers: {},
      key: "test",
    };

    const consumePushMessage = new ConsumePushMessage(record, "123");

    const mm = new messageManager();
    mm.add(consumePushMessage);

    expect(mm.messages).to.have.lengthOf(1);
  });

  it("should return a formatted consumeMessage item", () => {
    const record = {
      value: "test",
      headers: {
        "x-foo": "bar",
      },
      key: "test",
    };

    const consumePushMessage = new ConsumePushMessage(record, "123");

    const message = {
      command: "consumeMessage",
      messageId: "123",
      gatewayId: "some-gateway",
      text: consumePushMessage,
      contentType: "application/json",
    };

    const mm = new messageManager();
    const html = mm.formatListItem(message);

    expect(html).to.contain(`<span class="text-muted">from:</span> ${message.gatewayId}`);
    expect(html).to.contain(`<span class="text-muted">headers:</span> <code>${JSON.stringify(record.headers, null, 2)}</code>`);
    expect(html).to.contain(`<code>test</code>`);
  });
});
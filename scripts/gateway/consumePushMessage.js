export default class ConsumePushMessage {
  record; //Record
  offset; //string

  constructor(record, offset) {
    this.record = record;
    this.offset = offset;
  }

  static tryCast(json) {
    try {
      const a = JSON.parse(json);

      if (a.record === undefined) {
        return undefined;
      }

      if (a.offset === undefined) {
        return undefined;
      }

      return new ConsumePushMessage(a.record, a.offset);
    } catch {
      return undefined;
    }
  }

  contentType() {
    if (this.record.value === undefined || this.record.value === null) {
      return undefined;
    }

    try {
      JSON.parse(this.record.value);
      return "application/json";
    } catch {
    }

    const htmlRegex = new RegExp(/(<(\/)?(html))/gi);

    if (htmlRegex.test(this.record.value)) {
      return "text/html";
    }

    return "text/plain";
  }
};
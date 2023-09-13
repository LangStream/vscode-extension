export default class ProduceResponse {
  status; //string
  reason; //string

  constructor(status, reason) {
    this.status = status;
    this.reason = reason;
  }

  static tryCast(json) {
    try {
      const a = JSON.parse(json);

      if (a.status === undefined) {
        return undefined;
      }

      if (a.reason === undefined) {
        return undefined;
      }

      return new ProduceResponse(a.status, a.reason);
    } catch {
      return undefined;
    }
  }
};
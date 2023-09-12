import {ResponseStatusEnum} from "./responseStatusEnum";

export class ProduceResponse {
  constructor(public readonly status: ResponseStatusEnum,
              public readonly reason: string) {
  }

  public static tryCast(json: string): ProduceResponse | undefined {
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
}
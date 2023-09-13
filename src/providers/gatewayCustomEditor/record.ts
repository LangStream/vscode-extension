export class Record {
  constructor(public readonly headers?: { [key: string]: string; },
              public readonly key?: string,
              public readonly value?: any) {
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
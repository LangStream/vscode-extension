import * as hash from "object-hash";

export default class AppLogMessage {
  public readonly hash: string;

  constructor(public readonly rawMessage: string,
              public readonly timestamp: string,
              public readonly level: string,
              public readonly worker: string,
              public readonly message: string) {
    this.hash = hash(rawMessage);
  }

  public static tryCast(logMessage: string): AppLogMessage | undefined {
    try {
      // Parse the log stream message
      const workerRegex = new RegExp(/(?<=\[)[^\]]+(?=\])/i);
      const timestampRegex = new RegExp(/(?!(\d\]\s+))\d\d:\d\d:\d\d.\d\d\d/i);
      const levelRegex = new RegExp(/(?!(\]\s+))(INFO|ERROR|WARN|DEBUG)(?=(\s+))/i);
      const messageRegex = new RegExp(/(?<=(INFO|ERROR|WARN|DEBUG)(\s+)).*/i);
      const alternateMessageRegex = new RegExp(/(?<=-\d\](\s+)).*/i);

      const timestamps = logMessage.match(timestampRegex) ?? [""];
      const levels = logMessage.match(levelRegex) ?? ["INFO"]; // Default to INFO if no level is found
      const workers = logMessage.match(workerRegex) ?? [""];
      let messages = logMessage.match(messageRegex) ?? (logMessage.match(alternateMessageRegex) ?? [""]);

      return new AppLogMessage(logMessage, timestamps[0], levels[0], workers[0], messages[0]);
    } catch {
      return undefined;
    }
  }
}
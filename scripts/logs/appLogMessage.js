export default class AppLogMessage {
  timestamp;
  message;
  level;
  worker;
  rawMessage;

  constructor(rawMessage, timestamp,  level, worker, message) {
    this.level = level;
    this.worker = worker;
    this.rawMessage = rawMessage;
    this.timestamp = timestamp;
    this.message = message;
  }

  static tryCast(logMessage) {
    try {
      const a = JSON.parse(logMessage);
      return new AppLogMessage(a.rawMessage, a.timestamp, a.level, a.worker, a.message);
    } catch {
      return undefined;
    }
  }
}
export default class KafkaSecret {
  constructor(bootStrapServers = "", username = "", password = "") {
    this.data["bootstrap-servers"] = bootStrapServers;
    this.data["username"] = username;
    this.data["password"] = password;
  }

  name= "kafka";
  id= "kafka";
  data = {
    "bootstrap-servers": "",
    "username": "",
    "password": ""
  };
}
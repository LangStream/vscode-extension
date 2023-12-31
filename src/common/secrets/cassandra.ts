import {ISecret} from "../../interfaces/iSecret";

export default class CassandraSecret implements ISecret {
  constructor(secureConnectBundle = "", username = "", password = "") {
    this.data["secure-connect-bundle"] = secureConnectBundle;
    this.data["username"] = username;
    this.data["password"] = password;
  }

  name= "cassandra";
  id= "cassandra";
  data = {
    "secure-connect-bundle": "",
    "username": "",
    "password": ""
  };
}
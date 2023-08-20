import {ISecret} from "../../interfaces/iSecret";

export default class S3Secret implements ISecret {
  name= "aws-s3";
  id= "aws-s3";
  data = {
    "bucket-name": "",
    endpoint: "",
    "access-key": "",
    secret: "",
    region: ""
  };
}
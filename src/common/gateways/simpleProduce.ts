import {IGateway} from "../../interfaces/iGateway";
import {GatewayTypeEnum} from "../../services/controlPlaneApi/gen/models";

export default class SimpleProduceGateway implements IGateway {
  constructor() {
  }

  id = "produce-gateway";
  type = GatewayTypeEnum.produce;
  topic = "input-topic";
}
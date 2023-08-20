import {GatewayTypeEnum} from "../../services/controlPlaneApi/gen/models";
import {IGateway} from "../../interfaces/iGateway";

export default class SimpleConsumeGateway implements IGateway {
  constructor() {
  }

  id = "consume-gateway";
  type = GatewayTypeEnum.consume;
  topic = "output-topic";
}
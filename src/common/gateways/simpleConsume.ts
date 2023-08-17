import {Gateway, GatewayTypeEnum} from "../../services/controlPlaneApi/gen/models/gateway";
export default class SimpleConsumeGateway implements Gateway {
  constructor(private readonly topicName: string = "output-topic") {
  }

  id = "consume-gateway";
  type = GatewayTypeEnum.consume;
  topic = this.topicName;
}
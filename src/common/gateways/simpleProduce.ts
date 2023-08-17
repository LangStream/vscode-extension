import {Gateway, GatewayTypeEnum} from "../../services/controlPlaneApi/gen/models/gateway";
export default class SimpleProduceGateway implements Gateway {
  constructor(private readonly topicName: string = "input-topic") {
  }

  id = "produce-gateway";
  type = GatewayTypeEnum.produce;
  topic = this.topicName;
}
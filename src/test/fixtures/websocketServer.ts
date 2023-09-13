import {WebSocketServer} from 'ws';
import {ProduceResponse} from "../../providers/gatewayCustomEditor/produceResponse";
import {ResponseStatusEnum} from "../../providers/gatewayCustomEditor/responseStatusEnum";
import {Record} from "../../providers/gatewayCustomEditor/record";
import {GatewayTypeEnum} from "../../services/controlPlaneApi/gen";
import {ConsumePushMessage} from "../../providers/gatewayCustomEditor/consumePushMessage";

export class WebSocketFixture {
  private server: WebSocketServer | undefined = undefined;

  public startServer(port: number){
    this.server = new WebSocketServer({ port: port });

    this.server.on('connection', (ws) => {
      console.log("connection");

      ws.on('message', (event) => {
        console.log('received: %s', event);

        const record = JSON.parse(event.toString()) as Record;

        switch(record.key){
          case GatewayTypeEnum.produce:
            const produceResponse: ProduceResponse = new ProduceResponse(ResponseStatusEnum.OK, "some reason");
            ws.send(JSON.stringify(produceResponse));
            break;
          case GatewayTypeEnum.consume:
            const consumePushMessage: ConsumePushMessage = new ConsumePushMessage(record, "some offset");
            ws.send(JSON.stringify(consumePushMessage));
            break;
        }
      });

      ws.on('error', (err) => {
        console.error(err);
      });
    });

    this.server.on('close', () => {
      console.log("close");
    });
  }

  public stopServer(){
    this.server?.close();
  }
}
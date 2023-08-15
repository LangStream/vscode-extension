import {Configuration} from "../../services/controlPlaneApi/gen";

export default class KafkaKubernetesInstance extends Configuration {
  streamingCluster = {
    type: "kafka",
    configuration: {
      admin: {
        "bootstrap.servers": "{{ secrets.kafka.bootstrap-servers }}",
        "security.protocol": "SASL_SSL",
        "sasl.jaas.config": "org.apache.kafka.common.security.plain.PlainLoginModule required username='{{ secrets.kafka.username }}' password='token:{{ secrets.kafka.password }}';",
        "sasl.mechanism": "PLAIN",
        "session.timeout.ms": "45000"
      }
    }
  };

  computeCluster = {
    type: "kubernetes",
  }
}
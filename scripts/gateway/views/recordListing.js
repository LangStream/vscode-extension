export default class RecordListingView {
  static initialize() {
    // Parse agents
    agents.forEach((agent) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item");
      listItem.classList.add("border-0");
      listItem.classList.add("p-0");
      listItem.innerHTML = `<table class="table"><tbody>
                            <tr><td class="text-muted">id</td><td>${agent.id}</td></tr>
                            <tr><td class="text-muted">name</td><td>${agent.name || "-"}</td></tr>
                            <tr><td class="text-muted">type</td><td>${agent.type}</td></tr>
                            <tr><td class="text-muted">input</td><td>${agent.input?.definition || "-"}</td></tr>
                            <tr><td class="text-muted">output</td><td>${agent.output?.definition || "-"}</td></tr>
                          </tbody></table>`;
      document.getElementById("agents-list").appendChild(listItem);
    });

    // Parse consume gateways
    consumerGateways.forEach((gateway) => {
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item");
      listItem.classList.add("border-0");
      listItem.classList.add("p-0");
      listItem.innerHTML = `<table class="table"><tbody>
                            <tr><td class="text-muted">id</td><td>${gateway.id}</td></tr>
                            <tr><td class="text-muted">type</td><td>${gateway.type}</td></tr>
                            <tr><td class="text-muted">topic</td><td>${gateway.topic}</td></tr>
                            <tr><td class="text-muted">connection</td><td><span id="${gateway.id}"></span></td></tr>
                          </tbody></table>`;
      document.getElementById("gateways-list").appendChild(listItem);
    });

    // Set produce gateways
    if (producerGateways.length > 0) {
      producerGateways.forEach((gateway) => {
        const option = document.createElement("option");
        option.value = gateway.id;
        option.text = gateway.id;
        document.getElementById("producer-gateway-id").add(option);
      });

      document.getElementById("consume-only-form").classList.add("d-none");
      document.getElementById("producer-message-form").classList.remove("d-none");
    }
  }
}

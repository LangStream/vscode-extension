const vscode = acquireVsCodeApi();
const bodyTheme = document.querySelector('body')?.getAttribute('data-vscode-theme-kind');
if (bodyTheme) {
  if(bodyTheme === 'vscode-light') {
    document.querySelector('html')?.setAttribute('data-bs-theme', 'light');
  }else{
    document.querySelector('html')?.setAttribute('data-bs-theme', 'dark');
  }
}

let messageManager;

function sendUserMessage(gatewayId, text){
  sendMsg("userMessage", text, gatewayId, true);
  document.getElementById('message-text').value = "";
}

function sendMsg(command, text, gatewayId, addToMessagesList = false) {
  if(addToMessagesList === true){
    messageManager.add({ command: command, text: {record: { headers: null, key: null, value: text}}, gatewayId: gatewayId });
  }

  vscode.postMessage({ command: command, text: text, gatewayId: gatewayId });
}

function enableButton(){
  document.getElementById("send-button").disabled =
    !(document.getElementById("message-text").value?.length > 0 && document.getElementById("producer-gateway-id").value?.length > 0);
}

window.addEventListener('message', event => {
  // console.log("message");
  // console.log(event);

  const messageData = event.data; // The JSON data from the extension

  switch(messageData.command){
    case 'error':
      messageManager.showError(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
      break;
    case "connection" :
      document.getElementById(messageData.gatewayId).innerText = messageData.text;
      document.getElementById(messageData.gatewayId).classList.remove("text-success", "text-warning", "text-error");
      switch(messageData.text){
        case "connected":
        case "opened":
          document.getElementById(messageData.gatewayId).classList.add("text-success");
          break;
        case "connecting":
          document.getElementById(messageData.gatewayId).classList.add("text-warning");
          break;
        default:
          document.getElementById(messageData.gatewayId).classList.add("text-error");
          break;
      }
      break;
    case "produceResponse" :
      messageManager.add(messageData);
      break;
    case "consumeMessage" :
      messageManager.add(messageData);
      break;
    default: // info
      messageManager.showInfo(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
      break;
  }
});

window.addEventListener('load', event => {
  messageManager = new MessageManager();

  // Parse agents
  agents.forEach((agent) => {
    let listItem = document.createElement("li");
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

  // Parse gateways
  gateways.forEach((gateway) => {
    let listItem = document.createElement("li");
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
  let producerGateways = gateways.filter((gateway) => { if(gateway.type === "produce") { return gateway; } });
  if(producerGateways.length > 0){
    producerGateways.forEach((gateway) => {
      let option = document.createElement("option");
      option.value = gateway.id;
      option.text =  gateway.id;
      document.getElementById("producer-gateway-id").add(option);
    });

    document.getElementById("consume-only-form").classList.add("d-none");
    document.getElementById("producer-message-form").classList.remove("d-none");
  }


  sendMsg("ready", null, null);
});
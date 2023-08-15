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

function sendMsg(command, text, addToMessagesList = false) {
  console.log('here5');
  const message = { command: command, text: text};
  if(addToMessagesList === true){
    messageManager.add(message);
  }

  vscode.postMessage(message);
}

function reconnectSocket(){
  messageManager.add({text:'\x1b[31m======================== RECONNECT ========================\x1b[0m'});
  //messageManager.clear();
  sendMsg('ready', null);
}

function closeSocket(){
  messageManager.add({text:'\x1b[31m======================== CONNECTION CLOSED ========================\x1b[0m'});
  sendMsg('connection', 'close');
}

window.addEventListener('message', event => {
  //console.log(event);
  const messageData = event.data; // The JSON data from the extension

  switch(messageData.command){
    case 'error':
      messageManager.showError(`${messageData.text}`);
      break;
    case "connection" :
      document.getElementById("retry-messages").classList.remove("d-none");
      document.getElementById("watching-messages").classList.remove("d-none");
      switch(messageData.text){
        case "opened":
          document.getElementById("retry-messages").classList.add("d-none");
          break;
        case "closed":
          document.getElementById("watching-messages").classList.add("d-none");
          break;
      }
      break;
    case "appLog" :
      messageManager.add(messageData);
      break;
    default: // info
      messageManager.showInfo(`[${messageData.gatewayId ?? ""}]${messageData.text}`);
      break;
  }
});

window.addEventListener('load', event => {
  messageManager = new MessageManager();
  sendMsg("ready", null );
});
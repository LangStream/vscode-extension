export default class LogListingView {
  messenger;

  constructor(messenger) {
    this.messenger = messenger;
  }

  initialize() {
    document.getElementById("retry-messages-link").addEventListener('click', () => {
      this.reconnectSocket(true);
    });

    document.getElementById("close-socket-link").addEventListener('click', () => {
      this.closeSocket();
    });

    this.messenger.sendMessage('ready');
  }

  reconnectSocket(sendReady = true){
    this.messenger.start();

    if(sendReady){
      this.messenger.sendMessage('ready');
    }
  }

  closeSocket(){
    this.messenger.sendMessage('connection', 'close');
    this.messenger.stop();

    document.getElementById("watching-messages").classList.add("d-none");
    document.getElementById("retry-messages").classList.remove("d-none");
  }
}
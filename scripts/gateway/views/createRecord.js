export default class CreateRecordView {
  initialize(createRecordModalElement, messenger) {
    document.getElementById("modal-send-button").addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!document.getElementById("create-record-form").checkValidity()) {
        document.getElementById("create-record-form").classList.add('was-validated');
        return;
      }

      document.getElementById("modal-send-button").disabled = true;
      messenger.sendModalMessage(
        document.getElementById("modal-producer-gateway-id").value,
        document.getElementById('modal-message-key').value,
        this.gatherHeaders(),
        document.getElementById('modal-message-text').value
      );

      bootstrap.Modal.getOrCreateInstance(createRecordModalElement).hide();
    }, false);

    createRecordModalElement.addEventListener('hidden.bs.modal', () => {
      this.resetForm(null);
    });

    createRecordModalElement.addEventListener('show.bs.modal', (e) => {
      const gatewayId = e.relatedTarget;
      this.resetForm(gatewayId);
    });

    document.getElementById("add-header-button").addEventListener('click', () => {
      this.addHeader();
    });
  }
  resetForm(gatewayId){
    this.clearMessageAndKey();
    this.clearHeaders();
    this.enableSendButton();

    if(gatewayId !== null){
      document.getElementById("modal-producer-gateway-id").value = gatewayId;
    }
  }
  addHeader(label, value){
    const table = document.getElementById("headers-table");
    const row = table.insertRow(-1);

    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    const cell4 = row.insertCell(3);

    cell1.scope = "row";
    cell1.innerHTML = `${row.rowIndex}`;
    cell2.innerHTML = `<input type="text" class="form-control" required value="${label ?? ""}" /><div class="invalid-feedback">Required</div>`;
    cell3.innerHTML = `<input type="text" class="form-control" required value="${value ?? ""}" /><div class="invalid-feedback">Required</div>`;
    cell4.innerHTML = `<a id="header-row-${row.rowIndex}" class="btn btn-sm btn-danger rounded" href="#">-</a>`;

    document.getElementById(`header-row-${row.rowIndex}`).addEventListener('click', () => {
      this.removeHeader(row.rowIndex);
    });
  }
  removeHeader(rowIndex){
    const table = document.getElementById("headers-table");
    table.deleteRow(rowIndex);
  }
  clearHeaders(){
    const table = document.getElementById("headers-table");

    for(let i = table.rows.length - 1; i > 0; i--){
      table.deleteRow(i);
    }
  }
  gatherHeaders(){
    const headers = {};
    const table = document.getElementById("headers-table");

    for(let i = 1; i < table.rows.length; i++){
      const label = table.rows[i].cells[1].getElementsByTagName("input")[0].value;
      const val = table.rows[i].cells[2].getElementsByTagName("input")[0].value;

      if(label === undefined || label === null || label.length < 1){
        continue;
      }

      if(val === undefined || val === null || val.length < 1){
        continue;
      }

      headers[label] = val;
    }

    return headers;
  }
  clearMessageAndKey(){
    document.getElementById("modal-message-text").value = "";
    document.getElementById('modal-message-key').value = "";
  }
  enableSendButton(){
    // if(sendMessageInterval !== null) {
    //   clearInterval(sendMessageInterval);
    // }

    document.getElementById("modal-send-button").disabled = false;
    document.getElementById("modal-send-button").innerText = `Send`;
  }
}
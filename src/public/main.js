var qrCodeContainer = document.getElementById('canvas')
const socket = io()

socket.on("getqr", (qrCodeData) => {
  // console.log(qrCodeData);
  // Eliminar el código QR anterior
  qrCodeContainer.innerHTML = "";
  // Crear un nuevo código QR
  var qrcode = new QRCode(qrCodeContainer, {
    text: qrCodeData,
    width: 512,
    height: 512,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });
});

socket.on('ready', (data) => {
  qrCodeContainer.innerHTML = "Connectado";
})
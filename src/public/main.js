var qrCodeContainer = document.getElementById('canvas')
const socket = io()

console.log('connected')

socket.on("getqr", (qrCodeData) => {
  // console.log(qrCodeData);
  // Eliminar el código QR anterior
  qrCodeContainer.innerHTML = "";
  // Crear un nuevo código QR
  var qrcode = new QRCode(qrCodeContainer, {
    text: qrCodeData,
    width: 264,
    height: 264,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });
});

socket.on('ready', (data) => {
  qrCodeContainer.innerHTML = "Connectado";
})
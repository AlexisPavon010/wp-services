const { Client, LocalAuth, } = require('whatsapp-web.js');
const { Message, ClientInfo, Buttons } = require('whatsapp-web.js/src/structures');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Crear una instancia del servidor de Express
const app = express();

// app.use("/", (req, res) => {
//   res.json({ message: "Hello From Express App" });
// });

app.use(express.static(path.join(__dirname, 'public')));

// Crear un servidor HTTP utilizando la instancia de Express
const server = http.createServer(app);

// Crear una instancia de Socket.io utilizando el servidor HTTP
const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('connected')

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true },
    args: ['--no-sandbox']
  })

  client.initialize()

  client.on('ready', () => {
    console.log('Ready')
    io.emit('ready', { ok: true })
  })

  client.on('message', async message => {
    console.log(message.body)
    if (message.body === 'Hola') {

      // let button = new Buttons('Button body', [{ body: 'Aceptar' }, { body: 'rechazar' }], 'title', 'footer');
      let button = new Buttons('¡Hola! Gracias por realizar tu pedido con nosotros. Nos complace confirmar que hemos recibido tu pedido con el número de orden #12345 y estamos trabajando diligentemente para prepararlo y enviarlo lo antes posible. Si tienes alguna pregunta o inquietud sobre tu pedido, no dudes en ponerte en contacto con nosotros con el número de orden correspondiente. ¡Gracias por elegirnos!', [{ body: 'Aceptar', id: 'accept-button' }, { body: 'rechazar', id: 'reject-button' }]);

      client.sendMessage(message.from, button);
    }
  });


  client.on('message_create', async (message) => {
    if (message.type === 'buttons_response') {
      if (message.selectedButtonId === 'accept-button') {
        client.sendMessage(message.from, 'Bienvenido a la Deep Web!');
      } else if (message.selectedButtonId === 'reject-button') {
        client.sendMessage(message.from, 'Lo siento, no podemos permitirte entrar.');
      }
    }
  });


  client.on('disconnected', () => {
    console.log('disconnected')
    client.initialize()
  })

  client.on('auth_failure', () => {
    console.log('auth_failure')
  })

  client.on('qr', (qr) => {
    // qrcode.generate(qr, { small: true })
    io.emit('getqr', qr)
  })

})

server.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});


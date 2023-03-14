const { Client, LocalAuth, ReplyButton } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal')

const socket = (io) => {

  io.on('connection', (socket) => {
    console.log('connected')

    const client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: { headless: true }
    })

    client.initialize()

    client.on('ready', () => {
      console.log('Ready')
      io.emit('ready', { ok: true })
    })

    client.on('message', async message => {
      console.log(message.body)
      if (message.body === 'Hola') {
        const button = new ReplyButton('web_url', 'Visita nuestro sitio web', 'https://www.ejemplo.com');
        const messageToSend = `¡Hola ${message.from}! ¿Quieres visitar nuestro sitio web?`;

        await message.reply(messageToSend, null, {
          buttons: [button],
        });
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
}

module.exports = {
  socket
}
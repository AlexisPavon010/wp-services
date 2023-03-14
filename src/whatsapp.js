const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
})

client.initialize()

client.on('ready', () => {
    console.log('Ready')
})

client.on('message', message => {
    console.log(message.body)
    if (message.body === '!ping') {
        client.sendMessage(message.from, 'pong');
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
    qrcode.generate(qr, { small: true })
})
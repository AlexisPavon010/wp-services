const {
    default: makeWASocket,
    MessageType,
    MessageOptions,
    Mimetype,
    DisconnectReason,
    BufferJSON,
    AnyMessageContent,
    delay,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    MessageRetryMap,
    useMultiFileAuthState,
    msgRetryCounterMap
} = require("@adiwajshing/baileys");

const { session } = { "session": "baileys_auth_info" };
const { Boom } = require("@hapi/boom");
const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require("body-parser");
const app = require("express")()
const rimraf = require('rimraf');
// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 8000;
const qrcode = require("qrcode");
const path = require("path");

app.use("/assets", express.static(__dirname + "/client/assets"));
// pp.use(express.static(path.join(__dirname, '/src/client')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + '/client/index.html'));
});

let client;
let qr;
let soket;

const removeSession = () => {
    rimraf('baileys_auth_info',
        {
            maxBusyTries: 10,
            disableGlob: false
        },
        (err) => {
            if (err) {
                console.error(`Error: ${err}`);
                return;
            }
            console.log('Carpeta eliminada');
        });
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    let { version, isLatest } = await fetchLatestBaileysVersion();
    client = makeWASocket({
        // printQRInTerminal: true,
        auth: state,
        // logger: log({ level: "silent" }),
        version,
        shouldIgnoreJid: jid => isJidBroadcast(jid),
    });
    // store.bind(client.ev);
    client.multi = true
    client.ev.on('connection.update', async (update) => {
        // console.log(update);
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            removeSession()
            connectToWhatsApp()
        } else if (connection === 'open') {
            console.log('opened connection');
            let getGroups = await client.groupFetchAllParticipating();
            let groups = Object.entries(getGroups).slice(0).map(entry => entry[1]);
            console.log(groups);
            return;
        } else {
            qr = update.qr
            updateQR("qr");
        }
    });
    client.ev.on("creds.update", saveCreds);
    client.ev.on("messages.upsert", async ({ messages, type }) => {
        console.log(type)
        if (type === "notify") {
            if (!messages[0].key.fromMe) {
                //tentukan jenis pesan berbentuk text                
                const conversation = messages[0].message.conversation;
                console.log(conversation)

                //nowa dari pengirim pesan sebagai id
                const noWa = messages[0].key.remoteJid;

                await client.readMessages([messages[0].key]);

                //kecilkan semua pesan yang masuk lowercase 
                const conversationToLowerCase = conversation.toLowerCase();

                if (conversationToLowerCase === "ping") {
                    await client.sendMessage(noWa, { text: "Pong" });
                } else {
                    await client.sendMessage(noWa, { text: "Saya adalah Bot!" });
                }
            }
        }
    });
}

io.on("connection", async (socket) => {
    soket = socket;
    console.log(isConnected())
    if (isConnected()) {
        updateQR("connected");
    } else if (qr) {
        updateQR("qr");
    }
});

// functions
const isConnected = () => {
    return (client?.user);
};

const updateQR = (data) => {
    switch (data) {
        case "qr":
            qrcode.toDataURL(qr, (err, url) => {
                soket?.emit("qr", url);
                soket?.emit("log", "QR Code received, please scan!");
            });
            break;
        case "connected":
            soket?.emit("qrstatus", "./assets/check.svg");
            soket?.emit("log", "WhatsApp terhubung!");
            break;
        case "qrscanned":
            soket?.emit("qrstatus", "./assets/check.svg");
            soket?.emit("log", "QR Code Telah discan!");
            break;
        case "loading":
            soket?.emit("qrstatus", "./assets/loader.gif");
            soket?.emit("log", "Registering QR Code , please wait!");
            break;
        default:
            break;
    }
};

// send text message to wa user
app.post("/send-message", async (req, res) => {
    console.log(req.body);
    const { phoneNumber, uniqueID = '000000' } = req.body;


    let numberWA;
    try {
        if (!phoneNumber) {
            res.status(500).json({
                status: false,
                response: 'No hay numero!'
            });
        }
        else {
            // numberWA = '62' + number.substring(1) + "@s.whatsapp.net"; 
            numberWA = phoneNumber + "@s.whatsapp.net";

            console.log(await client.onWhatsApp(numberWA));
            client.sendMessage(numberWA, { text: `¡Hola! Gracias por realizar tu pedido con nosotros. Nos complace confirmar que hemos recibido tu pedido con el número de orden #${uniqueID} y estamos trabajando diligentemente para prepararlo y enviarlo lo antes posible. Si tienes alguna pregunta o inquietud sobre tu pedido, no dudes en ponerte en contacto con nosotros con el número de orden correspondiente. ¡Gracias por elegirnos!` })
                .then((result) => {
                    res.status(200).json({
                        status: true,
                        response: result,
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                });

        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err);
    }

});

connectToWhatsApp()
    .catch(err => console.log("unexpected error: " + err)) // catch any errors
server.listen(port, () => {
    console.log("Server Berjalan pada Port : " + port);
});

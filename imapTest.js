const imaps = require("imap-simple");
require("dotenv").config();

const config = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: Number(process.env.IMAP_PORT),
        tls: true,
        authTimeout: 5000,
        tlsOptions: { rejectUnauthorized: false },
    },
};

imaps.connect(config)
    .then(connection => {
        console.log("✅ Успешное подключение к IMAP Google");
        return connection.end();
    })
    .catch(err => {
        console.error("❌ Ошибка подключения:", err);
    });

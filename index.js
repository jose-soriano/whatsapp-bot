// DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// CONFIGURACIÓN - ¡REEMPLAZA CON TU API KEY REAL!
const DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

console.log('🚀 INICIANDO WHATSAPP BOT CON DEEPSEEK...');
console.log('⏳ Inicializando, por favor espera...');

// Variables globales
let qrCodeData = null;
let isConnected = false;

// Configuración simple
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

// ==================== EVENTOS WHATSAPP ====================

client.on('qr', (qr) => {
    console.log('\n🎯 ¡QR CODE GENERADO!');
    console.log('='.repeat(50));
    
    qrCodeData = qr;
    
    // QR en terminal
    qrcode.generate(qr, { small: false }, function (qrcode) {
        console.log(qrcode);
    });
    
    // URL alternativa
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    
    console.log('\n📱 INSTRUCCIONES:');
    console.log('1. Abre WhatsApp en tu teléfono');
    console.log('2. Ve a: Ajustes → Dispositivos vinculados → Vincular un dispositivo');
    console.log('3. Escanea el código QR de arriba');
    console.log('');
    console.log('🔄 ALTERNATIVA:');
    console.log(`Abre esta URL en tu teléfono: ${qrUrl}`);
    console.log('='.repeat(50));
});

client.on('ready', () => {
    console.log('\n🎉 ¡CONECTADO! Bot listo para responder mensajes');
    isConnected = true;
    qrCodeData = null;
});

client.on('auth_failure', () => {
    console.log('❌ Error de autenticación. Reiniciando...');
    setTimeout(() => client.initialize(), 10000);
});

client.on('disconnected', () => {
    console.log('❌ Desconectado. Reconectando...');
    isConnected = false;
    client.initialize();
});

// ==================== DEEPSEEK AI ====================

async function chatWithDeepSeek(mensaje) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente útil en WhatsApp. Responde de manera natural y concisa.'
                },
                {
                    role: 'user',
                    content: mensaje
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error DeepSeek:', error.message);
        return '🤖 Error temporal. Intenta nuevamente.';
    }
}

// ==================== MENSAJES ====================

client.on('message', async (message) => {
    if (message.fromMe || message.isStatus) return;
    
    const texto = message.body.trim();
    if (!texto || texto.length < 1) return;
    
    console.log(`\n📩 Mensaje de ${message.from}: ${texto}`);
    
    try {
        await message.chat.sendStateTyping();
        const respuesta = await chatWithDeepSeek(texto);
        await message.reply(respuesta);
        console.log('✅ Respuesta enviada');
    } catch (error) {
        console.error('Error:', error);
        await message.reply('⚠️ Error al procesar.');
    }
});

// ==================== INICIALIZAR ====================

console.log('🔄 Iniciando WhatsApp...');
client.initialize();

// ==================== SERVIDOR WEB ====================

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Bot</title>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: Arial; 
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white; 
                padding: 20px; 
                text-align: center;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: rgba(255,255,255,0.1); 
                padding: 30px; 
                border-radius: 15px; 
            }
            .qr-section { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
                color: black;
            }
            .btn {
                background: #25D366;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 WhatsApp Bot</h1>
            <p>Estado: <strong>${isConnected ? '🟢 Conectado' : '🟡 Esperando QR'}</strong></p>
            
            ${!isConnected && qrCodeData ? `
            <div class="qr-section">
                <h3>📱 Escanear QR</h3>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}" 
                     alt="QR Code" style="border: 2px solid #333;">
                <br><br>
                <a href="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCodeData)}" 
                   target="_blank" class="btn">
                   🔗 Abrir QR Grande
                </a>
            </div>
            ` : isConnected ? `
            <div style="background: rgba(76, 175, 80, 0.3); padding: 20px; border-radius: 10px;">
                <h3>✅ ¡Conectado!</h3>
                <p>El bot está listo para responder mensajes.</p>
            </div>
            ` : `
            <div style="background: rgba(255, 152, 0, 0.3); padding: 20px; border-radius: 10px;">
                <h3>⏳ Generando QR...</h3>
                <p>Espera unos segundos y recarga la página.</p>
            </div>
            `}
        </div>
    </body>
    </html>`;
    
    res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web: http://0.0.0.0:${PORT}`);
});

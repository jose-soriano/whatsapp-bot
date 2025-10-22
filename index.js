// DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// CONFIGURACIÓN - REEMPLAZA CON TU API KEY DE DEEPSEEK
const DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

console.log('🚀 Iniciando WhatsApp Bot con DeepSeek...');

let qrCodeUrl = '';
let currentQR = '';

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "railway-bot",
        dataPath: "./.wwebjs_auth"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Mostrar QR de alta calidad
client.on('qr', (qr) => {
    console.log('\n📱 CÓDIGO QR GENERADO:');
    console.log('═'.repeat(50));
    
    // Generar QR en terminal (pero más grande)
    qrcode.generate(qr, { small: false }, function (qrcode) {
        console.log(qrcode);
    });
    
    // También mostrar como URL para escanear desde otro dispositivo
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    currentQR = qr;
    
    console.log('\n🔗 URL ALTERNATIVA PARA ESCANEAR:');
    console.log(qrCodeUrl);
    console.log('\n📝 INSTRUCCIONES:');
    console.log('1. Abre WhatsApp en tu teléfono');
    console.log('2. Ve a Ajustes → Dispositivos vinculados → Vincular un dispositivo');
    console.log('3. ESCANEA el código QR de arriba O');
    console.log('4. Abre este enlace en tu teléfono: ' + qrCodeUrl);
    console.log('═'.repeat(50));
});

client.on('ready', () => {
    console.log('\n🎉 ¡BOT CONECTADO EXITOSAMENTE!');
    console.log('🤖 Ahora puedo responder mensajes automáticamente');
    qrCodeUrl = ''; // Limpiar QR una vez conectado
});

// Función para hablar con DeepSeek
async function chatWithDeepSeek(mensaje) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente útil en WhatsApp. Responde de manera natural y concisa. Usa el mismo idioma del usuario.`
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
            timeout: 25000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error con DeepSeek:', error.message);
        return '🤖 Ocurrió un error. Por favor intenta de nuevo.';
    }
}

// Manejar mensajes
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
        await message.reply('⚠️ Error al procesar mensaje.');
    }
});

client.on('auth_failure', () => {
    console.log('❌ Error de autenticación. Reiniciando...');
});

client.on('disconnected', () => {
    console.log('❌ Desconectado. Reiniciando...');
});

// Inicializar bot
setTimeout(() => {
    console.log('🔄 Inicializando WhatsApp...');
    client.initialize();
}, 1000);

// Servidor web MEJORADO para mostrar QR
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 WhatsApp Bot QR</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
            }
            .container { 
                background: rgba(255,255,255,0.1); 
                padding: 30px; 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
            }
            .qr-container {
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 10px;
                display: inline-block;
            }
            .instructions {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
            }
            .btn {
                background: #25D366;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 WhatsApp Bot con DeepSeek</h1>
            
            ${qrCodeUrl ? `
            <div class="instructions">
                <h3>📱 Para conectar WhatsApp:</h3>
                <ol>
                    <li>Abre WhatsApp en tu teléfono</li>
                    <li>Ve a <strong>Ajustes → Dispositivos vinculados → Vincular un dispositivo</strong></li>
                    <li>Escanea el código QR de abajo</li>
                </ol>
            </div>
            
            <div class="qr-container">
                <h3>🔐 Código QR:</h3>
                <img src="${qrCodeUrl}" alt="QR Code" style="border: 2px solid #333;">
                <br><br>
                <a href="${qrCodeUrl}" target="_blank" class="btn">🔗 Abrir QR en nueva pestaña</a>
            </div>
            
            <p><strong>💡 Consejo:</strong> Si no puedes escanear, abre el enlace arriba en tu teléfono</p>
            ` : `
            <div style="background: rgba(76, 175, 80, 0.3); padding: 20px; border-radius: 10px;">
                <h3>✅ WhatsApp Conectado</h3>
                <p>El bot está funcionando correctamente.</p>
                <p>Envía un mensaje al número vinculado para probarlo.</p>
            </div>
            `}
            
            <div style="margin-top: 30px;">
                <p><strong>Revisa los logs en Railway para más detalles</strong></p>
            </div>
        </div>
    </body>
    </html>`;
    
    res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web en: http://0.0.0.0:${PORT}`);
});

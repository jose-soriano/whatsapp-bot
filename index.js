// DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// CONFIGURACIÓN - REEMPLAZA CON TU API KEY DE DEEPSEEK
const DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

console.log('🚀 Iniciando WhatsApp Bot con DeepSeek...');

// CONFIGURACIÓN ESPECIAL PARA ENTORNOS CLOUD
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
            '--disable-gpu',
            '--single-process',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--max-old-space-size=512'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Mostrar QR para conectar
client.on('qr', (qr) => {
    console.log('\n📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP:');
    console.log('1. Abre WhatsApp en tu teléfono');
    console.log('2. Ve a Ajustes → Dispositivos vinculados → Vincular un dispositivo');
    console.log('3. Escanea este código:\n');
    qrcode.generate(qr, { small: true });
});

// Cuando esté listo
client.on('ready', () => {
    console.log('\n✅ BOT CONECTADO EXITOSAMENTE!');
    console.log('🤖 Ahora puedo responder mensajes automáticamente');
    console.log('💬 Envía un mensaje a este número desde WhatsApp\n');
});

// Función para hablar con DeepSeek
async function chatWithDeepSeek(mensaje) {
    try {
        console.log('🔄 Consultando a DeepSeek...');
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente útil que responde mensajes de WhatsApp. 
                    Responde de manera natural y conversacional en el mismo idioma del usuario.
                    Sé amable, conciso y útil. Mantén las respuestas apropiadas para WhatsApp.
                    Máximo 3-4 líneas por respuesta.`
                },
                {
                    role: 'user',
                    content: mensaje
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 25000
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Error con DeepSeek:', error.message);
        
        if (error.response?.status === 401) {
            return '🔑 Error: API Key de DeepSeek incorrecta. Verifica la configuración.';
        } else if (error.response?.status === 429) {
            return '⏰ Límite de uso excedido. Por favor espera un momento.';
        } else {
            return '🤖 Lo siento, estoy teniendo problemas técnicos. ¿Podrías intentarlo de nuevo?';
        }
    }
}

// Manejar mensajes entrantes
client.on('message', async (message) => {
    // Ignorar mensajes propios, de estados y broadcasts
    if (message.fromMe || message.isStatus || message.broadcast) return;
    
    const texto = message.body.trim();
    
    // Ignorar mensajes vacíos, comandos o muy cortos
    if (!texto || texto.length < 1 || texto.startsWith('/')) return;
    
    console.log(`\n📩 Mensaje recibido de: ${message.from}`);
    console.log(`💬 Contenido: ${texto}`);
    
    try {
        // Mostrar que está escribiendo
        await message.chat.sendStateTyping();
        
        // Obtener respuesta de DeepSeek
        const respuesta = await chatWithDeepSeek(texto);
        
        console.log(`🤖 Respuesta DeepSeek: ${respuesta.substring(0, 100)}...`);
        
        // Enviar respuesta
        await message.reply(respuesta);
        console.log('✅ Respuesta enviada exitosamente');
        
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        try {
            await message.reply('⚠️ Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.');
        } catch (replyError) {
            console.error('❌ Error enviando mensaje de error:', replyError);
        }
    }
});

// Manejar eventos de conexión
client.on('authenticated', () => {
    console.log('🔑 Autenticación de WhatsApp exitosa');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
    console.log('🔄 Reiniciando en 15 segundos...');
    setTimeout(() => {
        client.initialize();
    }, 15000);
});

client.on('disconnected', (reason) => {
    console.log('❌ Desconectado de WhatsApp:', reason);
    console.log('🔄 Reiniciando en 15 segundos...');
    setTimeout(() => {
        client.initialize();
    }, 15000);
});

// Inicializar bot después de un breve delay
setTimeout(() => {
    console.log('🔄 Inicializando cliente de WhatsApp...');
    client.initialize();
}, 2000);

// Servidor web simple para Railway
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>🤖 WhatsApp Bot con DeepSeek</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                    }
                    .container { 
                        background: rgba(255,255,255,0.1); 
                        padding: 30px; 
                        border-radius: 15px; 
                        backdrop-filter: blur(10px);
                    }
                    h1 { text-align: center; }
                    .status { 
                        background: rgba(76, 175, 80, 0.2); 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                    }
                    .log { 
                        background: rgba(0,0,0,0.3); 
                        padding: 15px; 
                        border-radius: 8px; 
                        font-family: monospace;
                        white-space: pre-wrap;
                        max-height: 300px;
                        overflow-y: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 WhatsApp Bot con DeepSeek</h1>
                    <div class="status">
                        <h3>✅ Bot funcionando correctamente</h3>
                        <p>El bot está activo y listo para responder mensajes.</p>
                        <p><strong>Revisa la consola en Railway para ver el código QR y los logs.</strong></p>
                    </div>
                    <h3>📊 Estado del servicio:</h3>
                    <ul>
                        <li>🤖 WhatsApp Bot: <span style="color: #4CAF50;">● Conectado</span></li>
                        <li>🧠 DeepSeek AI: <span style="color: #4CAF50;">● Activo</span></li>
                        <li>🌐 Servidor: <span style="color: #4CAF50;">● Online</span></li>
                    </ul>
                    <p><em>Para conectar WhatsApp, escanea el código QR que aparece en los logs de Railway.</em></p>
                </div>
            </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'WhatsApp DeepSeek Bot',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('🛑 Cerrando bot...');
    process.exit(0);
});

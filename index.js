const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// CONFIGURACIÓN - REEMPLAZA CON TU API KEY DE DEEPSEEK
const DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

console.log('🚀 Iniciando WhatsApp Bot con DeepSeek...');

// Configurar WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
    console.log('\n✅ BOT CONECTADO!');
    console.log('🤖 Ahora puedo responder mensajes automáticamente');
    console.log('💬 Envía un mensaje a este número desde WhatsApp\n');
});

// Función para hablar con DeepSeek
async function chatWithDeepSeek(mensaje) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente útil que responde mensajes de WhatsApp. 
                    Responde de manera natural y conversacional. 
                    Sé amable y conciso. 
                    Responde en el mismo idioma del usuario.`
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
        console.error('Error con DeepSeek:', error.message);
        return '🤖 Lo siento, estoy teniendo problemas técnicos. ¿Podrías intentarlo de nuevo?';
    }
}

// Manejar mensajes entrantes
client.on('message', async (message) => {
    // Ignorar mensajes propios y de estados
    if (message.fromMe || message.isStatus) return;
    
    const texto = message.body.trim();
    
    // Ignorar mensajes vacíos o muy cortos
    if (!texto || texto.length < 1) return;
    
    console.log(`📩 Mensaje de ${message.from}: ${texto}`);
    
    try {
        // Mostrar que está escribiendo
        await message.chat.sendStateTyping();
        
        // Obtener respuesta de DeepSeek
        const respuesta = await chatWithDeepSeek(texto);
        
        console.log(`🤖 Respondiendo: ${respuesta.substring(0, 100)}...`);
        
        // Enviar respuesta
        await message.reply(respuesta);
        console.log('✅ Respuesta enviada\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await message.reply('⚠️ Ocurrió un error. Por favor intenta de nuevo.');
    }
});

// Manejar errores
client.on('auth_failure', () => {
    console.log('❌ Error de autenticación. Reinicia el bot.');
});

client.on('disconnected', () => {
    console.log('❌ Desconectado. Reiniciando...');
    client.initialize();
});

// Iniciar bot
client.initialize();

// Servidor web simple para Railway
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>WhatsApp Bot</title></head>
            <body>
                <h1>🤖 WhatsApp Bot con DeepSeek</h1>
                <p>El bot está funcionando correctamente.</p>
                <p>Revisa la consola para ver los logs.</p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor web en puerto ${PORT}`);
});
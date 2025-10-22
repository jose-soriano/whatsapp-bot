// DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// CONFIGURACIÓN - ¡REEMPLAZA CON TU API KEY REAL!
const DEEPSEEK_API_KEY = 'sk-bdedac6848054c5cbf85316a0705df57';

console.log('🚀 INICIANDO WHATSAPP BOT CON DEEPSEEK...');
console.log('⏳ Esto puede tomar hasta 30 segundos...');

// Variables globales para el QR
let qrCodeData = null;
let isConnected = false;

// CONFIGURACIÓN OPTIMIZADA
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-bot",
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
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// ==================== EVENTOS DE WHATSAPP ====================

// QR Code - MEJORADO
client.on('qr', (qr) => {
    console.log('\n🎯 ¡QR CODE LISTO PARA ESCANEAR!');
    console.log('═'.repeat(60));
    
    qrCodeData = qr;
    
    // Generar QR en terminal (más grande)
    qrcode.generate(qr, { small: false }, function (qrcode) {
        console.log(qrcode);
    });
    
    // Generar URL para QR externo
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    const directUrl = `https://your-app-name.up.railway.app`; // Cambia por tu URL real
    
    console.log('\n📋 INSTRUCCIONES DETALLADAS:');
    console.log('1. 📱 Abre WhatsApp en tu TELÉFONO');
    console.log('2. ⚙️  Ve a: Ajustes → Dispositivos vinculados → Vincular un dispositivo');
    console.log('3. 📷 Escanea el código QR de ARRIBA');
    console.log('');
    console.log('🔄 ALTERNATIVAS si el QR no se ve bien:');
    console.log(`🔗 OPCIÓN A: Abre esta URL en tu teléfono: ${qrUrl}`);
    console.log(`🔗 OPCIÓN B: Ve a: ${directUrl} (si configuraste dominio)`);
    console.log('═'.repeat(60));
});

// Cuando se conecta
client.on('ready', () => {
    console.log('\n🎉 ¡CONEXIÓN EXITOSA!');
    console.log('🤖 El bot está listo para responder mensajes');
    console.log('💬 Envía un mensaje de WhatsApp para probar');
    isConnected = true;
    qrCodeData = null;
});

// Errores de autenticación
client.on('auth_failure', (msg) => {
    console.log('❌ Error de autenticación:', msg);
    console.log('🔄 Reiniciando en 10 segundos...');
    setTimeout(() => {
        client.initialize();
    }, 10000);
});

// Desconexión
client.on('disconnected', (reason) => {
    console.log('❌ Desconectado:', reason);
    console.log('🔄 Reconectando...');
    isConnected = false;
    client.initialize();
});

// ==================== FUNCIÓN DEEPSEEK ====================

async function chatWithDeepSeek(mensaje) {
    try {
        console.log('🧠 Consultando a DeepSeek...');
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente útil en WhatsApp. Responde de manera natural, concisa y en el mismo idioma del usuario. Sé amable y directo.`
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
        console.error('❌ Error DeepSeek:', error.message);
        return '🤖 Ocurrió un error. Por favor intenta de nuevo.';
    }
}

// ==================== MANEJADOR DE MENSAJES ====================

client.on('message', async (message) => {
    // Ignorar mensajes propios y del sistema
    if (message.fromMe || message.isStatus || message.broadcast) return;
    
    const texto = message.body.trim();
    
    // Ignorar mensajes vacíos o muy cortos
    if (!texto || texto.length < 1) return;
    
    console.log(`\n📩 MENSAJE RECIBIDO de: ${message.from}`);
    console.log(`💬 Texto: "${texto}"`);
    
    try {
        // Indicar que está escribiendo
        await message.chat.sendStateTyping();
        
        // Obtener respuesta de DeepSeek
        const respuesta = await chatWithDeepSeek(texto);
        
        console.log(`🤖 Respuesta: ${respuesta.substring(0, 100)}...`);
        
        // Enviar respuesta
        await message.reply(respuesta);
        console.log('✅ Respuesta enviada correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
        try {
            await message.reply('⚠️ Error procesando tu mensaje. Intenta nuevamente.');
        } catch (e) {
            console.error('❌ No se pudo enviar mensaje de error');
        }
    }
});

// ==================== INICIALIZACIÓN ====================

console.log('🔄 Inicializando WhatsApp Web...');
setTimeout(() => {
    client.initialize();
}, 2000);

// ==================== SERVIDOR WEB ====================

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal con información del estado
app.get('/', (req, res) => {
    const status = isConnected ? 'Conectado' : 'Esperando QR';
    const statusColor = isConnected ? '#4CAF50' : '#FF9800';
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 WhatsApp Bot Status</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }
            .container { 
                max-width: 900px; 
                margin: 0 auto;
                background: rgba(255,255,255,0.1); 
                padding: 30px; 
                border-radius: 20px; 
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            .status-badge {
                background: ${statusColor};
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin: 10px 0;
                font-weight: bold;
            }
            .instructions {
                background: rgba(255,255,255,0.15);
                padding: 25px;
                border-radius: 15px;
                margin: 25px 0;
                border-left: 5px solid #25D366;
            }
            .qr-section {
                background: white;
                padding: 25px;
                border-radius: 15px;
                margin: 20px 0;
                text-align: center;
                color: #333;
            }
            .btn {
                background: #25D366;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
                font-weight: bold;
                transition: all 0.3s;
            }
            .btn:hover {
                background: #1da851;
                transform: translateY(-2px);
            }
            .step {
                margin: 15px 0;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 WhatsApp Bot con DeepSeek AI</h1>
            <p>Estado: <span class="status-badge">${status}</span></p>
            
            ${!isConnected && qrCodeData ? `
            <div class="instructions">
                <h2>📱 Conectar WhatsApp</h2>
                <div class="step">1. Abre WhatsApp en tu teléfono</div>
                <div class="step">2. Ve a: <strong>Ajustes → Dispositivos vinculados → Vincular un dispositivo</strong></div>
                <div class="step">3. Escanea el código QR de abajo</div>
            </div>
            
            <div class="qr-section">
                <h3>🔐 Código QR para Conectar</h3>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCodeData)}" 
                     alt="QR Code" 
                     style="max-width: 100%; height: auto; border: 3px solid #333; border-radius: 10px;">
                <br><br>
                <a href="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCodeData)}" 
                   target="_blank" class="btn">
                   📱 Abrir QR Grande
                </a>
                <p style="margin-top: 15px; color: #666;">
                    <strong>💡 Consejo:</strong> Si no puedes escanear, abre el "QR Grande" en tu teléfono
                </p>
            </div>
            ` : isConnected ? `
            <div style="background: rgba(76, 175, 80, 0.3); padding: 30px; border-radius: 15px; text-align: center;">
                <h2>✅ ¡Conectado Exitosamente!</h2>
                <p>El bot está listo para responder mensajes automáticamente.</p>
                <p>Envía un mensaje al número vinculado en WhatsApp para probar.</p>
            </div>
            ` : `
            <div style="background: rgba(255, 152, 0, 0.3); padding: 30px; border-radius: 15px; text-align: center;">
                <h2>⏳ Generando Código QR...</h2>
                <p>Esperando a que WhatsApp genere el código de conexión.</p>
                <p>Esto puede tomar hasta 30 segundos.</p>
                <p>Revisa los logs en Railway para ver el progreso.</p>
            </div>
            `}
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                <h3>📊 Información del Sistema</h3>
                <p><strong>Servidor:</strong> Railway</p>
                <p><strong>IA:</strong> DeepSeek</p>
                <p><strong>Estado:</strong> ${isConnected ? '🟢 Operativo' : '🟡 Esperando conexión'}</p>
            </div>
        </div>
    </body>
    </html>`;
    
    res.send(html);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: isConnected ? 'connected' : 'waiting_qr',
        timestamp: new Date().toISOString(),
        service: 'WhatsApp DeepSeek Bot'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web ejecutándose en puerto ${PORT}`);
    console.log(`📊 Puedes ver el estado en: http://0.0.0.0:${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando bot...');
    process.exit(0);
});

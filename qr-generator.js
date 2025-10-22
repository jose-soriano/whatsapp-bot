// qr-generator.js - Archivo adicional
const QRCode = require('qrcode');

async function generateHighQualityQR(qrData) {
    try {
        // Generar QR como data URL (alta calidad)
        const qrDataURL = await QRCode.toDataURL(qrData, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        // También generar como texto para terminal
        const qrTerminal = await QRCode.toString(qrData, { 
            type: 'terminal',
            small: false 
        });
        
        return {
            dataURL: qrDataURL,
            terminal: qrTerminal,
            url: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`
        };
    } catch (err) {
        console.error('Error generando QR:', err);
        return null;
    }
}

module.exports = { generateHighQualityQR };

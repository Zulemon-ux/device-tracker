export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Log data (di Vercel, ini akan muncul di logs)
            console.log('📊 Data Perangkat Terdeteksi:');
            console.log(`🕐 Waktu: ${data.timestamp}`);
            console.log(`🌐 IP: ${data.ip}`);
            console.log(`📍 Lokasi: ${data.city}, ${data.country}`);
            console.log(`💻 Browser: ${getBrowser(data.userAgent)}`);
            console.log(`🖥️ OS: ${getOS(data.userAgent)}`);
            console.log(`📱 Device: ${data.userAgent}`);
            
            // Simpan ke database (opsional)
            // Di sini Anda bisa menambahkan integrasi dengan database seperti MongoDB, Firebase, dll.
            
            // Simpan ke file (hanya untuk development)
            // Di production, gunakan database
            
            res.status(200).json({ 
                success: true, 
                message: 'Data berhasil diterima',
                data: data
            });
            
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan server' 
            });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

// Helper functions sama seperti di tracker.js
function getBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
}

function getOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
}
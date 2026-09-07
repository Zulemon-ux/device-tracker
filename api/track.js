export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            console.log('📊 DATA PERANGKAT TERDETEKSI');
            console.log('═══════════════════════════════');
            
            // Informasi Waktu
            console.log(`🕐 Waktu: ${data.timestamp}`);
            console.log(`⏰ Timezone: ${data.timezone}`);
            
            // Informasi Lokasi
            console.log('\n📍 INFORMASI LOKASI:');
            console.log(`   Sumber: ${data.locationSource || 'Unknown'}`);
            if (data.city) console.log(`   Kota: ${data.city}`);
            if (data.region) console.log(`   Provinsi: ${data.region}`);
            if (data.country) console.log(`   Negara: ${data.country}`);
            if (data.postal) console.log(`   Kode Pos: ${data.postal}`);
            if (data.latitude && data.longitude) {
                console.log(`   Koordinat: ${data.latitude}, ${data.longitude}`);
                if (data.accuracy) {
                    console.log(`   Akurasi GPS: ±${data.accuracy}m`);
                }
            }
            
            // Informasi ISP
            if (data.isp) {
                console.log(`\n🏢 ISP: ${data.isp}`);
                if (data.asn) console.log(`   ASN: ${data.asn}`);
            }
            
            // Informasi Perangkat
            console.log('\n💻 INFORMASI PERANGKAT:');
            console.log(`   Browser: ${getBrowser(data.userAgent)}`);
            console.log(`   OS: ${getOS(data.userAgent)}`);
            console.log(`   Tipe: ${getDeviceType(data.userAgent)}`);
            console.log(`   Bahasa: ${data.language}`);
            console.log(`   Resolusi: ${data.screenWidth}x${data.screenHeight}`);
            if (data.deviceMemory) {
                console.log(`   RAM: ${data.deviceMemory}GB`);
            }
            
            // Informasi Tambahan
            console.log('\n📎 INFORMASI TAMBAHAN:');
            console.log(`   Referrer: ${data.referrer}`);
            console.log(`   URL: ${data.url}`);
            if (data.ipDistance) {
                console.log(`   Jarak IP-GPS: ${data.ipDistance.toFixed(2)}km`);
            }
            
            // Alamat detail dari reverse geocoding
            if (data.addressDetail) {
                console.log('\n🏠 ALAMAT DETAIL:');
                console.log(`   ${data.addressDetail.displayName || 'Tidak tersedia'}`);
            }
            
            console.log('═══════════════════════════════\n');
            
            // Simpan ke database (opsional)
            // await saveToDatabase(data);
            
            res.status(200).json({ 
                success: true, 
                message: 'Data berhasil diterima',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan server',
                error: error.message
            });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

// Helper functions
function getBrowser(userAgent) {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    return 'Unknown';
}

function getOS(userAgent) {
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    if (userAgent.includes('Mac OS X 10_15')) return 'macOS Catalina';
    if (userAgent.includes('Mac OS X 10_14')) return 'macOS Mojave';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
}

function getDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/mobile|iphone|android|blackberry|windows phone/i.test(ua)) return 'Mobile Phone';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    if (/bot|crawler|spider|scraper/i.test(ua)) return 'Bot/Crawler';
    return 'Desktop';
}

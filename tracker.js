// Fungsi untuk mendapatkan informasi perangkat
async function trackDevice() {
    const statusElement = document.getElementById('status');
    
    try {
        // Kumpulkan informasi perangkat
        const deviceInfo = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || 'Direct',
            url: window.location.href
        };

        // Dapatkan IP dan lokasi dari API publik
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        // Gabungkan semua data
        const fullData = {
            ...deviceInfo,
            ip: ipData.ip,
            country: ipData.country_name,
            city: ipData.city,
            region: ipData.region,
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            isp: ipData.org,
            countryCode: ipData.country_code
        };

        // Kirim data ke server (Vercel API)
        await sendDataToServer(fullData);
        
        // Update status
        statusElement.innerHTML = `
            ✅ Perangkat terdeteksi!<br>
            <small>IP: ${fullData.ip}</small><br>
            <small>Lokasi: ${fullData.city}, ${fullData.country}</small><br>
            <small>Browser: ${getBrowser(fullData.userAgent)}</small><br>
            <small>OS: ${getOS(fullData.userAgent)}</small>
        `;
        
        return fullData;
    } catch (error) {
        console.error('Error tracking device:', error);
        statusElement.innerHTML = '⚠️ Gagal mengumpulkan data';
    }
}

// Kirim data ke server
async function sendDataToServer(data) {
    try {
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Gagal mengirim data');
        }
        
        console.log('Data terkirim ke server');
    } catch (error) {
        console.error('Error mengirim data:', error);
        // Simpan ke localStorage sebagai backup
        saveToLocalStorage(data);
    }
}

// Backup ke localStorage
function saveToLocalStorage(data) {
    let backups = JSON.parse(localStorage.getItem('deviceTrackerBackups') || '[]');
    backups.push(data);
    localStorage.setItem('deviceTrackerBackups', JSON.stringify(backups));
}

// Helper: Deteksi browser
function getBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
}

// Helper: Deteksi OS
function getOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
}

// Jalankan tracking saat halaman dimuat
document.addEventListener('DOMContentLoaded', trackDevice);
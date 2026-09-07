# Device Tracker Web

Web sederhana untuk melacak perangkat yang membuka link.

## Fitur
- Mendeteksi IP Address
- Mendeteksi lokasi (kota, negara)
- Mendeteksi browser dan OS
- Mendeteksi ukuran layar
- Mendeteksi timezone
- Backup data ke localStorage jika server offline

## Deployment ke Vercel

1. Fork repository ini ke GitHub
2. Buka [Vercel](https://vercel.com)
3. Klik "New Project"
4. Import dari GitHub
5. Deploy

## Cara Kerja
1. User membuka link
2. JavaScript mengumpulkan informasi perangkat
3. Data dikirim ke API endpoint
4. Server mencatat data (bisa dilihat di logs Vercel)

## Penggunaan
Buka URL yang sudah dideploy dan lihat data di Vercel logs.

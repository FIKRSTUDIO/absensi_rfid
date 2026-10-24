# CoreTap - ESP32 RFID Attendance System

*Bahan-Bahan*: MFRC522, I2C 16x2 LCD, dan ESP32
Skematik dari rancangan absensi ini:
https://wokwi.com/projects/475866777166131201

1. Pakai Apps Scripts di Google Sheets
Original code (ikuti tutorial dari video ini): https://www.youtube.com/watch?v=pYZD02KIQU0&t=266s
 1. Download kode yang ada di repositori GitHub ini (tombol Code, lalu Download ZIP), kemudian ekstrak.
 2. Buat Google Sheets baru dan pasang Google Apps Script sesuai tutorial video di atas, lalu salin URL Deployment-nya.
 3. Masukkan URL script tersebut ke dalam variabel scriptURL di dalam kode ESP32, sesuaikan daftar nama dan UID siswa, lalu upload kodenya ke ESP32.
 
2. Pakai website
Link website trial: https://absensi-mfrc.netlify.app/
Jika ingin menggunakannya untuk sekolah/iseng-iseng:
 1. Download kode yang ada di repositori GitHub ini
 2. Ubah index.html. Buka dengan VS Code atau Notepad, tekan Ctrl + F, dan cari kata UBAH. Setiap bagian yang harus kamu ganti ditandai dengan kata itu. Daftarnya ada di tabel di bawah.
 3. Upload sketsa pembaca ke papanmu lewat Arduino IDE. Skematik ada di bagian atas README.md ini
 4. Buka index.html di Chrome atau Edge pada komputer. Tekan Hubungkan pembaca, pilih port papan, lalu tempelkan kartu.
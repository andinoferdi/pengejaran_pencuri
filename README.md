
# Pengejaran Pencuri

Permainan berbasis web di mana pemain mengendalikan pencuri yang berusaha mencapai rumah tanpa tertangkap oleh polisi. Permainan ini menggunakan **Python (Flask)** di backend, **JavaScript** untuk logika permainan dan animasi, serta **HTML** dan **CSS** untuk antarmuka pengguna.

## Fitur

- **Graf** yang menggambarkan jalur yang bisa dilalui oleh pencuri dan polisi.
- **Pencuri** harus bergerak melalui jalur untuk mencapai **Rumah** (HOME).
- **Polisi** mengejar pencuri berdasarkan jalur terpendek menggunakan algoritma **BFS**.
- **Animasi** pergerakan karakter dengan transisi halus.
- **Efek confetti** saat pencuri menang.
- **Tutorial interaktif** untuk membantu pemain memahami cara bermain.

## Instalasi

### Persyaratan

Pastikan Anda sudah menginstal Python dan `pip` di sistem Anda. Selain itu, Anda juga perlu menginstal **Flask** untuk menjalankan aplikasi.

### Langkah-langkah instalasi

1. **Clone repositori ini**:
   ```bash
   git clone https://github.com/andinoferdi/pengejaran-pencuri.git
   cd pengejaran-pencuri
   ```

2. **Buat dan aktifkan virtual environment (TIDAK WAJIB)**: 
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Untuk pengguna Linux/MacOS
   venv\Scriptsctivate     # Untuk pengguna Windows
   ```

3. **Instal dependensi**:
   ```bash
   pip install flask
   ```

4. **Jalankan aplikasi**:
   ```bash
   python app.py
   ```

5. Buka browser dan akses `http://127.0.0.1:5000/` untuk memainkan permainan.

## Struktur Proyek

```
pengejaran-pencuri/
│
├── static/
│   ├── favicon.png          # Favicon untuk tab browser
│   ├── script.js            # Logika permainan di sisi klien (JavaScript)
│   └── styles.css           # Gaya untuk tampilan permainan (CSS)
│
├── templates/
│   └── index.html           # Halaman utama permainan (HTML)
│
├── app.py                   # Aplikasi Flask (Backend)
├── requirements.txt         # Daftar dependensi Python
└── README.md                # Dokumentasi proyek ini
```

## Cara Bermain

1. **Klik pada node** yang terhubung untuk menggerakkan pencuri.
2. **Hindari polisi** yang akan mengejar dengan rute terpendek.
3. **Capai rumah (HOME)** untuk menang.

## Teknologi yang Digunakan

- **Backend**: Python (Flask)
- **Frontend**: HTML, CSS, JavaScript
- **Algoritma**: BFS (Breadth-First Search) untuk mencari jalur terpendek bagi polisi.

## Lisensi

Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

## Penulis

- **Andino Ferdiansah** - _Pengembang utama_ - [andinoferdi](https://github.com/andinoferdi)

---

Terima kasih telah menggunakan atau mengembangkan proyek ini!

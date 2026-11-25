# Deploy TAKHIR ke Vercel dengan Neon dan GitHub

Frontend React/Vite dan API Express berada dalam satu proyek Vercel. Database menggunakan PostgreSQL di Neon. Dokumen izin disimpan sebagai data di database, bukan di disk serverless.

## 1. Siapkan Neon

1. Buat project di [Neon](https://neon.tech), pilih region terdekat (misalnya Singapore).
2. Dari halaman **Connect**, salin connection string PostgreSQL dengan connection pooling aktif. Pastikan string memuat `sslmode=require`.
3. Simpan connection string tersebut sebagai `DATABASE_URL`; jangan masukkan ke GitHub.

## 2. Siapkan database dan admin pertama

Di folder utama proyek, salin `.env.example` menjadi `.env`, lalu isi:

- `DATABASE_URL`: connection string Neon.
- `JWT_SECRET`: secret acak panjang, misalnya hasil `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `ADMIN_EMAIL` dan `ADMIN_PASSWORD`: kredensial admin pertama. Password minimal 8 karakter.

Jalankan:

```powershell
npm install
npm run migrate
npm run dev
```

Migrasi membuat tabel dan kategori dasar. Jika belum ada admin, migrasi membuat akun admin dari variabel `ADMIN_*`. Migrasi aman dijalankan ulang. Jangan bagikan atau commit file `.env`.

Untuk menjalankan frontend lokal, buka terminal kedua:

```powershell
cd frontend
npm install
npm run dev
```

Buka alamat Vite yang ditampilkan (biasanya `http://localhost:5173`). Proxy `/api` mengarah ke backend lokal di port 5000.

## 3. Push proyek ke GitHub

Buat repository GitHub kosong, lalu dari folder utama proyek jalankan:

```powershell
git init
git add .
git status --short
```

Pastikan `.env` tidak tercantum di daftar berkas yang akan ditambahkan. Lanjutkan:

```powershell
git commit -m "Siapkan deploy TAKHIR ke Vercel"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
git push -u origin main
```

`.env*` diabaikan Git; hanya `.env.example` yang boleh masuk repository.

## 4. Deploy ke Vercel

1. Di Vercel, pilih **Add New → Project**, lalu impor repository GitHub.
2. Gunakan root directory `./`. Konfigurasi `vercel.json` sudah menentukan build frontend, folder output `frontend/dist`, dan routing API.
3. Tambahkan environment variables berikut di **Settings → Environment Variables** untuk Production (tambahkan juga Preview/Development bila diperlukan):
   - `DATABASE_URL`: connection string Neon yang sama.
   - `JWT_SECRET`: secret acak yang kuat. Sebaiknya berbeda dari secret lokal.
4. Deploy. Buka URL deployment dan masuk menggunakan `ADMIN_EMAIL` serta `ADMIN_PASSWORD` yang dibuat pada langkah 2.

Jangan isi `ADMIN_PASSWORD` di Vercel; akun admin sudah dibuat di database oleh migrasi lokal. Jangan pernah mengirim `DATABASE_URL` atau `JWT_SECRET` ke frontend dengan awalan `VITE_`.

## 5. Perubahan berikutnya

Setiap push ke branch yang terhubung di Vercel akan memicu deployment baru. Jika struktur database berubah, perbarui `database/schema.sql` dan jalankan `npm run migrate` dengan `DATABASE_URL` Neon yang sama sebelum memakai perubahan tersebut.

## Catatan

- Upload dokumen dibatasi 4 MB per file dan hanya menerima PDF, JPG, atau PNG. Batas payload fungsi Vercel juga berlaku.
- Neon dapat menidurkan compute saat tidak digunakan, sehingga permintaan pertama setelah jeda mungkin lebih lambat.
- Pembatas percobaan login disimpan per instance serverless; batasnya tidak dibagikan antar-instance.
- Data MySQL dari server lama tidak otomatis dipindahkan ke Neon.

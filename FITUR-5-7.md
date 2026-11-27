# Fitur 5–7 — panduan pengujian dan integrasi

## Menjalankan

Gunakan versi Node sesuai persyaratan Vite pada package.json asli. Dari root project:

```bash
npm ci
npm run dev
```

Buka URL yang muncul. Validasi dengan `npx tsc --noEmit -p tsconfig.app.json` dan `npm run build`.

## File

- `src/components/InterviewPrepTimer.tsx`: 5 soal, timer 120 detik, Start/Pause, Reset, soal berikutnya, cleanup interval saat pause/habis/unmount.
- `src/hooks/useUndoDelete.ts`: snapshot objek utuh, timeout 5 detik disimpan di useRef, menghapus timeout lama ketika delete baru terjadi. Hanya delete terbaru bisa di-undo.
- `src/components/UndoToast.tsx`: tombol Undo dan hitungan mundur, cleanup interval saat unmount.
- `src/utils/statistics.ts`, `src/components/DashboardStats.tsx`: hitung derived state dari applications, tanpa menyimpan statistik di useState.
- `src/utils/offerScore.ts`, `src/components/OfferComparator.tsx`: bandingkan dua OFFER berbeda; normalisasi gaji terhadap gaji terbesar dari kedua pilihan.
- `src/App.tsx`: integrasi, state aplikasi tetap dari useApplications, state skill dari useLocalStorage. Key localStorage lama tidak diubah. Lamaran yang baru dihapus masih direservasi selama 5 detik untuk mencegah duplikat jika Undo dilakukan.
- `src/App.css`: styling baru ditambahkan di akhir file.
- `src/components/FeatureDemoPipeline.tsx`: panel pengujian sementara, bukan pengganti fitur 3–4 milik anggota kelompok. Diagram state machine lengkap tidak disertakan dalam screenshot; transisi panel ini adalah asumsi sementara.

## Uji manual

1. Buka Eksplorasi, pilih dataset lokal dan simpan dua lowongan atau buat dua lamaran manual.
2. Buka Pipeline > Detail > Latihan Interview. Start, Pause, Reset, Next. Start lagi, tutup detail, lalu buka kembali: mulai dari 02:00 dan tidak berjalan dua kali lebih cepat.
3. Tambah checklist dan centang satu. Hapus lamaran, klik Undo sebelum 5 detik: objek beserta checklist dan log kembali. Refresh: tetap ada.
4. Hapus dua lamaran berurutan dalam 5 detik: hanya lamaran terakhir yang dapat dipulihkan, timeout lama tidak boleh menutup toast baru. Hapus lagi dan tunggu 5 detik: toast hilang, refresh tidak mengembalikan lamaran.
5. Buat lamaran APPLIED, klik Simulasi +15 Hari: Rawan Ghosting bertambah. Untuk menguji batas: 14 hari tepat belum termasuk, lebih dari 14 hari termasuk.
6. Pindahkan dua lamaran melalui APPLIED (CV dan tanggal) > SCREENING > INTERVIEW (jadwal) > OFFER (gaji dan mode kerja). Buka Bandingkan Offer.
7. Contoh: gaji A 6 juta, Remote, 80% match → 95.0. B 4,5 juta, Hybrid, 100% match → 81.3. Ubah skill dari Eksplorasi lalu kembali ke comparator: skill dan total dihitung ulang.
8. Jika hanya ada 0 atau 1 offer, tampil pesan kosong. Bila skor persis sama, tampil pesan seri.

## Asumsi rumus statistik

Instruksi tidak mendefinisikan status yang masuk Response Rate atau Interview Rate. Mengikuti contoh wireframe (pembagi total lamaran), Response Rate menghitung status SCREENING, INTERVIEW, OFFER, REJECTED; Interview Rate menghitung INTERVIEW dan OFFER. Status WISHLIST, APPLIED dan GHOSTED tidak dihitung sebagai response. Ini berdasarkan status saat ini, bukan riwayat. Jika anggota tim/asisten punya definisi lain, ubah `calculateStatistics`.

## Integrasi fitur 3–4

Saat pipeline resmi siap, hapus import dan pemakaian `FeatureDemoPipeline` di `App.tsx`, lalu render komponen pipeline resmi dengan state `applications`, callback `updateApplication` (atau `setApplications`), dan callback `deleteApplication` dari `useUndoDelete`. Import dan render `<InterviewPrepTimer />` di detail resmi. Pastikan panel detail unmount ketika ditutup; bila detail bisa berpindah tanpa unmount, gunakan `key={application.id}` pada timer. Gunakan `isGhostingRisk` yang sama agar statistik dan badge konsisten. `UndoToast`, `DashboardStats`, dan `OfferComparator` tetap pada App. Jangan membuat state applications/localStorage kedua.

## Status verifikasi

- Transpile sintaks 20 file TS/TSX: 0 error (TypeScript global 5.8.3).
- Pemeriksaan tipe strict helper statistik/skor dan tes logika: lulus.
- `npm ci` gagal mengakses registry (EAI_AGAIN) di lingkungan pemeriksaan; full build, lint, dan uji interaksi browser belum dijalankan. Versi dependency dan lockfile asli dipertahankan.

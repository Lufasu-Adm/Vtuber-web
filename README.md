# VTuber Web App 

Aplikasi VTuber berbasis web yang menggunakan **Three.js** untuk rendering 3D dan **MediaPipe Holistic** untuk pelacakan gerakan (tracking) wajah serta anggota tubuh secara real-time melalui kamera.

## 🚀 Fitur Utama
- **Face Tracking**: Pelacakan posisi kepala (Neck/Head), kedipan mata (Blink), dan gerakan mulut (A-I-U-E-O).
- **Arm Tracking (WIP)**: Pelacakan lengan dan siku menggunakan koordinat dunia (Pose World Landmarks).
- **Optimasi Performa**: Penggunaan model complexity rendah untuk memastikan jalannya AI yang lebih ringan di perangkat dengan spesifikasi standar.

## 🛠️ Teknologi yang Digunakan
- [Three.js](https://threejs.org/) - Library JavaScript untuk rendering 3D.
- [Three-vrm](https://github.com/vrm-c/three-vrm) - Ekstensi untuk mendukung format model `.vrm`.
- [MediaPipe Holistic](https://google.github.io/mediapipe/solutions/holistic.html) - AI untuk melacak wajah, pose tubuh, dan tangan secara simultan.
- [Kalidokit](https://github.com/yeemachine/kalidokit) - Solver kinematika untuk memetakan koordinat AI ke tulang model VRM.

## 📂 Struktur Proyek
- `index.html`: Kerangka utama dan pemanggilan library via CDN.
- `app.js`: Logika utama inisialisasi scene, pengolahan AI, dan penggerak tulang model.
- `models/`: Folder penyimpanan model 3D (`sanhua.vrm`).

## ⚙️ Cara Menjalankan secara Lokal
1. Clone repositori ini:
   ```bash
   git clone [https://github.com/](https://github.com/)[Username-Anda]/[Nama-Repo].git

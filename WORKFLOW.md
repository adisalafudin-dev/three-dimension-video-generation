# WORKFLOW: topik -> video MP4

## 1. Setup (sekali)

```bash
npm install
mkdir -p public/fonts public/models
cp node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2 public/fonts/Inter-Bold.woff2
npx tsc --noEmit        # harus tanpa error (storyboard.json ada setelah parse pertama)
```

## 2. Alur harian

1. **Tulis storyboard.** Isi INPUT di `PROMPT.md` (topik, durasi, format, voice, `AVAILABLE_MODELS`), tempel ke Claude, simpan jawabannya sebagai `storyboard/NAMA.md`.
   - Butuh model? Set `AVAILABLE_MODELS: recommend`. Claude membalas daftar model (kata kunci, nama file). Unduh ke `public/models/`, lalu kirim ulang INPUT dengan `AVAILABLE_MODELS: models/x.glb` (tambah `(clips: Walk, Idle)` jika file beranimasi).
2. **Suara.** `npm run voice -- storyboard/NAMA.md`
   - Buat mp3 + word timing per scene di `public/audio/NAMA/`. Yang tidak berubah dilewati (`cached`).
   - Harus tanpa `WARNING` / `ESTIMATED`. Paksa ulang: tambah `--force`.
3. **Validasi.** `npm run check -- storyboard/NAMA.md`
   - Harus `Parsed N scenes`. Jika error, tempel daftar error ke Claude: "Fix these errors. Output the full corrected storyboard only." lalu simpan ulang dan ulangi dari langkah 2.
4. **Preview (opsional).** `npm run check -- storyboard/NAMA.md && npx remotion studio`, geser timeline, cek karaoke, kamera, beat.
5. **Render.** `npm run make -- storyboard/NAMA.md` -> `out/NAMA.mp4`
   - `make` = voice + check + render sekaligus. Banyak file: `npm run make -- storyboard/a.md storyboard/b.md`.
   - Flag: `--no-voice` (lewati suara), `--no-render` (hanya validasi).
   - Mesin tanpa GPU: `GL=swiftshader npm run make -- storyboard/NAMA.md`

Urutan ringkas: `voice -> check -> (studio) -> make`.

## 3. Perintah

| Perintah                                    | Fungsi                                                    |
| ------------------------------------------- | --------------------------------------------------------- |
| `npm run voice -- <file.md> [--force]`      | Generate suara dari `narration` (cache hash voice + teks) |
| `npm run check -- <file.md>`                | Validasi + tulis `src/generated/storyboard.json`          |
| `npm run make -- <file.md ...>`             | voice + check + render ke `out/<nama>.mp4`                |
| `npm run narrate -- DIR/sceneN "Kalimat"`   | Satu klip suara manual (`public/audio/DIR/sceneN.*`)      |
| `npm run dev` / `dev:vertical` / `dev:kits` | Studio untuk demo lama                                    |
| `npm run lint`                              | eslint + tsc (hanya 2 warning lama `non-pure-animation`)  |

## 4. Aturan storyboard (ringkas, lengkap di PROMPT.md)

- Scene: `## Judul` + `- key: value`. Key tidak dikenal = error.
- Suara: `narration: "teks"` + `duration: auto`. Jangan tulis `audio` / `words`.
- Beat (indent 2 spasi): `@ <detik> <type> key="nilai" [for=<detik>]` dengan type `title tag badge quote stat checklist callout camera`. `*kata*` = sorot kuning.
- Chapter: scene berurutan dengan `chapter:` sama berbagi satu dunia 3D, kamera menyambung (`@ 3.5 camera pos="x, y, z"`). Scene lanjutan tidak boleh set shape/color/background/camera/transition.
- Kit: `kit: layers` (`+ layer ...`, aksi `explode`, `highlight`) atau `kit: road` (`+ rain`, `+ car`, aksi `drive`, `rain`).
- Gerak objek: `@ 0 motion preset=fall-into from="..." target="..." for=4` (preset: fall-into, launch, fly-to, drive, orbit, float). Tidak butuh model beranimasi. `@ t pose style=flail|float|run|wave` untuk humanoid.
- Tema: `theme: space|farm` (menggantikan `background`). `background` juga boleh `gradient(#a, #b, 180deg)` atau `image(images/x.jpg)`. Prop: `+ planet ...`, `+ blackhole ...`.
- `animation: "Klip"` hanya untuk `.glb` yang punya klip (cek di gltf-viewer.donmccurdy.com). Selain itu pakai `motion`.
- Portrait 1080x1920: kamera z 8 sampai 12, bagian bawah 20% kosong.

## 5. Model 3D

1. Cari `.glb`: Poly Pizza, Kenney, Quaternius (CC0), Sketchfab (Downloadable, glTF/glb). Cek lisensi, CC-BY perlu kredit.
2. Taruh di `public/models/`.
3. Di scene: `shape: model` dan `model: models/nama.glb` (keduanya wajib). Ukuran dan posisi otomatis, `color` diabaikan, berputar di sumbu Y, animasi di dalam file tidak diputar.
4. Background hanya warna polos: `background: #0b1020`.

## 6. Troubleshooting

| Gejala                                                 | Penyebab / solusi                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `narration audio is not generated yet`                 | Jalankan `npm run voice -- <file.md>` dulu                                                                     |
| `voice` menampilkan `ESTIMATED` / `WARNING`            | Layanan TTS tidak kirim word boundary. Coba voice lain atau jalankan ulang dengan `--force`                    |
| Suara terpotong di akhir scene                         | Pakai `duration: auto`, atau naikkan `duration` (suara + transisi berikutnya + 0,2 detik)                      |
| Error `beat ... ends at ... but the scene is only ...` | Perpendek `for` atau naikkan durasi; beat harus selesai di dalam scene                                         |
| Objek terpotong di portrait                            | Jauhkan kamera (z lebih besar)                                                                                 |
| Render hitam / WebGL gagal                             | `GL=swiftshader` (tanpa GPU) atau ganti `--gl`                                                                 |
| Studio tidak menunjukkan storyboard terbaru            | Jalankan `npm run check -- <file.md>` lalu buka ulang Studio                                                   |
| `animation` error / model diam                         | File tidak punya klip: hapus `animation`, pakai `motion` + `pose`                                              |
| `motion` ditolak                                       | Cek `for` ada, `target` untuk fall-into/fly-to/orbit, tidak tumpang tindih, `theme` tidak bersama `background` |
| Caption tidak muncul                                   | Baris caption harus diawali `>` (boleh indent)                                                                 |

## 7. Debug dan verifikasi (dev)

```bash
# render / uji cepat
npx remotion still src/index.ts TestModel out/model.png --frame=30 --gl=angle
time npx remotion render src/index.ts TestCube out/test.mp4 --gl=angle --concurrency=2
npx remotion still src/index.ts ScriptVideo out/f.png --frame=120 --gl=angle

# validasi harus gagal dengan pesan jelas dan exit 1, tanpa menulis file
npx tsx scripts/parse-script.ts storyboard/bad.md out/bad.json; echo "exit=$?"
ls out/bad.json    # tidak boleh ada

npm run lint        # 2 warning lama saja
npm ls remotion @remotion/captions @remotion/fonts @remotion/three @remotion/transitions @remotion/media --depth=0   # versi sama persis
```

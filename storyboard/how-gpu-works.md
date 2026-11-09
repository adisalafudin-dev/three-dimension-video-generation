---
title: Cara Kerja GPU
fps: 30
width: 1080
height: 1920
voice: id-ID-ArdiNeural
---

## Jutaan Piksel

- duration: auto
- shape: model
- model: models/gpu-card.glb
- rotationSpeed: 0.2
- camera: 0.6, 6.4, 3.2
- cameraTo: 1.8, 5.7, 1.8
- cameraEase: ease-in-out
- background: gradient(#07111f, #142b45, 180deg)
- narration: "Saat gim berjalan, GPU harus menyusun jutaan piksel menjadi frame yang terlihat di layar."
  @ 0.2 title eyebrow="DI BALIK LAYAR" text="Cara kerja *GPU*" for=2.8

## Instruksi dari CPU

- chapter: cpu-handoff
- duration: auto
- transition: fade
- transitionDuration: 0.35
- shape: model
- model: models/CPU.glb
- rotationSpeed: 0.2
- camera: 0.8, 0.4, 5.8
- cameraTo: -0.6, 0.2, 5.1
- cameraEase: ease-in-out
- background: gradient(#07111f, #142b45, 180deg)
- narration: "CPU menyiapkan instruksi dan data, lalu mengirim bagian pekerjaan grafis ke GPU."
  @ 0.2 title eyebrow="LANGKAH 1" text="CPU membagi *tugas*" for=2.6

## Pemrosesan Paralel

- chapter: gpu-parallel
- duration: auto
- transition: fade
- transitionDuration: 0.35
- shape: model
- model: models/gpu-card.glb
- rotationSpeed: 0.2
- camera: 0.5, 6.2, 3.0
- cameraTo: 1.8, 5.4, 1.6
- cameraEase: ease-in-out
- background: gradient(#07111f, #142b45, 180deg)
- narration: "GPU menjalankan banyak perhitungan serentak: unit-unitnya mengolah warna, tekstur, dan cahaya pada bagian gambar berbeda."
  @ 0.2 title eyebrow="LANGKAH 2" text="Banyak hitungan, *serentak*" for=2.8

## Frame di Monitor

- chapter: gpu-output
- duration: auto
- transition: fade
- transitionDuration: 0.35
- shape: model
- model: models/monitor.glb
- rotationSpeed: 0.2
- camera: 1.5, 0.8, 6.1
- cameraTo: -0.3, 0.4, 5.2
- cameraEase: ease-in-out
- background: gradient(#07111f, #142b45, 180deg)
- narration: "Hasilnya dikumpulkan menjadi satu frame, kemudian dikirim ke monitor untuk ditampilkan."
  @ 0.2 title eyebrow="LANGKAH 4" text="Satu frame di *layar*" for=2.7

## Menjaga GPU Tetap Dingin

- chapter: gpu-cooling
- duration: auto
- transition: fade
- transitionDuration: 0.35
- shape: model
- model: models/cooling-fan.glb
- rotationSpeed: 0.2
- camera: 0.7, 1.5, 6.2
- cameraTo: -0.5, 0.3, 5.3
- cameraEase: ease-in-out
- background: gradient(#07111f, #142b45, 180deg)
- narration: "Kipas membantu membuang panas saat beban meningkat. CPU tetap mengatur program, sementara GPU memproses tugas paralel."
  @ 0.2 title eyebrow="RINGKASNYA" text="Paralelisme menghasilkan *kecepatan*" for=3

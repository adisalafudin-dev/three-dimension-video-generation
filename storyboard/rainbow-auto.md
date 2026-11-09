---
title: How a Rainbow Forms
fps: 30
width: 1080
height: 1920
voice: en-US-GuyNeural
---

## Sunlight

- duration: auto
- shape: sphere
- color: #ffd43b
- rotationSpeed: 0.5
- camera: 0, 0, 9
- background: #0b1020
- narration: "Sunlight looks white, but it secretly hides every single color inside."
  @ 0.3 title eyebrow="KITA BEDAH" text="How a _rainbow_ forms" for=3
  @ 0 tag text="Physics"

## Into the Drop

- chapter: drop
- duration: auto
- transition: fade
- shape: sphere
- color: #74c0fc
- rotationSpeed: 0.8
- camera: 0, 0, 10.5
- background: #0b1a33
- narration: "When a ray enters a raindrop, it slows down and starts to bend."
  @ 3.5 camera pos="4, 2, 8"
  @ 0.4 callout text="Light _slows down_" at="0.8, 0.8, 0.9" for=3

## Bending

- chapter: drop
- duration: auto
- narration: "Water bends the light because it travels slower than it does in air."
  @ 3.5 camera pos="-4, 1.5, 8"
  @ 0.5 quote text="Light takes the _fastest_ path, not the shortest." by="Fermat" for=3

## Rainbow

- transition: slide
- duration: auto
- shape: sphere
- color: #51cf66
- rotationSpeed: 1
- camera: 0, 1.5, 12
- cameraTo: 0, 1.5, 7.5
- background: #0b1a33
- narration: "Millions of drops together split the sunlight into one big rainbow."
  @ 1 stat value="1,000,000+" label="drops make _one_ rainbow" for=3

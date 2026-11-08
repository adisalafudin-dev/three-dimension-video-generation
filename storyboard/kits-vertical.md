---
title: Tile Floor and Rain (kits demo)
fps: 30
width: 1080
height: 1920
---

## Cross-section

- chapter: floor
- kit: layers
- duration: 5
- camera: 5, 3.5, 11
- background: #0b1a33
  - layer name="Tile" color=#e9ecef thickness=0.15
  - layer name="Adhesive" color=#ffd43b thickness=0.1
  - layer name="Screed" color=#adb5bd thickness=0.4
  - layer name="Slab" color=#868e96 thickness=0.5
    @ 0.3 title eyebrow="KITA BEDAH" text="Lantai _keramik_" for=3.5
    @ 1.5 explode amount=1.2 for=1.5
    > Every tile floor is a stack of layers.

## Adhesive

- chapter: floor
- duration: 5
  @ 4.5 camera pos="-5, 2, 11"
  @ 0.3 highlight layer="Adhesive" for=4
  @ 0.5 callout text="Bond _layer_" at="2.1, 0.74, 0" for=3.5
  > The adhesive holds the tile in place.

## Road

- transition: fade
- kit: road
- duration: 6
- camera: -10, 2.5, -1.6
- background: #10151f
  - rain intensity=0.7
  - car color=#ff6b6b
    @ 0.5 drive to=5 for=4
    @ 4 rain intensity=1 for=1.5
    > Rain makes the road slippery.

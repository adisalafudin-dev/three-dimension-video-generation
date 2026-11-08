---
title: How a Rainbow Forms (vertical)
fps: 30
width: 1080
height: 1920
---

## Sunlight

- duration: 5.5
- shape: sphere
- color: #ffd43b
- rotationSpeed: 0.5
- camera: 0, 0, 9
- background: #0b1020
- audio: audio/rv/scene1.mp3
- words: audio/rv/scene1.words.json
  @ 0.3 title eyebrow="KITA BEDAH" text="How a _rainbow_ forms" for=3
  @ 0 tag text="Physics"
  @ 0 badge text="@adicom"
  > Sunlight looks white, but it secretly hides every single color inside.

## Into the Drop

- chapter: drop
- duration: 6
- transition: fade
- shape: sphere
- color: #74c0fc
- rotationSpeed: 0.8
- camera: 0, 0, 10.5
- background: #0b1a33
- audio: audio/rv/scene2.mp3
- words: audio/rv/scene2.words.json
  @ 5.5 camera pos="4, 2, 8"
  @ 0.4 callout text="Light _slows down_" at="0.8, 0.8, 0.9" for=3
  @ 3.6 stat value="1.33" label="water's refractive index"
  > When a ray enters a raindrop, it slows down and starts to bend.

## Bending

- chapter: drop
- duration: 6
- audio: audio/rv/scene3.mp3
- words: audio/rv/scene3.words.json
  @ 5.5 camera pos="-4, 1.5, 8"
  @ 0.5 quote text="Light takes the _fastest_ path, not the shortest." by="Fermat" for=4
  > Water bends the light because it travels slower than it does in air.

## Bounce

- chapter: drop
- duration: 6
- audio: audio/rv/scene4.mp3
- words: audio/rv/scene4.words.json
  @ 5.5 camera pos="0, 3, 7"
  @ 0.5 checklist items="Enters the drop | Hits the back wall | Bounces out" for=4.5
  > The light then bounces off the back wall of the drop.

## Splitting

- duration: 6
- transition: fade
- shape: torus
- color: #ff922b
- rotationSpeed: 2
- camera: -4.5, 1.5, 7.5
- background: #0b1020
- audio: audio/rv/scene5.mp3
- words: audio/rv/scene5.words.json
  @ 0.3 title eyebrow="THE TRICK" text="Each color _bends differently_" for=3
  > Each color bends by a different amount, red the least and violet the most.

## Rainbow

- duration: 6
- transition: slide
- shape: sphere
- color: #51cf66
- rotationSpeed: 1
- camera: 0, 1.5, 12
- cameraTo: 0, 1.5, 7.5
- cameraEase: ease-out
- background: #0b1a33
- audio: audio/rv/scene6.mp3
- words: audio/rv/scene6.words.json
  @ 1 stat value="1,000,000+" label="drops make _one_ rainbow" for=4
  > Millions of drops together split the sunlight into one big rainbow.

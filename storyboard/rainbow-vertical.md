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
  > Sunlight looks white, but it secretly hides every single color inside.

## Into the Drop

- duration: 6
- transition: fade
- shape: sphere
- color: #74c0fc
- rotationSpeed: 0.8
- camera: 0, 0, 10.5
- cameraTo: 0, 0, 6.75
- cameraEase: ease-in-out
- background: #0b1a33
- audio: audio/rv/scene2.mp3
- words: audio/rv/scene2.words.json
  > When a ray enters a raindrop, it slows down and starts to bend.

## Bending

- duration: 6
- transition: slide
- shape: box
- color: #ffffff
- rotationSpeed: 0.8
- camera: 0, 1.5, 7.5
- background: #101020
- audio: audio/rv/scene3.mp3
- words: audio/rv/scene3.words.json
  > Water bends the light because it travels slower than it does in air.

## Bounce

- duration: 6
- transition: wipe
- shape: torus
- color: #b197fc
- rotationSpeed: 1.2
- camera: 4.5, 3, 7.5
- background: #1a1030
- audio: audio/rv/scene4.mp3
- words: audio/rv/scene4.words.json
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
  > Millions of drops together split the sunlight into one big rainbow.

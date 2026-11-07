---
title: How a Rainbow Forms
fps: 30
width: 1920
height: 1080
---

## Sunlight

- duration: 5
- shape: sphere
- color: #ffd43b
- rotationSpeed: 0.5
- camera: 0, 0, 6
- background: #0b1020
- audio: audio/rainbow/scene1.mp3
  > Sunlight looks white
  > but hides every color

## Into the Drop

- duration: 5.5
- transition: fade
- shape: sphere
- color: #74c0fc
- rotationSpeed: 0.8
- camera: 0, 0, 7
- cameraTo: 0, 0, 4.5
- cameraEase: ease-in-out
- background: #0b1a33
- audio: audio/rainbow/scene2.mp3
  > Light enters a raindrop

## Bending

- duration: 5.5
- transition: slide
- shape: box
- color: #ffffff
- rotationSpeed: 0.8
- camera: 0, 1, 5
- background: #101020
- audio: audio/rainbow/scene3.mp3
  > Water bends the light

## Bounce

- duration: 5.5
- transition: wipe
- shape: torus
- color: #b197fc
- rotationSpeed: 1.2
- camera: 3, 2, 5
- background: #1a1030
- audio: audio/rainbow/scene4.mp3
  > It bounces off the back

## Splitting

- duration: 5.5
- transition: fade
- shape: torus
- color: #ff922b
- rotationSpeed: 2
- camera: -3, 1, 5
- background: #0b1020
- audio: audio/rainbow/scene5.mp3
  > Each color bends differently
  > Red least, violet most

## Rainbow

- duration: 5.5
- transition: slide
- shape: sphere
- color: #51cf66
- rotationSpeed: 1
- camera: 0, 1, 8
- cameraTo: 0, 1, 5
- cameraEase: ease-out
- background: #0b1a33
- audio: audio/rainbow/scene6.mp3
  > Millions of drops make a rainbow

---
title: Demo
fps: 30
width: 1920
height: 1080
---

## Intro

- duration: 5.5
- shape: box
- color: #51cf66
- rotationSpeed: 1.2
- camera: 0, 1, 5
- background: #0b1020
- audio: audio/scene1.mp3
  > Written as a plain text script

## Spin Faster

- duration: 5.5
- transition: fade
- shape: torus
- color: #4dabf7
- rotationSpeed: 3
- camera: 3, 2, 4
- background: #101a30
- audio: audio/scene2.mp3
  > Change a value, change the scene

## Camera Dolly

- duration: 5.5
- transition: slide
- shape: sphere
- color: #ff6b6b
- rotationSpeed: 0.8
- camera: 0, 0, 8
- cameraTo: 0, 0, 4
- cameraEase: ease-out
- background: #14281c
- audio: audio/scene3.mp3
  > Cinematic camera moves

## Meet the Duck

- duration: 5.5
- transition: wipe
- shape: model
- model: models/duck.glb
- rotationSpeed: 1
- camera: 0, 1, 8
- cameraTo: 0, 1, 4
- cameraEase: ease-in-out
- background: #1a1030
- audio: audio/scene4.mp3
  > Your own 3D models

## Smooth Cuts

- duration: 5.5
- transition: fade
- shape: box
- color: #ffd43b
- rotationSpeed: 2.5
- camera: 4, 3, 4
- cameraTo: -4, 3, 4
- cameraEase: ease-in-out
- background: #2a1a10
- audio: audio/scene5.mp3
  > Transitions between scenes

## Wrap Up

- duration: 5.5
- transition: slide
- shape: sphere
- color: #51cf66
- rotationSpeed: 0.8
- camera: 0, 0, 5
- background: #0b1020
- audio: audio/scene6.mp3
  > One script, one command

---
title: Astronaut at the Event Horizon
fps: 30
width: 1080
height: 1920
---

## Drifting Near the Horizon

- duration: 4
- shape: model
- model: models/astronaut.glb
- theme: space
- themeDetail: high
- camera: 0, 1, 10
- rotationSpeed: 0.2
+ blackhole radius=1.2 pos="0,0,-6"
+ planet color=#2e66c4 radius=1.7 pos="6,3,-10" ring=off
  @ 0 motion preset=float from="-1,1,0" for=4 tumble=0.15
  @ 0 pose style=float for=4 amount=0.65

> Gravity pulls the astronaut closer.

## Falling In

- duration: 4
- shape: model
- model: models/astronaut.glb
- theme: space
- camera: 0, 0, 8
  @ 0 motion preset=fall-into from="0,0,0" target="0,0,-6" for=4 turns=2 tumble=0.8
  @ 0 pose style=flail for=4 amount=1

> The astronaut spirals toward the event horizon.

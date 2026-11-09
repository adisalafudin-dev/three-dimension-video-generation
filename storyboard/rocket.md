---
title: Rocket Flight to Mars
fps: 30
width: 1080
height: 1920
---

## Launch

- duration: 3
- shape: model
- model: models/astronaut.glb
- theme: space
- themeDetail: low
- camera: 0, 1, 11
+ planet color=#c1440e radius=1.8 pos="5,2,-8" ring=off
  @ 0 motion preset=launch from="0,-4,0" target="0,4,0" for=3 ease=ease-in
  @ 0 pose style=run for=3 amount=0.4

> Engines ignite and the crew climbs into orbit.

## Cruise to Mars

- duration: 4
- shape: model
- model: models/astronaut.glb
- theme: space
- camera: 0, 0, 10
  @ 0 motion preset=fly-to from="0,0,0" target="5,2,-8" for=4 ease=ease-in-out
  @ 0 pose style=float for=4 amount=0.25

> The spacecraft flies toward the red planet.

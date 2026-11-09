---
title: What Happens If You Fall Into a Black Hole?
fps: 30
width: 1080
height: 1920
voice: en-US-GuyNeural
---

## The Fall Begins

- duration: auto
- chapter: approach
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- color: #ffffff
- camera: 0, 0, 10
- theme: space
- themeDetail: high

* blackhole radius=1.5 pos="0, 0, -6"
  @ 0.2 title eyebrow="SPACE EXPLAINED" text="What if you fell into a _BLACK HOLE_?" for=3.5
  @ 0.5 motion preset=fall-into from="0, 0, 5" target="0, 0, -6" for=5 ease=ease-in

- narration: "Imagine falling into a black hole. One of the most terrifying places in the entire universe."

## Getting Closer

- duration: auto
- chapter: gravity
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- camera: 0, 0, 10
- theme: space
- themeDetail: high

* blackhole radius=2 pos="0, 0, -5"
  @ 0.5 callout text="Gravity becomes _extreme_" at="0, 0, -5" for=3

- narration: "As you approach, gravity becomes incredibly powerful, pulling everything around you toward its dark center."

## The Spaghettification

- duration: auto
- chapter: spaghettification
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- camera: 0, 0, 9
- theme: space
- themeDetail: high
  @ 0.5 title text="Spaghettification" for=3
  @ 1 motion preset=fall-into from="0, 0, 4" target="0, 0, -4" for=4 tumble=0.3
- narration: "Your feet experience stronger gravity than your head, stretching your body like an incredibly long strand of spaghetti."

## The Event Horizon

- duration: auto
- chapter: horizon
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- camera: 0, 0, 10
- theme: space
- themeDetail: high

* blackhole radius=2 pos="0, 0, -5"
  @ 0.5 title text="The _Point of No Return_" for=3
  @ 1 motion preset=fall-into from="0, 0, 5" target="0, 0, -5" for=4

- narration: "Eventually, you cross the event horizon. Beyond this invisible boundary, escaping becomes physically impossible."

## What Would You See?

- duration: auto
- chapter: inside
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- camera: 0, 0, 10
- theme: space
- themeDetail: high

* blackhole radius=2.5 pos="0, 0, -5"
  @ 0.5 title text="Can You Still See Outside?" for=3
  @ 1 quote text="Time and light behave differently near a black hole." for=3

- narration: "To an outside observer, your movements appear slower and your light becomes increasingly redshifted and faint."

## Inside the Black Hole

- duration: auto
- chapter: singularity
- shape: model
- model: models/astronaut.glb
- modelRotate: off
- camera: 0, 0, 10
- theme: space
- themeDetail: high

* blackhole radius=3 pos="0, 0, -5"
  @ 0.5 title text="The _Singularity_" for=3
  @ 1 motion preset=fall-into from="0, 0, 4" target="0, 0, -5" for=4 tumble=0.5

- narration: "Eventually, classical physics predicts you reach the singularity, where matter is compressed into an incredibly tiny region."

## The Biggest Mystery

- duration: auto
- chapter: mystery
- shape: sphere
- color: #a78bfa
- camera: 0, 0, 10
- theme: space
- themeDetail: high
  @ 0.5 title text="We Still Don't Know _Everything_" for=3
  @ 1 stat value="UNKNOWN" label="What happens inside?"
- narration: "But here's the mystery: scientists still don't know exactly what happens inside, because we need a theory of quantum gravity."

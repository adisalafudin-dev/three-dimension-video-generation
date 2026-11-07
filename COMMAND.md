# for render

npx remotion still src/index.ts TestModel out/model.png --frame=30 --gl=angle

# for checking the render time

time npx remotion render src/index.ts TestCube out/test.mp4 --gl=angle --concurrency=2

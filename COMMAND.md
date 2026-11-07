# for render

npx remotion still src/index.ts TestModel out/model.png --frame=30 --gl=angle

# for checking the render time

time npx remotion render src/index.ts TestCube out/test.mp4 --gl=angle --concurrency=2

npx tsc --noEmit # no errors
npm run parse # "Parsed 4 scenes"

# Validation: must fail with readable errors and exit code 1

npx tsx scripts/parse-script.ts storyboard/bad.md out/bad.json; echo "exit=$?"
ls out/bad.json # must NOT exist

npm run dev # Studio: ScriptVideo, 14s, 420 frames

npx tsx scripts/parse-script.ts storyboard/bad-p3-a.md src/generated/\_tmp.json

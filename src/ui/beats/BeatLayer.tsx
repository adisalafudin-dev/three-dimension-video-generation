import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraAt } from "../../script/camera";
import type { Beat } from "../../script/types";
import type { CameraPoint } from "../../script/camera";
import {
  ACCENT,
  FONT,
  Highlighted,
  PANEL,
  useBeatMotion,
  useUnit,
} from "./shared";

type Cam = { points: CameraPoint[]; offset: number }; // chapter camera path + this scene's start frame
type Props = {
  beat: Beat;
  durationInFrames: number;
  localFrame: number; // frames since this beat started
  sceneFrame: number; // frames since the scene started
  cam?: Cam;
};

const FOV = 50; // must match the ThreeCanvas camera in ChapterView

// Where a 3D point lands on screen at this frame (same camera as the render, no useFrame)
const projectToScreen = (
  at: [number, number, number],
  cam: Cam,
  sceneFrame: number,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } => {
  const [px, py, pz] = cameraAt(cam.points, cam.offset + sceneFrame);
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 100);
  camera.position.set(px, py, pz);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const v = new THREE.Vector3(...at).project(camera);
  return {
    x: ((v.x + 1) / 2) * width,
    y: ((1 - v.y) / 2) * height,
    visible: v.z < 1,
  };
};

const Title: React.FC<Props> = ({ beat, durationInFrames, localFrame }) => {
  const { u, height } = useUnit();
  const m = useBeatMotion(localFrame, durationInFrames);
  if (beat.type !== "title") return null;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        paddingTop: height * 0.12,
        opacity: m.opacity,
        transform: `translateY(${m.translateY}px)`,
      }}
    >
      <div style={{ maxWidth: "86%", textAlign: "center", fontFamily: FONT }}>
        {beat.eyebrow ? (
          <div
            style={{
              fontSize: u * 0.035,
              fontWeight: 700,
              letterSpacing: u * 0.008,
              textTransform: "uppercase",
              color: ACCENT,
              marginBottom: u * 0.02,
            }}
          >
            {beat.eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontSize: u * 0.085,
            lineHeight: 1.08,
            fontWeight: 700,
            color: "white",
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          <Highlighted text={beat.text} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<Props & { side: "left" | "right" }> = ({
  beat,
  durationInFrames,
  localFrame,
  side,
}) => {
  const { u, height } = useUnit();
  const m = useBeatMotion(localFrame, durationInFrames);
  if (beat.type !== "tag" && beat.type !== "badge") return null;
  const isTag = beat.type === "tag";
  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.045,
        [side]: u * 0.05,
        opacity: m.opacity,
        transform: `scale(${m.scale})`,
        transformOrigin: side === "left" ? "left center" : "right center",
        padding: `${u * 0.012}px ${u * 0.03}px`,
        borderRadius: 999,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: u * 0.03,
        letterSpacing: u * 0.004,
        textTransform: "uppercase",
        background: isTag ? ACCENT : PANEL,
        color: isTag ? "#141414" : ACCENT,
      }}
    >
      {beat.text}
    </div>
  );
};

const Card: React.FC<{
  durationInFrames: number;
  localFrame: number;
  children: (u: number) => React.ReactNode;
}> = ({ durationInFrames, localFrame, children }) => {
  const { u, height } = useUnit();
  const m = useBeatMotion(localFrame, durationInFrames);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: height * 0.2, // keeps the card's centre at ~40% of the height, above the caption
      }}
    >
      <div
        style={{
          width: "80%",
          maxWidth: u * 0.86,
          boxSizing: "border-box",
          padding: u * 0.05,
          borderRadius: u * 0.05,
          background: PANEL,
          border: "2px solid rgba(255,255,255,0.12)",
          fontFamily: FONT,
          color: "white",
          opacity: m.opacity,
          transform: `translateY(${m.translateY}px) scale(${m.scale})`,
        }}
      >
        {children(u)}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC<Props> = ({ beat, durationInFrames, localFrame }) => {
  if (beat.type !== "quote") return null;
  return (
    <Card durationInFrames={durationInFrames} localFrame={localFrame}>
      {(u) => (
        <>
          <div
            style={{
              fontSize: u * 0.16,
              lineHeight: 0.6,
              color: ACCENT,
              height: u * 0.08,
            }}
          >
            “
          </div>
          <div
            style={{ fontSize: u * 0.058, lineHeight: 1.2, fontWeight: 700 }}
          >
            <Highlighted text={beat.text} />
          </div>
          {beat.by ? (
            <div
              style={{
                marginTop: u * 0.03,
                fontSize: u * 0.035,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              — {beat.by}
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
};

const Stat: React.FC<Props> = ({ beat, durationInFrames, localFrame }) => {
  if (beat.type !== "stat") return null;
  return (
    <Card durationInFrames={durationInFrames} localFrame={localFrame}>
      {(u) => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: u * 0.17,
              lineHeight: 1,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            {beat.value}
          </div>
          <div
            style={{
              marginTop: u * 0.02,
              fontSize: u * 0.045,
              fontWeight: 700,
            }}
          >
            <Highlighted text={beat.label} />
          </div>
        </div>
      )}
    </Card>
  );
};

const CheckItem: React.FC<{
  text: string;
  index: number;
  durationInFrames: number;
  localFrame: number;
  u: number;
}> = ({ text, index, durationInFrames, localFrame, u }) => {
  const m = useBeatMotion(localFrame, durationInFrames, 6 + index * 7);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: u * 0.03,
        marginTop: index === 0 ? 0 : u * 0.028,
        opacity: m.opacity,
        transform: `translateY(${m.translateY * 0.4}px)`,
      }}
    >
      <svg
        width={u * 0.06}
        height={u * 0.06}
        viewBox="0 0 24 24"
        style={{ flex: "none" }}
      >
        <circle cx="12" cy="12" r="12" fill={ACCENT} />
        <path
          d="M6.5 12.5l3.8 3.8 7.2-8"
          fill="none"
          stroke="#141414"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ fontSize: u * 0.05, fontWeight: 700, lineHeight: 1.15 }}>
        <Highlighted text={text} />
      </div>
    </div>
  );
};

const Checklist: React.FC<Props> = ({ beat, durationInFrames, localFrame }) => {
  if (beat.type !== "checklist") return null;
  return (
    <Card durationInFrames={durationInFrames} localFrame={localFrame}>
      {(u) => (
        <>
          {beat.items.map((item, i) => (
            <CheckItem
              key={i}
              text={item}
              index={i}
              durationInFrames={durationInFrames}
              localFrame={localFrame}
              u={u}
            />
          ))}
        </>
      )}
    </Card>
  );
};

// Screen-space callout: a dot at (x%, y%) with a label above it (3D anchoring comes later)
const Callout: React.FC<Props> = ({
  beat,
  durationInFrames,
  localFrame,
  sceneFrame,
  cam,
}) => {
  const { u, width, height } = useUnit();
  const m = useBeatMotion(localFrame, durationInFrames);
  if (beat.type !== "callout") return null;
  let cx = ((beat.x ?? 50) / 100) * width;
  let cy = ((beat.y ?? 50) / 100) * height;
  if (beat.at && cam) {
    const p = projectToScreen(beat.at, cam, sceneFrame, width, height);
    if (!p.visible) return null; // behind the camera
    cx = p.x;
    cy = p.y;
  }
  const ring = ((localFrame % 45) / 45) * u * 0.05; // looping ring, driven by the frame
  const labelX = Math.min(width * 0.78, Math.max(width * 0.22, cx));
  return (
    <AbsoluteFill style={{ opacity: m.opacity }}>
      <div
        style={{
          position: "absolute",
          left: cx - ring,
          top: cy - ring,
          width: ring * 2,
          height: ring * 2,
          borderRadius: "50%",
          border: `2px solid ${ACCENT}`,
          opacity: 1 - ring / (u * 0.05),
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - u * 0.012,
          top: cy - u * 0.012,
          width: u * 0.024,
          height: u * 0.024,
          borderRadius: "50%",
          background: ACCENT,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: labelX,
          top: cy - u * 0.075,
          transform: `translate(-50%, -100%) translateY(${m.translateY * 0.5}px) scale(${m.scale})`,
          padding: `${u * 0.014}px ${u * 0.03}px`,
          borderRadius: u * 0.03,
          background: PANEL,
          border: `2px solid ${ACCENT}`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: u * 0.04,
          color: "white",
          whiteSpace: "nowrap",
        }}
      >
        <Highlighted text={beat.text} />
      </div>
    </AbsoluteFill>
  );
};

const renderBeat = (p: Props) => {
  switch (p.beat.type) {
    case "title":
      return <Title {...p} />;
    case "tag":
      return <Pill {...p} side="left" />;
    case "badge":
      return <Pill {...p} side="right" />;
    case "quote":
      return <Quote {...p} />;
    case "stat":
      return <Stat {...p} />;
    case "checklist":
      return <Checklist {...p} />;
    case "callout":
      return <Callout {...p} />;
  }
};

// All beats of a scene. Visibility and motion are plain frame math (no nested <Sequence>):
// each beat gets its own local frame = scene frame - beat start frame.
export const BeatLayer: React.FC<{ beats: Beat[]; cam?: Cam }> = ({
  beats,
  cam,
}) => {
  const frame = useCurrentFrame(); // local to the scene
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {beats.map((beat, i) => {
        const from = Math.round(beat.start * fps);
        const durationInFrames = Math.max(
          1,
          Math.round((beat.end - beat.start) * fps),
        );
        const local = frame - from;
        if (local < 0 || local >= durationInFrames) return null;
        return (
          <AbsoluteFill key={i}>
            {renderBeat({
              beat,
              durationInFrames,
              localFrame: local,
              sceneFrame: frame,
              cam,
            })}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

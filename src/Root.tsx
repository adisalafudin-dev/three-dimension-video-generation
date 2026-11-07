import { Composition } from "remotion";

import { TestModel } from "./TestModel";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TestModel"
      component={TestModel}
      durationInFrames={90} // 3s is enough for the spike
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

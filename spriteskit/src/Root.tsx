import React from 'react';
import { Composition } from 'remotion';
import { SkitComp } from './skits/Skit';
import { aiTakingMyJob } from './skits/scripts/aiTakingMyJob';
import { aiTakingMyJobPt2 } from './skits/scripts/aiTakingMyJobPt2';
import type { Skit } from './skits/types';

/** Register all skits here. Adding a new skit = one line. */
const skits: Skit[] = [aiTakingMyJob, aiTakingMyJobPt2];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {skits.map((skit) => (
        <Composition
          key={skit.id}
          id={skit.id}
          component={SkitComp as React.FC<Record<string, unknown>>}
          defaultProps={{ skit } as Record<string, unknown>}
          durationInFrames={Math.round(skit.durationInSeconds * (skit.fps ?? 30))}
          fps={skit.fps ?? 30}
          width={skit.width ?? 1080}
          height={skit.height ?? 1920}
        />
      ))}
    </>
  );
};

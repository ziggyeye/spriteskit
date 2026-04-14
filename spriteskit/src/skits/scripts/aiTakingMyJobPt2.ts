import { staticFile } from 'remotion';
import type { Skit } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';

/**
 * "AI Taking My Job pt 2" — 30s TikTok skit.
 *
 * Beats:
 *   0.0–2.5s   Hook: "he tried to warn them..."
 *   0.2–2.5s   Dave runs in from the left
 *   2.7–5.5s   Dave: "BOSS! Alex is a robot!!"
 *   5.5–7.5s   Gary turns around
 *   7.5–10.5s  Gary: "We know, Dave." (eyes glow)
 *   10.5–11.5s Flash + Dave reacts
 *   11.5–14.5s Dave: "wait... YOU TOO?!"
 *   14.5–16.5s Rosa walks in from the right
 *   16.5–19.5s Rosa: "breakroom's out of coffee" (eyes glow)
 *   19.5–22.0s Dave: "IS ANYONE HERE REAL?!"
 *   22.0–24.5s Gary: "Just you, Dave. Just you."
 *   24.5–30.0s Shake + "EVERYONE IS AI EXCEPT DAVE" + follow CTA
 */

const FLOOR = 1500;
const LEFT_SPOT = 280;
const CENTER_SPOT = 540;
const RIGHT_SPOT = 800;

export const aiTakingMyJobPt2: Skit = {
  id: 'AiTakingMyJobPt2',
  title: 'AI Taking My Job pt 2',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
  background: {
    kind: 'gradient',
    colors: ['#7873f5', '#ff2244'],
  },
  musicUrl: staticFile('music/funk.mp3'),
  musicVolume: 0.35,
  actors: [
    {
      id: 'dave',
      sprite: 'dave',
      name: 'DAVE',
      start: { x: -200, y: FLOOR },
      facing: 'right',
      scale: 1.2,
      hidden: true,
    },
    {
      id: 'gary',
      sprite: 'boss',
      name: 'GARY',
      start: { x: CENTER_SPOT, y: FLOOR },
      facing: 'up',
      scale: 1.4,
    },
    {
      id: 'rosa',
      sprite: 'janitor',
      name: 'ROSA',
      start: { x: 1280, y: FLOOR },
      facing: 'left',
      scale: 1.1,
      hidden: true,
    },
  ],
  timeline: [
    // Opening hook
    {
      type: 'popupText',
      text: 'he tried to\nwarn them...',
      startSec: 0,
      endSec: 2.5,
      y: 0.14,
      color: '#FFEE00',
      rotate: -3,
      size: 110,
    },

    // Dave runs in
    {
      type: 'walk',
      actorId: 'dave',
      to: { x: LEFT_SPOT, y: FLOOR },
      startSec: 0.2,
      endSec: 2.2,
      facing: 'right',
    },
    { type: 'face', actorId: 'dave', direction: 'right', atSec: 2.2 },

    // Dave tells the boss
    {
      type: 'speak',
      actorId: 'dave',
      text: 'BOSS!! Alex is a ROBOT!!',
      emoji: '🤖',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/Qk9TUyEhIEFsZXgg.mp3'),
      startSec: 2.7,
      endSec: 5.5,
    },
    { type: 'emote', actorId: 'dave', emoji: '😰', startSec: 2.7, endSec: 5.5 },

    // Gary slowly turns around
    { type: 'face', actorId: 'gary', direction: 'left', atSec: 5.8 },
    { type: 'face', actorId: 'gary', direction: 'down', atSec: 6.5 },

    // Gary reveal — eyes glow
    { type: 'tint', actorId: 'gary', color: '#ff2244', startSec: 7.3, endSec: 30 },
    { type: 'flash', startSec: 7.3, endSec: 8.0, color: '#ff3355' },
    {
      type: 'speak',
      actorId: 'gary',
      text: 'We know, Dave.',
      voiceId: VOICE_IDS.brian,
      audioUrl: staticFile('voices/V2Uga25vdywgRGF2.mp3'),
      startSec: 7.5,
      endSec: 10.5,
      tint: '#ff4466',
    },

    // Dave reacts
    { type: 'emote', actorId: 'dave', emoji: '😨', startSec: 10.5, endSec: 14.5 },
    {
      type: 'speak',
      actorId: 'dave',
      text: 'wait... YOU TOO?!',
      emoji: '💀',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/d2FpdC4uLiBZT1Ug.mp3'),
      startSec: 11.5,
      endSec: 14.5,
    },

    // Rosa strolls in casually
    {
      type: 'walk',
      actorId: 'rosa',
      to: { x: RIGHT_SPOT, y: FLOOR },
      startSec: 14.5,
      endSec: 16.5,
      facing: 'left',
    },
    { type: 'face', actorId: 'rosa', direction: 'down', atSec: 16.5 },

    // Rosa reveal — casual line, then eyes glow
    { type: 'tint', actorId: 'rosa', color: '#ff2244', startSec: 16.8, endSec: 30 },
    { type: 'flash', startSec: 16.8, endSec: 17.5, color: '#ff3355' },
    {
      type: 'speak',
      actorId: 'rosa',
      text: "breakroom's out of coffee.\nalso I'm an AI.",
      emoji: '☕',
      voiceId: VOICE_IDS.jessica,
      audioUrl: staticFile('voices/YnJlYWtyb29tJ3Mg.mp3'),
      startSec: 16.8,
      endSec: 19.5,
      tint: '#ff4466',
    },

    // Dave loses it
    { type: 'face', actorId: 'dave', direction: 'down', atSec: 19.5 },
    { type: 'emote', actorId: 'dave', emoji: '😭', startSec: 19.5, endSec: 24.5 },
    {
      type: 'speak',
      actorId: 'dave',
      text: 'IS ANYONE HERE REAL?!',
      emoji: '😱',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/SVMgQU5ZT05FIEhF.mp3'),
      startSec: 19.7,
      endSec: 22.0,
    },

    // Gary delivers the final line
    { type: 'face', actorId: 'gary', direction: 'left', atSec: 22.0 },
    {
      type: 'speak',
      actorId: 'gary',
      text: 'Just you, Dave.\nJust you.',
      voiceId: VOICE_IDS.brian,
      audioUrl: staticFile('voices/SnVzdCB5b3UsIERh.mp3'),
      startSec: 22.2,
      endSec: 24.5,
      tint: '#ff4466',
    },

    // Finale — shake + giant text
    { type: 'shake', startSec: 24.5, endSec: 30, intensity: 18 },
    { type: 'flash', startSec: 24.5, endSec: 25.3, color: '#ffffff' },
    {
      type: 'popupText',
      text: 'EVERYONE IS AI\nEXCEPT DAVE',
      startSec: 24.7,
      endSec: 30,
      y: 0.42,
      color: '#FFEE00',
      rotate: -5,
      size: 160,
    },
    {
      type: 'popupText',
      text: 'follow for pt 3 🤖',
      startSec: 27.0,
      endSec: 30,
      y: 0.62,
      color: '#ffffff',
      rotate: 2,
      size: 80,
    },
  ],
};

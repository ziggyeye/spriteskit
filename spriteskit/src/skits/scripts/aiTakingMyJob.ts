import { staticFile } from 'remotion';
import type { Skit } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';

/**
 * "AI Taking My Job" — 30s TikTok skit.
 *
 * Beats:
 *   0.0–2.5s  Dave runs in from the left, frantic
 *   2.5–6.0s  "BRO! AI is taking EVERYONE'S job 😱"
 *   5.0–7.0s  Alex walks in from the right
 *   7.0–10.0s "wait what happened??"
 *   10.0–14.0s Dave: "They replaced Steve. Karen. The intern!"
 *   14.0–17.5s Dave: "I think I'm next 💀"
 *   17.5–20.0s Alex: "...yeah about that"
 *   20.0–22.0s Alex turns, eyes glow (tint) + flash
 *   22.0–26.5s Alex (red bubble): "I've been the AI this whole time, Dave."
 *   26.5–30.0s Huge "PLOT TWIST" popup + shake
 */

const FLOOR = 1500; // baseline y where feet land
const LEFT_SPOT = 340;
const RIGHT_SPOT = 740;

export const aiTakingMyJob: Skit = {
  id: 'AiTakingMyJob',
  title: 'AI Taking My Job',
  durationInSeconds: 30,
  fps: 30,
  width: 1080,
  height: 1920,
  background: {
    kind: 'gradient',
    colors: ['#ff6ec7', '#7873f5'],
  },
  // Optional: Add music for enhanced comedy (see MUSIC_PICKS.md)
  // Recommended: Joyful Rhythm (upbeat, funny)
  // Download: https://pixabay.com/music/funk-joyful-rhythm-walk-funk-513936/
  musicUrl: staticFile('music/funk.mp3'), // Uncomment after downloading
  // musicVolume: 0.4,
  actors: [
    {
      id: 'dave',
      sprite: 'male',
      name: 'DAVE',
      start: { x: -200, y: FLOOR }, // offscreen left
      facing: 'right',
      scale: 1.2,
      hidden: true,
    },
    {
      id: 'alex',
      sprite: 'female',
      name: 'ALEX',
      start: { x: 1280, y: FLOOR }, // offscreen right
      facing: 'left',
      scale: 1.2,
      hidden: true,
    },
  ],
  timeline: [
    // Opening hook popup
    {
      type: 'popupText',
      text: 'POV: your\ncoworker is\nactually AI',
      startSec: 0,
      endSec: 2.5,
      y: 0.14,
      color: '#FFEE00',
      rotate: -3,
      size: 110,
    },

    // Dave runs in from the left
    {
      type: 'walk',
      actorId: 'dave',
      to: { x: LEFT_SPOT, y: FLOOR },
      startSec: 0.2,
      endSec: 2.2,
      facing: 'right',
    },
    { type: 'face', actorId: 'dave', direction: 'down', atSec: 2.2 },

    // Dave freaks out
    {
      type: 'speak',
      actorId: 'dave',
      text: 'BRO!! AI is taking EVERYONE\u2019S job!!',
      emoji: '😱',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/QlJPISEgQUkgaXMg.mp3'),
      startSec: 2.7,
      endSec: 6.2,
    },
    { type: 'emote', actorId: 'dave', emoji: '💦', startSec: 2.7, endSec: 6.2 },

    // Alex strolls in from the right, calm
    {
      type: 'walk',
      actorId: 'alex',
      to: { x: RIGHT_SPOT, y: FLOOR },
      startSec: 5.0,
      endSec: 7.2,
      facing: 'left',
    },
    { type: 'face', actorId: 'alex', direction: 'left', atSec: 7.2 },
    { type: 'face', actorId: 'dave', direction: 'right', atSec: 7.0 },

    // Alex: clueless
    {
      type: 'speak',
      actorId: 'alex',
      text: 'wait what happened?',
      voiceId: VOICE_IDS.jessica,
      audioUrl: staticFile('voices/d2FpdCB3aGF0IGhh.mp3'),
      startSec: 7.4,
      endSec: 10.2,
    },

    // Dave panic-lists
    {
      type: 'speak',
      actorId: 'dave',
      text: 'They replaced Steve.\nAND Karen.\nAND the intern!!',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/VGhleSByZXBsYWNl.mp3'),
      startSec: 10.4,
      endSec: 14.2,
    },
    { type: 'emote', actorId: 'dave', emoji: '😭', startSec: 10.4, endSec: 14.2 },

    // Dave: doom
    {
      type: 'speak',
      actorId: 'dave',
      text: 'i think i\u2019m next bro',
      emoji: '💀',
      voiceId: VOICE_IDS.charlie,
      audioUrl: staticFile('voices/aSB0aGluayBp4oCZ.mp3'),
      startSec: 14.4,
      endSec: 17.6,
    },

    // Alex: suspicious beat
    {
      type: 'speak',
      actorId: 'alex',
      text: '...yeah. about that.',
      voiceId: VOICE_IDS.jessica,
      audioUrl: staticFile('voices/Li4ueWVhaC4gYWJv.mp3'),
      startSec: 17.8,
      endSec: 20.2,
      tint: '#ffcccc',
    },

    // Alex turns to face Dave — eyes-glow tint + flash
    { type: 'face', actorId: 'alex', direction: 'left', atSec: 20.0 },
    { type: 'tint', actorId: 'alex', color: '#ff2244', startSec: 20.2, endSec: 30 },
    { type: 'flash', startSec: 20.3, endSec: 21.2, color: '#ff3355' },

    // Dave: horrified look
    { type: 'face', actorId: 'dave', direction: 'right', atSec: 20.5 },
    { type: 'emote', actorId: 'dave', emoji: '😨', startSec: 20.5, endSec: 26.5 },

    // The reveal
    {
      type: 'speak',
      actorId: 'alex',
      text: 'I\u2019ve BEEN the AI\nthis whole time, Dave.',
      emoji: '🤖',
      voiceId: VOICE_IDS.jessica,
      audioUrl: staticFile('voices/SeKAmXZlIEJFRU4g.mp3'),
      startSec: 22.0,
      endSec: 26.5,
      tint: '#ff4466',
    },

    // Plot twist finale — shake + giant text
    { type: 'shake', startSec: 26.5, endSec: 30, intensity: 18 },
    {
      type: 'popupText',
      text: 'PLOT TWIST',
      startSec: 26.6,
      endSec: 30,
      y: 0.45,
      color: '#FFEE00',
      rotate: -6,
      size: 220,
    },
    {
      type: 'popupText',
      text: 'follow for pt 2 🤖',
      startSec: 28.0,
      endSec: 30,
      y: 0.62,
      color: '#ffffff',
      rotate: 2,
      size: 80,
    },
    { type: 'flash', startSec: 26.5, endSec: 27.3, color: '#ffffff' },
  ],
};

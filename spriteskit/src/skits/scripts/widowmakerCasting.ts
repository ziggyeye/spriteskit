/**
 * WIDOWMAKER — Casting Call Still
 *
 * A single-frame skit used to render a casting-card image for user
 * approval. Three characters under noir spotlight.
 *
 * Render via: npx remotion still WidowmakerCasting out/casting.png --frame=20
 */

import type { Skit } from '../types';

const FLOOR = 1500;

export const widowmakerCasting: Skit = {
  id: 'WidowmakerCasting',
  title: 'WIDOWMAKER — Casting Call',
  durationInSeconds: 2,
  fps: 30,
  width: 1080,
  height: 1920,
  hideSpeechBubbles: true,
  // Deep noir — black with cold blue, like an interrogation room.
  background: {
    kind: 'radial',
    colors: ['#1a1d24', '#020306'],
  },
  // Wider framing for 3 characters. Pulled back further so all three fit.
  defaultCamera: {
    position: [0, 1.55, 6.4],
    lookAt: [0, 1.2, 0],
    fov: 36,
  },
  actors: [
    // OPERATIVE A — "Vesper" — left
    {
      id: 'vesper',
      sprite: 'alex',
      name: 'Vesper',
      start: { x: 240, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarBlouse_Short',
        // Pencil skirt — formal, predatory professional look.
        bottom: 'Clothes_Legs_Skirt_Long',
        hair: 'Hair_ShortBob',
        skinTone: 'Skintone_2',
        // Haircolour_09 is the darkest in the pack (true near-black plum).
        hairColor: 'Haircolour_09',
        topColor: 'Machine_Black',
        legColor: 'Machine_Black',
        shoesColor: 'Machine_Black',
      },
    },
    // HANDLER — "Marin" — center, behind/between (the silent operator)
    {
      id: 'marin',
      sprite: 'boss',
      name: 'Marin',
      start: { x: 540, y: FLOOR },
      facing: 'down',
      scale: 0.95,
      outfit: {
        top: 'Clothes_Top_Sweater_TurtleNeck',
        bottom: 'Clothes_Legs_Pants_Short_Pockets',
        hair: 'Hair_Shave_Buzzcut',
        accessory: 'Accessory_Headphones_black',
        accessoryColor: '#1a1a1a',
        skinTone: 'Skintone_5',
        hairColor: 'Haircolour_08',
        // Cushion_Red reads deep maroon — military-tech vibe.
        topColor: 'Cushion_Red',
        legColor: 'Olive_Sofa',
        shoesColor: 'Machine_Black',
      },
    },
    // OPERATIVE B — "Kessler" — right
    {
      id: 'kessler',
      sprite: 'dave',
      name: 'Kessler',
      start: { x: 840, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarShirt_Long',
        // Standard pants — the disheveled-suit look.
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_SideSweep',
        beard: 'Beard_Lower',
        accessory: 'Accessory_Glasses',
        accessoryColor: '#1a1a1a',
        skinTone: 'Skintone_4',
        // Haircolour_07 — dark brown but visibly distinct from
        // Vesper's plum-black, so the two operatives don't look like
        // they share a stylist.
        hairColor: 'Haircolour_07',
        // Grey top + Olive pants = "wrong suit, slept in it" mark vibe.
        topColor: 'Grey',
        legColor: 'Olive_Sofa',
        shoesColor: 'Machine_Black',
      },
    },
  ],
  timeline: [
    // Calm idles — Vesper poised, Marin crossed-arms watcher, Kessler thinking.
    { type: 'animate', actorId: 'vesper', clip: 'React_Stand_Discussion_1', startSec: 0, endSec: 2, loop: true },
    { type: 'animate', actorId: 'marin', clip: 'React_CrossArms', startSec: 0, endSec: 2, loop: true },
    { type: 'animate', actorId: 'kessler', clip: 'React_Stand_Thinking', startSec: 0, endSec: 2, loop: true },

    // Title card at top.
    { type: 'popupText', text: 'WIDOWMAKER\nCASTING CALL', startSec: 0, endSec: 2, y: 0.08, color: '#ffd76b', size: 100, rotate: 0 },

    // Three names side-by-side, centered with manual spacing.
    { type: 'popupText', text: 'VESPER     MARIN     KESSLER', startSec: 0, endSec: 2, y: 0.82, color: '#ffd76b', size: 52, rotate: 0 },
    { type: 'popupText', text: 'predator   handler   the mark', startSec: 0, endSec: 2, y: 0.88, color: '#e8dccc', size: 38, rotate: 0 },
  ],
};

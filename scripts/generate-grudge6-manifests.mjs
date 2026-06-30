/**
 * Generate per-race GCS manifests pointing at live Grudge CDN GLBs.
 * Run: node scripts/generate-grudge6-manifests.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'manifests');

const CDN = 'https://assets.grudge-studio.com';
const RACES = [
  { id: 'human', name: 'Human', portrait: './assets/portraitImages/female.jpg' },
  { id: 'barbarian', name: 'Barbarian', portrait: './assets/portraitImages/male.jpg' },
  { id: 'elf', name: 'Elf', portrait: './assets/portraitImages/female.jpg' },
  { id: 'dwarf', name: 'Dwarf', portrait: './assets/portraitImages/male.jpg' },
  { id: 'orc', name: 'Orc', portrait: './assets/portraitImages/0n1.jpg' },
  { id: 'undead', name: 'Undead', portrait: './assets/portraitImages/tubby.jpg' },
];

const WEAPON_R = ['sword', 'axe', 'hammer', 'dagger', 'spear', 'mace'];
const WEAPON_L = ['shield', 'bow', 'staff'];

function weaponCollection(ids) {
  return ids.map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    fullDirectory: `${CDN}/models/weapons/${id}.glb`,
  }));
}

function buildRaceManifest(raceId, displayName) {
  return {
    assetsLocation: `${CDN}/`,
    traitsDirectory: 'models/',
    thumbnailsDirectory: './assets/portraitImages/',
    traitIconsDirectorySvg: './assets/icons/',
    displayScale: 1,
    exportScale: 1,
    locked: false,
    requiredTraits: ['body'],
    initialTraits: ['body'],
    randomTraits: ['weapon_r'],
    animationPath: [`${CDN}/models/animations/sword-shield/sword and shield idle.glb`],
    traits: [
      {
        trait: 'body',
        name: 'Body',
        iconSvg: 'slotBody.svg',
        cameraTarget: { distance: 3.2, height: 0.8 },
        collection: [
          {
            id: 'default',
            name: displayName,
            fullDirectory: `${CDN}/models/characters/${raceId}.glb`,
            colorCollection: 'skin',
          },
        ],
      },
      {
        trait: 'weapon_r',
        name: 'Main Hand',
        iconSvg: 'slotRightHand.svg',
        cameraTarget: { distance: 2.8, height: 1 },
        collection: weaponCollection(WEAPON_R),
      },
      {
        trait: 'weapon_l',
        name: 'Off Hand',
        iconSvg: 'slotLeftHand.svg',
        cameraTarget: { distance: 2.8, height: 1 },
        collection: weaponCollection(WEAPON_L),
      },

    ],
    colorCollections: [
      {
        trait: 'skin',
        collection: [
          { id: 'light', name: 'Light', value: '#e8c39e' },
          { id: 'medium', name: 'Medium', value: '#c68642' },
          { id: 'dark', name: 'Dark', value: '#8d5524' },
          { id: 'pale', name: 'Pale', value: '#f5d0a9' },
        ],
      },
      {
        trait: 'armor',
        collection: [
          { id: 'iron', name: 'Iron', value: '#6b7280' },
          { id: 'gold', name: 'Gold', value: '#c9a04e' },
          { id: 'crimson', name: 'Crimson', value: '#8b2020' },
          { id: 'frost', name: 'Frost', value: '#7ec8e3' },
        ],
      },
    ],
  };
}

mkdirSync(OUT, { recursive: true });

for (const race of RACES) {
  const manifest = buildRaceManifest(race.id, race.name);
  const path = join(OUT, `${race.id}.json`);
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  console.log('wrote', path);
}

const rootManifest = {
  characters: RACES.map((r) => ({
    name: r.name,
    description: `Grudge6 ${r.name} — customize body, weapons, and colors.`,
    portrait: r.portrait,
    manifest: `./manifests/${r.id}.json`,
    format: 'glb',
    raceId: r.id,
    faction:
      r.id === 'human' || r.id === 'barbarian' || r.id === 'dwarf'
        ? 'crusade'
        : r.id === 'elf'
          ? 'fabled'
          : 'legion',
  })),
  classes: [
    { id: 'warrior', name: 'Warrior', icon: '⚔️', defaultWeapon: 'sword' },
    { id: 'mage', name: 'Mage', icon: '🔮', defaultWeapon: 'staff' },
    { id: 'ranger', name: 'Ranger', icon: '🏹', defaultWeapon: 'bow' },
    { id: 'worg', name: 'Worge', icon: '🐺', defaultWeapon: 'unarmed' },
  ],
  defaultAnimations: [
    {
      name: 'Idle',
      description: 'Standing idle',
      location: `${CDN}/models/animations/sword-shield/sword and shield idle.glb`,
    },
    {
      name: 'Walk',
      description: 'Walking forward',
      location: `${CDN}/models/animations/sword-shield/sword and shield run.glb`,
    },
    {
      name: 'Attack',
      description: 'Basic attack',
      location: `${CDN}/models/animations/sword-shield/sword and shield attack.glb`,
    },
  ],
};

writeFileSync(join(__dirname, '..', 'public', 'manifest.json'), JSON.stringify(rootManifest, null, 2));
console.log('wrote public/manifest.json');
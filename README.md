<div align="center">

<img src="https://raw.githubusercontent.com/MolochDaGod/GCS/main/public/assets/backgrounds/main-background.jpg" alt="GCS — Grudge Character Studio" width="100%" />

# GCS &mdash; Grudge Character Studio

### The HYDRA-powered 3D character forge for the Grudge Studio universe

**Create it once. Play it everywhere.** Forge a **grudge6** hero in GCS &mdash; race, class, gear, and appearance &mdash; then deploy it straight to your **Grudge ID**. The same character renders across every game in the Grudge Studio fleet.

<br/>

[![Launch GCS](https://img.shields.io/badge/▶_Launch-character.grudge--studio.com-16b195?style=for-the-badge&labelColor=0d0d0d)](https://character.grudge-studio.com)
[![Grudge Studio](https://img.shields.io/badge/Grudge_Studio-grudge--studio.com-0d0d0d?style=for-the-badge)](https://grudge-studio.com)
[![Grudge Warlords](https://img.shields.io/badge/Play-grudgewarlords.com-1a1a1a?style=for-the-badge)](https://grudgewarlords.com)

[![License: MIT](https://img.shields.io/badge/License-MIT-16b195.svg?style=flat-square)](./LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r183-000000?style=flat-square&logo=three.js)](https://threejs.org)
[![VRM](https://img.shields.io/badge/@pixiv-three--vrm-16b195?style=flat-square)](https://github.com/pixiv/three-vrm)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)](https://vitejs.dev)

</div>

---

## Forge your grudge6 hero

GCS is the official **character creator** of Grudge Studio. Point, click, and customize a fully rigged 3D avatar, then **save it to your account** with a single button. Your hero gets a permanent UUID linked to your **Grudge ID**, an optional Solana **cNFT**, and starter gear &mdash; ready to drop into any Grudge Studio game.

<div align="center">

<img src="https://raw.githubusercontent.com/MolochDaGod/GCS/main/public/assets/media/btn_create_character.png" alt="Create Character" width="31%" />
&nbsp;
<img src="https://raw.githubusercontent.com/MolochDaGod/GCS/main/public/assets/media/btn_optimize_character.png" alt="Optimize Character" width="31%" />
&nbsp;
<img src="https://raw.githubusercontent.com/MolochDaGod/GCS/main/public/assets/media/btn_batch_download_character.png" alt="Batch Export" width="31%" />

</div>

---

## The grudge6 races

Six playable races and four classes &mdash; **24 hero combinations** &mdash; all share one rig, so every animation and every piece of gear works on every body.

| Race | Code | Faction |
|------|------|---------|
| Human / Warlord-kin | `WK_` | Crusade |
| Barbarian | `BRB_` | Crusade |
| Elf | `ELF_` | Fabled |
| Dwarf | `DWF_` | Fabled |
| Orc | `ORC_` | Legion |
| Undead | `UD_` | Legion |

**Classes:** Warrior &middot; Mage &middot; Ranger &middot; Worge &nbsp;|&nbsp; **Factions:** Crusade &middot; Fabled &middot; Legion &middot; Wild

> grudge6 race models are streamed as rigged **FBX** from the Grudge CDN (`assets.grudge-studio.com`). Equipment is toggled as prefix-named child meshes (`WK_`, `ELF_`, `ORC_`, &hellip;) &mdash; never geometry swaps &mdash; so armor, weapons, and shields snap on cleanly.

---

## Play it across the fleet

One character. The whole universe. A hero forged in GCS is read by every game through your Grudge ID:

- **[Grudge Warlords](https://grudgewarlords.com)** &mdash; the flagship MMO: islands, crafting, professions, sailing.
- **RTS-Grudge** &mdash; real-time strategy with your roster of grudge6 commanders.
- **Survival, Arena, Dungeon Crawler Quest, Grudge Drive** &mdash; and the rest of the Grudge Studio fleet.

Because the character lives on your account (not in local storage), you log in on **any device** and your hero is there.

---

## GCS Core

GCS is built around a single, framework-agnostic engine &mdash; **`CharacterManager`** (`src/library/characterManager.js`). React is just the UI; the core does the heavy lifting:

- **Trait-based assembly** &mdash; mix and match meshes, colors, and accessories with live preview.
- **VRM / glTF pipeline** &mdash; load, customize, and export standards-compliant avatars (`VRMExporter`).
- **One-click optimization** &mdash; merge skinned meshes + texture atlasing to collapse an avatar down to a **single draw call**.
- **Automatic face culling** &mdash; hide occluded geometry with a custom layer system.
- **Dynamic animation** &mdash; Mixamo retargeting with bone remapping, blinks, look-at, and lip sync.
- **Batch export** &mdash; randomize or generate to a metadata schema for whole collections.
- **Account + chain** &mdash; Grudge ID SSO, character save/sync, and Solana cNFT minting.

### From studio to account &mdash; the deploy flow

```text
Sign in (Grudge ID SSO)
        │
        ▼
Pick race + class  →  Customize (GCS Core / CharacterManager)
        │
        ▼
"Save to Grudge (ID + UUID + cNFT)"
        │
        ▼
api.grudge-studio.com  →  player_characters  (UUID linked to your Grudge ID)
        │
        ▼
Render in any Grudge Studio game
```

---

## Quick start

> **Heads up:** asset packs are kept separate from the program. Pull them into `public/` first.

```bash
# Clone and enter
git clone https://github.com/MolochDaGod/GCS
cd GCS

# Install (legacy peer deps flag avoids React version conflicts)
npm install --legacy-peer-deps

# Pull the default asset pack into public/
npm run get-assets

# Start the dev server (https, --host enabled for LAN/mobile testing)
npm run dev
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HTTPS + network host |
| `npm run build` | Production build to `./build` |
| `npm run serve` | Preview the production build |
| `npm run lint` | ESLint + Prettier checks |
| `npm run test` | Run the Vitest suite |
| `npm run get-assets` | Clone the default asset pack into `public/` |

---

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need (never commit secrets):

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_ASSET_PATH` | VRM/manifest asset directory or CDN | `public/` bundle |
| `VITE_GRUDGE_API` | Grudge backend (accounts, characters, inventory) | `https://api.grudge-studio.com` |
| `VITE_AUTH_GATEWAY` | Grudge ID SSO login | `https://id.grudge-studio.com` |
| `VITE_ASSET_CDN` | 3D assets, textures, manifests | `https://assets.grudge-studio.com` |
| `VITE_OPENSEA_KEY` | NFT trait verification (optional) | &mdash; |
| `VITE_HELIUS_KEY` | Solana RPC (optional) | &mdash; |

---

## Tech stack

**Frontend** React 19 + Vite 7 &middot; **3D** Three.js (WebGL) + `@pixiv/three-vrm` &middot; **State** Zustand &middot; **Styling** CSS Modules + Styled Components &middot; **Chain** ethers.js (Ethereum) + `@solana/web3.js` & Metaplex (Solana cNFTs) &middot; **Auth** Grudge ID SSO (HYDRA).

---

## Project layout

```text
src/
├── library/          # GCS Core — CharacterManager, VRM export, optimization, animation
├── services/         # grudgeAPI.js — accounts, characters, inventory, cNFT
├── context/          # SceneContext, AccountContext, ViewContext, Audio, Language
├── pages/            # Landing → Create → Appearance → Save → Mint flow
├── components/       # UI: BrandBar, panels, menus, file drop
└── security/         # Blockchain wrapper + security config
```

---

## Credits

Forged by **Racalvin The Pirate King** for **[Grudge Studio](https://grudge-studio.com)**.

Built on the open-source [CharacterStudio](https://github.com/M3-org/CharacterStudio) by Webaverse / M3-org &mdash; shoutout to m00n, memelotsqui, boomboxhead, jin, and every contributor.

Released under the [MIT License](./LICENSE).

<div align="center">

**[character.grudge-studio.com](https://character.grudge-studio.com)** &mdash; build your grudge6 hero today.

</div>

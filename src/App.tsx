/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AbilityPrepScreen } from './components/AbilityPrepModal';
import { GameHUD } from './components/GameHUD';
import { HeroSelectModal, NpcDialogueModal } from './components/LobbyModals';
import { RotateDeviceOverlay } from './components/RotateDeviceOverlay';
import { EventModal, PauseModal, RunSummaryModal, UpgradeModal } from './components/RunModals';
import {
  getActiveLoadoutFromProgression,
  isLoadoutComplete,
  loadPlayerProgression,
  PlayerProgression,
  updateProgressionLoadout,
  updateProgressionRunComplete,
} from './game/data/progression';
import { GameEngine } from './game/engine/GameEngine';
import { createHubRoom } from './game/systems/DungeonGenerator';
import {
  DungeonEventDef,
  EquippedLoadout,
  HUDTeachingSnapshot,
  HubStationId,
  LobbyNpcDef,
  RoomType,
  RunSummary,
  ScreenState,
  UpgradeOption,
} from './game/types';
import { lockLandscapeOrientation } from './utils/fullscreen';

const INITIAL_HUD: HUDTeachingSnapshot = {
  hp: 150,
  maxHp: 150,
  ultEnergy: 100,
  level: 1,
  xp: 0,
  xpToNext: 50,
  gold: 0,
  roomIndex: 0,
  totalRooms: 1,
  roomName: 'Moss & Lantern Sanctuary',
  roomType: RoomType.HUB,
  roomCleared: true,
  enemiesAlive: 0,
  cooldowns: {},
  dodgeCooldown: 0,
  lordOfDecayRemaining: 0,
  regenRemaining: 0,
  boneColossusRemaining: 0,
  ribcageShieldRemaining: 0,
  boneStormRemaining: 0,
  windrunnerRemaining: 0,
  poisonedBladesRemaining: 0,
  kingOfThievesRemaining: 0,
  minionsActive: 0,
  bossInfo: null,
  nearbyStation: null,
  nearbyChest: false,
  portalReady: true,
};

type LobbyModalState =
  | { kind: 'HERO_SELECT' }
  | { kind: 'SKILL_PREP'; intent: 'SAVE_LOBBY' | 'ENTER_DUNGEON' }
  | { kind: 'NPC'; npc: LobbyNpcDef }
  | null;

export default function App() {
  // Automatically enter the playable Main Lobby on launch (no separate title screen or landing page)
  const [progression, setProgression] = useState<PlayerProgression>(() => loadPlayerProgression());
  const [loadout, setLoadout] = useState<EquippedLoadout>(() =>
    getActiveLoadoutFromProgression(loadPlayerProgression())
  );
  const [screen, setScreen] = useState<ScreenState>(ScreenState.HUB);
  const [runKey, setRunKey] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const portraitRef = useRef<boolean>(false);
  const loadoutRef = useRef<EquippedLoadout>(loadout);
  const progressionRef = useRef<PlayerProgression>(progression);

  loadoutRef.current = loadout;
  progressionRef.current = progression;

  const lobbyNpcs = useMemo(() => createHubRoom().npcs || [], []);

  const [hud, setHud] = useState<HUDTeachingSnapshot>(() => ({
    ...INITIAL_HUD,
    gold: progression.totalGold,
  }));
  const [lobbyModal, setLobbyModal] = useState<LobbyModalState>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeOption[] | null>(null);
  const [activeEvent, setActiveEvent] = useState<DungeonEventDef | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const handlePortraitChange = useCallback((isPortrait: boolean) => {
    portraitRef.current = isPortrait;
    engineRef.current?.setOrientationPaused(isPortrait);
  }, []);

  const enterDungeonRun = useCallback((confirmedLoadout: EquippedLoadout) => {
    void lockLandscapeOrientation();
    setLobbyModal(null);
    setIsPaused(false);
    setLoadout(confirmedLoadout);
    setProgression((prev) => updateProgressionLoadout(prev, confirmedLoadout));
    setScreen(ScreenState.DUNGEON);
    setRunKey((k) => k + 1);
  }, []);

  const handleHubStationInteract = useCallback(
    (stationId: HubStationId) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (stationId === 'HERO_SELECT_AREA') {
        engine.setPaused(true);
        setLobbyModal({ kind: 'HERO_SELECT' });
        return;
      }

      if (stationId === 'SKILL_PREP_AREA') {
        engine.setPaused(true);
        setLobbyModal({ kind: 'SKILL_PREP', intent: 'SAVE_LOBBY' });
        return;
      }

      if (stationId === 'DUNGEON_PORTAL') {
        const current = loadoutRef.current;
        if (isLoadoutComplete(current)) {
          enterDungeonRun(current);
        } else {
          engine.setPaused(true);
          setLobbyModal({ kind: 'SKILL_PREP', intent: 'ENTER_DUNGEON' });
        }
        return;
      }

      if (stationId.startsWith('NPC_')) {
        const npc = lobbyNpcs.find((n) => n.stationId === stationId);
        if (npc) {
          engine.setPaused(true);
          setLobbyModal({ kind: 'NPC', npc });
        }
      }
    },
    [enterDungeonRun, lobbyNpcs]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const mode = screen === ScreenState.HUB ? 'HUB' : 'DUNGEON';
    setIsPaused(false);
    setLobbyModal(null);
    setUpgradeChoices(null);
    setActiveEvent(null);
    setRunSummary(null);

    const engine = new GameEngine(
      canvasRef.current,
      mode,
      loadoutRef.current,
      {
        onHudUpdate: (snap) => setHud(snap),
        onRequestUpgrade: (choices) => setUpgradeChoices(choices),
        onRequestEvent: (ev) => setActiveEvent(ev),
        onHubStationInteract: handleHubStationInteract,
        onPauseToggle: () => {
          setIsPaused((prev) => {
            const next = !prev;
            engine.setPaused(next);
            return next;
          });
        },
        onRunFinished: (summary) => {
          engine.setPaused(true);
          setProgression((prev) => updateProgressionRunComplete(prev, summary));
          setRunSummary(summary);
        },
      },
      progressionRef.current.totalGold
    );

    engine.setOrientationPaused(portraitRef.current);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, runKey, handleHubStationInteract]);

  return (
    <div className="relative w-screen h-[100dvh] bg-[#0F1419] overflow-hidden select-none touch-none">
      {/* Portrait Rotate-Device Overlay (Pauses Gameplay & Prevents Portrait Stretching/Cropping) */}
      <RotateDeviceOverlay onPortraitChange={handlePortraitChange} />

      {/* Live Playable 2D Canvas (Main Lobby or Dungeon Run) */}
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      {/* Mobile Landscape MOBA HUD & Controls */}
      <GameHUD
        snapshot={hud}
        loadout={loadout}
        onBasicAttackHeld={(held) => engineRef.current?.setTouchAttackHeld(held)}
        onNormalSkill={(slot, aimAngle) => engineRef.current?.triggerNormalSkill(slot, aimAngle)}
        onUltimate={(aimAngle) => engineRef.current?.triggerUltimate(aimAngle)}
        onBeginSkillAim={(abilityId) => engineRef.current?.beginSkillAimHold(abilityId)}
        onSteerSkillAim={(abilityId, angle) => engineRef.current?.steerSkillAim(abilityId, angle)}
        onCancelSkillAim={() => engineRef.current?.cancelSkillAimHold()}
        onDodge={() => engineRef.current?.triggerDodge()}
        onInteract={() => engineRef.current?.triggerInteract()}
        onJoystickMove={(dx, dy) => engineRef.current?.setJoystickVector(dx, dy)}
        onPause={() => {
          if (lobbyModal || upgradeChoices || activeEvent || runSummary) return;
          setIsPaused(true);
          engineRef.current?.setPaused(true);
        }}
      />

      {/* LOBBY HERO SELECTION OVERLAY (Updates hero in-place without resetting lobby exploration) */}
      {lobbyModal?.kind === 'HERO_SELECT' && (
        <HeroSelectModal
          currentHeroId={loadout.heroId}
          onClose={() => {
            setLobbyModal(null);
            engineRef.current?.setPaused(false);
          }}
          onConfirmHero={(selectedHeroId) => {
            const nextProgDraft: PlayerProgression = {
              ...progression,
              selectedHeroId,
            };
            const nextLoadout = getActiveLoadoutFromProgression(nextProgDraft);
            setLoadout(nextLoadout);
            setProgression((prev) => updateProgressionLoadout(prev, nextLoadout));
            engineRef.current?.updateLoadoutInHub(nextLoadout);
            setLobbyModal(null);
            engineRef.current?.setPaused(false);
          }}
        />
      )}

      {/* LOBBY SKILL PREPARATION OVERLAY (Compact 5 Normal + 3 Ultimate Grid, Zero Portraits) */}
      {lobbyModal?.kind === 'SKILL_PREP' && (
        <AbilityPrepScreen
          initialLoadout={loadout}
          intent={lobbyModal.intent}
          onCancel={() => {
            setLobbyModal(null);
            engineRef.current?.setPaused(false);
          }}
          onConfirm={(confirmedLoadout) => {
            if (lobbyModal.intent === 'ENTER_DUNGEON') {
              enterDungeonRun(confirmedLoadout);
            } else {
              setLoadout(confirmedLoadout);
              setProgression((prev) => updateProgressionLoadout(prev, confirmedLoadout));
              engineRef.current?.updateLoadoutInHub(confirmedLoadout);
              setLobbyModal(null);
              engineRef.current?.setPaused(false);
            }
          }}
        />
      )}

      {/* LOBBY NPC DIALOGUE CARD */}
      {lobbyModal?.kind === 'NPC' && (
        <NpcDialogueModal
          npc={lobbyModal.npc}
          onClose={() => {
            setLobbyModal(null);
            engineRef.current?.setPaused(false);
          }}
        />
      )}

      {/* DUNGEON UPGRADE SELECTION */}
      {upgradeChoices && (
        <UpgradeModal
          choices={upgradeChoices}
          onSelect={(opt) => {
            engineRef.current?.applyUpgrade(opt);
            setUpgradeChoices(null);
            engineRef.current?.setPaused(false);
          }}
        />
      )}

      {/* DUNGEON EVENT ENCOUNTER */}
      {activeEvent && engineRef.current && (
        <EventModal
          eventDef={activeEvent}
          player={engineRef.current.getPlayerState()}
          onResolve={(msg) => {
            engineRef.current?.completeEventChoice(msg);
            setActiveEvent(null);
            engineRef.current?.setPaused(false);
          }}
        />
      )}

      {/* PAUSE MODAL */}
      {isPaused && !lobbyModal && !upgradeChoices && !activeEvent && !runSummary && (
        <PauseModal
          mode={screen === ScreenState.HUB ? 'HUB' : 'DUNGEON'}
          loadout={loadout}
          player={engineRef.current ? engineRef.current.getPlayerState() : null}
          onResume={() => {
            setIsPaused(false);
            engineRef.current?.setPaused(false);
          }}
          onReturnHub={() => {
            setIsPaused(false);
            setScreen(ScreenState.HUB);
            setRunKey((k) => k + 1);
          }}
        />
      )}

      {/* DUNGEON RUN SUMMARY (Preserves hero, skills, and progression when returning to Lobby) */}
      {runSummary && (
        <RunSummaryModal
          summary={runSummary}
          onPlayAgain={() => {
            setRunSummary(null);
            enterDungeonRun(loadout);
          }}
          onReturnHub={() => {
            setRunSummary(null);
            setScreen(ScreenState.HUB);
            setRunKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, Music, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { audio } from '../game/audio/AudioManager';
import { getAbilityById } from '../game/data/abilities';
import { getHeroById } from '../game/data/heroes';
import { EquippedLoadout, HUDTeachingSnapshot, RoomType, SkillAimStyle } from '../game/types';
import { useFullscreenState } from '../utils/fullscreen';
import { AbilityIcon } from './AbilityIcon';

interface GameHUDProps {
  snapshot: HUDTeachingSnapshot;
  loadout: EquippedLoadout;
  onBasicAttackHeld: (held: boolean) => void;
  onNormalSkill: (slot: 0 | 1, aimAngle?: number) => void;
  onUltimate: (aimAngle?: number) => void;
  onBeginSkillAim: (abilityId: string) => void;
  onSteerSkillAim: (abilityId: string, angle: number | null) => void;
  onCancelSkillAim: () => void;
  onDodge: () => void;
  onInteract: () => void;
  onJoystickMove: (dx: number, dy: number) => void;
  onPause: () => void;
}

export function GameHUD({
  snapshot,
  loadout,
  onBasicAttackHeld,
  onNormalSkill,
  onUltimate,
  onBeginSkillAim,
  onSteerSkillAim,
  onCancelSkillAim,
  onDodge,
  onInteract,
  onJoystickMove,
  onPause,
}: GameHUDProps) {
  const [sfxOn, setSfxOn] = useState(audio.isSfxEnabled());
  const [musicOn, setMusicOn] = useState(audio.isMusicEnabled());
  const [attackPressed, setAttackPressed] = useState(false);
  const [dodgePressed, setDodgePressed] = useState(false);
  const [holdingAnySkill, setHoldingAnySkill] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const cancelZoneRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, supported: fullscreenSupported, toggleFullscreen } = useFullscreenState();

  // Floating Virtual Joystick state (Bottom-Left Thumb Zone)
  const joyZoneRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);
  const joyOrigin = useRef<{ x: number; y: number }>({ x: 88, y: 120 });
  const [joyVisual, setJoyVisual] = useState<{
    active: boolean;
    baseX: number;
    baseY: number;
    knobX: number;
    knobY: number;
    angle: number;
  }>({
    active: false,
    baseX: 84,
    baseY: 84, // offset from bottom-left when idle
    knobX: 0,
    knobY: 0,
    angle: 0,
  });

  const attackPointerId = useRef<number | null>(null);

  const hero = getHeroById(loadout.heroId);
  const basicAttackDef = getAbilityById(hero.basicAttackId);
  const skill1 = getAbilityById(loadout.normalSkills[0]);
  const skill2 = getAbilityById(loadout.normalSkills[1]);
  const ult = getAbilityById(loadout.ultimate);

  const cd1 = snapshot.cooldowns[skill1.id] || 0;
  const cd2 = snapshot.cooldowns[skill2.id] || 0;
  const cdUlt = snapshot.cooldowns[ult.id] || 0;
  const ultReady = snapshot.ultEnergy >= 100 && cdUlt <= 0;

  const hpPct = Math.max(0, Math.min(100, (snapshot.hp / Math.max(1, snapshot.maxHp)) * 100));
  const energyPct = Math.max(0, Math.min(100, snapshot.ultEnergy));

  // --- LEFT SIDE: FLOATING 360° VIRTUAL JOYSTICK HANDLERS ---
  const MAX_JOY_RADIUS = 46;

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== null) return;
    e.stopPropagation();
    audio.unlock();

    const zone = joyZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();

    // Clamp floating joystick center comfortably inside the touch zone so ring never clips off-screen
    const pad = 62;
    const localX = Math.max(pad, Math.min(rect.width - pad, e.clientX - rect.left));
    const localY = Math.max(pad, Math.min(rect.height - pad, e.clientY - rect.top));

    joyPointerId.current = e.pointerId;
    joyOrigin.current = { x: rect.left + localX, y: rect.top + localY };
    e.currentTarget.setPointerCapture(e.pointerId);

    const dx = e.clientX - joyOrigin.current.x;
    const dy = e.clientY - joyOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(MAX_JOY_RADIUS, dist);
    const angle = dist > 1 ? Math.atan2(dy, dx) : 0;
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setJoyVisual({
      active: true,
      baseX: localX,
      baseY: rect.height - localY,
      knobX: kx,
      knobY: ky,
      angle,
    });
    onJoystickMove(kx / MAX_JOY_RADIUS, ky / MAX_JOY_RADIUS);
  };

  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();

    const dx = e.clientX - joyOrigin.current.x;
    const dy = e.clientY - joyOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(MAX_JOY_RADIUS, dist);
    const angle = dist > 0.5 ? Math.atan2(dy, dx) : joyVisual.angle;
    const kx = dist > 0.5 ? Math.cos(angle) * clampedDist : 0;
    const ky = dist > 0.5 ? Math.sin(angle) * clampedDist : 0;

    setJoyVisual((prev) => ({
      ...prev,
      knobX: kx,
      knobY: ky,
      angle,
    }));
    onJoystickMove(kx / MAX_JOY_RADIUS, ky / MAX_JOY_RADIUS);
  };

  const handleJoyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    joyPointerId.current = null;
    setJoyVisual({
      active: false,
      baseX: 84,
      baseY: 78,
      knobX: 0,
      knobY: 0,
      angle: 0,
    });
    onJoystickMove(0, 0);
  };

  // --- RIGHT SIDE: BASIC ATTACK HOLD HANDLERS ---
  const handleAttackDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    audio.unlock();
    attackPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setAttackPressed(true);
    onBasicAttackHeld(true);
  };

  const handleAttackUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (attackPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    attackPointerId.current = null;
    setAttackPressed(false);
    onBasicAttackHeld(false);
  };

  const showInteractPrompt = Boolean(snapshot.nearbyStation || snapshot.nearbyChest);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* GPU-Composited Screen Rim Aura during Ultimate Transformations or Active Protective Skills */}
      {snapshot.lordOfDecayRemaining > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[3px] border-emerald-400/45 rounded-none animate-aura-breathe"
        />
      )}
      {snapshot.boneColossusRemaining > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[3px] border-sky-400/50 rounded-none animate-aura-breathe"
        />
      )}
      {snapshot.lordOfDecayRemaining <= 0 &&
        snapshot.boneColossusRemaining <= 0 &&
        snapshot.regenRemaining > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 border-2 border-lime-300/35 rounded-none animate-aura-breathe"
          />
        )}
      {snapshot.boneColossusRemaining <= 0 && snapshot.ribcageShieldRemaining > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-2 border-cyan-300/35 rounded-none animate-aura-breathe"
        />
      )}
      {snapshot.kingOfThievesRemaining > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-[3px] border-fuchsia-400/45 rounded-none animate-aura-breathe"
        />
      )}
      {snapshot.kingOfThievesRemaining <= 0 && snapshot.windrunnerRemaining > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 border-2 border-teal-300/35 rounded-none animate-aura-breathe"
        />
      )}

      {/* COMPACT LANDSCAPE TOP BAR (Wide & Unobtrusive) */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Compact MOBA Hero Status Strip */}
        <div className="pointer-events-auto bg-[#141920]/88 backdrop-blur-sm border border-white/12 rounded-2xl px-3 py-2 flex items-center gap-3 shadow-lg">
          {/* Level Crest */}
          <div
            className={`w-9 h-9 rounded-full ${
              hero.id === 'skeleton'
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : hero.id === 'goblin'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
            } border flex items-center justify-center font-mono text-xs font-bold shrink-0 tabular-nums`}
          >
            {snapshot.level}
          </div>

          {/* Stacked HP & Ultimate Energy Bars */}
          <div className="w-36 sm:w-44 space-y-1.5">
            <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-emerald-400 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${hpPct / 100})` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white drop-shadow tabular-nums">
                {snapshot.hp}/{snapshot.maxHp}
              </span>
            </div>

            <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-amber-400 transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${energyPct / 100})` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-amber-100 drop-shadow tabular-nums">
                {snapshot.ultEnergy}%
              </span>
            </div>
          </div>

          {/* Gold & Active Buffs */}
          <div className="hidden xs:flex sm:flex flex-col items-end font-mono text-[11px] tabular-nums text-amber-300 pl-1">
            <span>{snapshot.gold}g</span>
            {snapshot.lordOfDecayRemaining > 0 ? (
              <span className="text-[10px] text-emerald-300">{snapshot.lordOfDecayRemaining.toFixed(0)}s</span>
            ) : snapshot.boneColossusRemaining > 0 ? (
              <span className="text-[10px] text-sky-300">{snapshot.boneColossusRemaining.toFixed(0)}s</span>
            ) : snapshot.ribcageShieldRemaining > 0 ? (
              <span className="text-[10px] text-cyan-200">{snapshot.ribcageShieldRemaining.toFixed(0)}s</span>
            ) : snapshot.boneStormRemaining > 0 ? (
              <span className="text-[10px] text-sky-200">{snapshot.boneStormRemaining.toFixed(0)}s</span>
            ) : snapshot.regenRemaining > 0 ? (
              <span className="text-[10px] text-emerald-300">+{snapshot.regenRemaining.toFixed(0)}s</span>
            ) : snapshot.kingOfThievesRemaining > 0 ? (
              <span className="text-[10px] text-fuchsia-300">{snapshot.kingOfThievesRemaining.toFixed(0)}s</span>
            ) : snapshot.windrunnerRemaining > 0 ? (
              <span className="text-[10px] text-teal-300">{snapshot.windrunnerRemaining.toFixed(0)}s</span>
            ) : snapshot.poisonedBladesRemaining > 0 ? (
              <span className="text-[10px] text-lime-300">{snapshot.poisonedBladesRemaining.toFixed(0)}s</span>
            ) : snapshot.minionsActive > 0 ? (
              <span className="text-[10px] text-amber-200">×{snapshot.minionsActive}</span>
            ) : (
              <span className="text-[10px] text-slate-400">
                {hpPct > 30 ? 'OK' : 'LOW'}
              </span>
            )}
          </div>
        </div>

        {/* Top-Center: Slim Room Status or Boss Health Bar */}
        <div className="flex flex-col items-center max-w-[44vw]">
          {snapshot.bossInfo ? (
            <div className="bg-[#141920]/90 backdrop-blur-sm border border-amber-400/40 rounded-2xl px-4 py-1.5 w-[240px] sm:w-[340px] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="font-display font-bold text-amber-200 truncate">
                  {snapshot.bossInfo.name}
                </span>
                <span className="text-slate-300 shrink-0 ml-2">
                  {snapshot.bossInfo.hp}/{snapshot.bossInfo.maxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-rose-500 transition-transform duration-150 origin-left"
                  style={{
                    transform: `scaleX(${Math.max(0, snapshot.bossInfo.hp / snapshot.bossInfo.maxHp)})`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-[#141920]/80 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-slate-200 whitespace-nowrap overflow-hidden">
              <span className="font-display font-semibold text-white truncate">
                {snapshot.roomName}
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="font-mono text-[11px] text-emerald-300 tabular-nums">
                {snapshot.roomType === RoomType.HUB
                  ? 'Sanctuary'
                  : snapshot.roomCleared
                  ? `${snapshot.roomIndex}/${snapshot.totalRooms} Clear`
                  : `${snapshot.roomIndex}/${snapshot.totalRooms} (${snapshot.enemiesAlive})`}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Compact Circular Utility Buttons (>=44px Touch Targets) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">

          <button
            type="button"
            aria-label={musicOn ? 'Mute Music' : 'Enable Music'}
            onClick={() => {
              const next = !musicOn;
              setMusicOn(next);
              audio.setMusicEnabled(next);
            }}
            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-transform active:scale-92 cursor-pointer ${
              musicOn
                ? 'bg-[#1B222A]/90 border-white/15 text-amber-300'
                : 'bg-[#141920]/80 border-white/10 text-slate-500'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label={sfxOn ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            onClick={() => {
              const next = !sfxOn;
              setSfxOn(next);
              audio.setSfxEnabled(next);
            }}
            className="w-11 h-11 rounded-full bg-[#1B222A]/90 border border-white/15 text-slate-200 flex items-center justify-center transition-transform active:scale-92 cursor-pointer"
          >
            {sfxOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {fullscreenSupported && (
            <button
              type="button"
              aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              onClick={() => {
                audio.playUiClick();
                toggleFullscreen();
              }}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-transform active:scale-92 cursor-pointer ${
                isFullscreen
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-[#1B222A]/90 border-white/15 text-slate-200'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            aria-label="Pause Game"
            onClick={() => {
              audio.playUiClick();
              onPause();
            }}
            className="w-11 h-11 rounded-full bg-[#1B222A]/90 border border-white/15 text-slate-200 flex items-center justify-center transition-transform active:scale-92 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM MOBA CONTROLS ROW */}
      <div className="relative w-full flex items-end justify-between">
        {/* LEFT SIDE: FLOATING 360-DEGREE VIRTUAL JOYSTICK ZONE */}
        <div
          ref={joyZoneRef}
          onPointerDown={handleJoyPointerDown}
          onPointerMove={handleJoyPointerMove}
          onPointerUp={handleJoyPointerUp}
          onPointerCancel={handleJoyPointerUp}
          className="pointer-events-auto relative w-[38vw] max-w-[290px] h-[48vh] max-h-[220px] min-w-[168px] min-h-[156px] touch-none"
        >
          {/* Floating Joystick Outer Ring */}
          <div
            className={`pointer-events-none absolute w-[112px] h-[112px] -ml-[56px] -mb-[56px] rounded-full border-2 flex items-center justify-center transition-opacity duration-150 ${
              joyVisual.active
                ? 'bg-slate-950/65 border-emerald-400/65 opacity-100 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                : 'bg-slate-950/40 border-white/20 opacity-80'
            }`}
            style={{
              left: `${joyVisual.baseX}px`,
              bottom: `${joyVisual.baseY}px`,
            }}
          >
            {/* Subtle 4-way runic compass ticks */}
            <span className="absolute top-1.5 w-1 h-1.5 rounded-full bg-white/30" />
            <span className="absolute bottom-1.5 w-1 h-1.5 rounded-full bg-white/30" />
            <span className="absolute left-1.5 w-1.5 h-1 rounded-full bg-white/30" />
            <span className="absolute right-1.5 w-1.5 h-1 rounded-full bg-white/30" />

            {/* Smooth 360° Thumb Puck */}
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg ${
                joyVisual.active
                  ? 'bg-emerald-400 border-emerald-100 text-slate-950 scale-105'
                  : 'bg-[#232D38]/90 border-emerald-300/50 text-emerald-300'
              }`}
              style={{
                transform: `translate3d(${joyVisual.knobX}px, ${joyVisual.knobY}px, 0)`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-current opacity-80" />
            </div>
          </div>
        </div>

        {/* CENTER-BOTTOM PROXIMITY INTERACTION PROMPT (Tappable on Mobile Landscape) */}
        {showInteractPrompt && !holdingAnySkill && (
          <div className="pointer-events-auto mb-2 px-2 flex justify-center">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                audio.unlock();
                onInteract();
              }}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#161D26]/92 border border-amber-300/60 text-white shadow-[0_6px_20px_rgba(0,0,0,0.55)] flex items-center gap-2 active:scale-95 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
            >
              <AbilityIcon iconKey="interact" className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-display text-xs font-bold text-amber-200">
                {snapshot.nearbyStation ? snapshot.nearbyStation.label : 'Open Chest'}
              </span>
              {snapshot.nearbyStation && (
                <>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-[11px] text-slate-200">{snapshot.nearbyStation.sublabel}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* RIGHT SIDE: MOBILE LEGENDS: BANG BANG RADIAL SKILL & ATTACK CLUSTER */}
        {/* Container is pointer-events-none so touching empty space around buttons NEVER triggers accidental clicks */}
        <div className="pointer-events-none relative w-[264px] h-[214px] shrink-0">
          {/* Release-to-Cast Cancel Target (appears above skill cluster while holding a skill button) */}
          {holdingAnySkill && (
            <div
              ref={cancelZoneRef}
              style={{ right: '146px', bottom: '176px' }}
              className={`pointer-events-none absolute w-11 h-11 rounded-full border-2 flex items-center justify-center transition-transform duration-100 ${
                cancelHover
                  ? 'scale-115 bg-rose-500/90 border-rose-200 text-white shadow-[0_0_20px_rgba(244,63,94,0.65)]'
                  : 'scale-100 bg-slate-950/75 border-rose-400/55 text-rose-300'
              }`}
            >
              <X className="w-5 h-5" />
            </div>
          )}

          {/* Contextual Interact Button (Appears smoothly when near Chest / Altar / Shrine) */}
          {showInteractPrompt && !holdingAnySkill && (
            <button
              type="button"
              aria-label="Interact"
              onPointerDown={(e) => {
                e.stopPropagation();
                audio.unlock();
                onInteract();
              }}
              style={{ right: '176px', bottom: '86px' }}
              className="pointer-events-auto absolute w-12 h-12 rounded-full bg-amber-400 active:scale-90 text-slate-950 border-2 border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center justify-center transition-transform duration-100 touch-none cursor-pointer"
            >
              <AbilityIcon iconKey="interact" className="w-6 h-6" />
            </button>
          )}

          {/* Secondary Utility Button: Dodge (Battle-Spell Slot to the left of Skill 1) */}
          <button
            type="button"
            aria-label="Dodge"
            disabled={snapshot.dodgeCooldown > 0.02}
            onPointerDown={(e) => {
              e.stopPropagation();
              audio.unlock();
              setDodgePressed(true);
              onDodge();
            }}
            onPointerUp={() => setDodgePressed(false)}
            onPointerLeave={() => setDodgePressed(false)}
            onPointerCancel={() => setDodgePressed(false)}
            style={{ right: '204px', bottom: '18px' }}
            className={`pointer-events-auto absolute w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center overflow-hidden transition-transform duration-100 touch-none ${
              snapshot.dodgeCooldown > 0.02
                ? 'bg-[#141920]/90 border-white/15 text-slate-500 cursor-not-allowed'
                : 'bg-[#1E2732]/92 border-sky-300/55 text-sky-200 cursor-pointer shadow-md'
            } ${dodgePressed ? 'scale-88' : 'scale-100'}`}
          >
            <AbilityIcon iconKey="dodge" className="w-5 h-5" />
            {snapshot.dodgeCooldown > 0.02 && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-mono text-xs font-bold text-white tabular-nums">
                {snapshot.dodgeCooldown.toFixed(1)}
              </div>
            )}
          </button>

          {/* RADIAL ABILITY 1: Equipped Normal Skill 1 (Lower-Left Arc, ~184°) */}
          <MobaSkillCircleButton
            abilityId={skill1.id}
            ariaLabel={skill1.name}
            iconKey={skill1.iconKey}
            aimStyle={skill1.aimStyle}
            cooldownRemaining={cd1}
            cooldownMax={skill1.cooldown}
            isUltimate={false}
            ultEnergy={100}
            stylePos={{ right: '134px', bottom: '16px' }}
            sizePx={58}
            cancelZoneRef={cancelZoneRef}
            onHoldStateChange={(held, overCancel) => {
              setHoldingAnySkill(held);
              setCancelHover(overCancel);
            }}
            onBeginHold={() => onBeginSkillAim(skill1.id)}
            onReleaseCast={(angle) => onNormalSkill(0, angle)}
            onCancelCast={onCancelSkillAim}
            onSteerAim={(angle) => onSteerSkillAim(skill1.id, angle)}
          />

          {/* RADIAL ABILITY 2: Equipped Normal Skill 2 (Diagonal Mid-Left Arc, ~135°) */}
          <MobaSkillCircleButton
            abilityId={skill2.id}
            ariaLabel={skill2.name}
            iconKey={skill2.iconKey}
            aimStyle={skill2.aimStyle}
            cooldownRemaining={cd2}
            cooldownMax={skill2.cooldown}
            isUltimate={false}
            ultEnergy={100}
            stylePos={{ right: '104px', bottom: '101px' }}
            sizePx={58}
            cancelZoneRef={cancelZoneRef}
            onHoldStateChange={(held, overCancel) => {
              setHoldingAnySkill(held);
              setCancelHover(overCancel);
            }}
            onBeginHold={() => onBeginSkillAim(skill2.id)}
            onReleaseCast={(angle) => onNormalSkill(1, angle)}
            onCancelCast={onCancelSkillAim}
            onSteerAim={(angle) => onSteerSkillAim(skill2.id, angle)}
          />

          {/* RADIAL ABILITY 3: Equipped Ultimate (Upper-Arc Apex, ~85° — Visually Distinct Ornate Frame) */}
          <MobaSkillCircleButton
            abilityId={ult.id}
            ariaLabel={ult.name}
            iconKey={ult.iconKey}
            aimStyle={ult.aimStyle}
            cooldownRemaining={cdUlt}
            cooldownMax={ult.cooldown}
            isUltimate={true}
            ultEnergy={snapshot.ultEnergy}
            ultReady={ultReady}
            stylePos={{ right: '28px', bottom: '132px' }}
            sizePx={66}
            cancelZoneRef={cancelZoneRef}
            onHoldStateChange={(held, overCancel) => {
              setHoldingAnySkill(held);
              setCancelHover(overCancel);
            }}
            onBeginHold={() => onBeginSkillAim(ult.id)}
            onReleaseCast={(angle) => onUltimate(angle)}
            onCancelCast={onCancelSkillAim}
            onSteerAim={(angle) => onSteerSkillAim(ult.id, angle)}
          />

          {/* PRIMARY LARGE CIRCULAR BASIC ATTACK BUTTON (Bottom-Right Corner Anchor) */}
          <button
            type="button"
            aria-label={basicAttackDef.name}
            onPointerDown={handleAttackDown}
            onPointerUp={handleAttackUp}
            onPointerCancel={handleAttackUp}
            style={{ right: '10px', bottom: '10px' }}
            className={`pointer-events-auto absolute w-[88px] h-[88px] rounded-full border-[3px] flex items-center justify-center transition-transform duration-90 touch-none cursor-pointer ${
              attackPressed
                ? hero.id === 'skeleton'
                  ? 'scale-91 bg-sky-400 border-white text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.65)]'
                  : hero.id === 'goblin'
                  ? 'scale-91 bg-amber-400 border-white text-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.65)]'
                  : 'scale-91 bg-emerald-400 border-white text-slate-950 shadow-[0_0_28px_rgba(52,211,153,0.65)]'
                : hero.id === 'skeleton'
                ? 'scale-100 bg-gradient-to-br from-[#1C2C3B] to-[#131D28] border-sky-400/80 text-sky-100 shadow-[0_6px_24px_rgba(0,0,0,0.6)]'
                : hero.id === 'goblin'
                ? 'scale-100 bg-gradient-to-br from-[#332A15] to-[#1F180A] border-amber-400/80 text-amber-200 shadow-[0_6px_24px_rgba(0,0,0,0.6)]'
                : 'scale-100 bg-gradient-to-br from-[#1F3332] to-[#152026] border-emerald-400/80 text-emerald-200 shadow-[0_6px_24px_rgba(0,0,0,0.6)]'
            }`}
          >
            {/* Inner decorative cozy runic ring */}
            <span
              className={`pointer-events-none absolute inset-1.5 rounded-full border ${
                hero.id === 'skeleton'
                  ? 'border-sky-300/30'
                  : hero.id === 'goblin'
                  ? 'border-amber-300/30'
                  : 'border-emerald-300/30'
              }`}
            />
            <AbilityIcon iconKey={basicAttackDef.iconKey} className="w-10 h-10" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MobaSkillCircleButtonProps {
  abilityId: string;
  ariaLabel: string;
  iconKey: string;
  aimStyle: SkillAimStyle;
  cooldownRemaining: number;
  cooldownMax: number;
  isUltimate: boolean;
  ultEnergy: number;
  ultReady?: boolean;
  stylePos: React.CSSProperties;
  sizePx: number;
  cancelZoneRef: React.RefObject<HTMLDivElement | null>;
  onHoldStateChange: (held: boolean, overCancel: boolean) => void;
  onBeginHold: () => void;
  onReleaseCast: (aimAngle?: number) => void;
  onCancelCast: () => void;
  onSteerAim: (angle: number | null) => void;
}

function MobaSkillCircleButton({
  ariaLabel,
  iconKey,
  aimStyle,
  cooldownRemaining,
  cooldownMax,
  isUltimate,
  ultEnergy,
  ultReady = false,
  stylePos,
  sizePx,
  cancelZoneRef,
  onHoldStateChange,
  onBeginHold,
  onReleaseCast,
  onCancelCast,
  onSteerAim,
}: MobaSkillCircleButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [aimAngle, setAimAngle] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  const downPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isManualDragRef = useRef<boolean>(false);
  const aimAngleRef = useRef<number | null>(null);
  const overCancelRef = useRef<boolean>(false);

  const onCooldown = cooldownRemaining > 0.04;
  const lockedByEnergy = isUltimate && ultEnergy < 100 && !onCooldown;
  const disabled = onCooldown || lockedByEnergy;

  const cdFraction = onCooldown ? Math.min(1, cooldownRemaining / Math.max(0.1, cooldownMax)) : 0;

  // SVG Ring Math for Cooldown & Ultimate Energy Charge
  const strokeR = sizePx / 2 - 3.5;
  const circumference = 2 * Math.PI * strokeR;
  const energyDashOffset = circumference * (1 - Math.max(0, Math.min(100, ultEnergy)) / 100);
  const cdDashOffset = circumference * (1 - cdFraction);

  const isPointInCancelZone = (clientX: number, clientY: number): boolean => {
    const cancelEl = cancelZoneRef.current;
    if (!cancelEl) return false;
    const rect = cancelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.hypot(clientX - cx, clientY - cy) <= 28;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    audio.unlock();
    if (disabled) return;

    downPointRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    pointerIdRef.current = e.pointerId;
    isManualDragRef.current = false;
    aimAngleRef.current = null;
    overCancelRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);

    setPressed(true);
    setAimAngle(null);
    setDragOffset({ x: 0, y: 0 });
    onHoldStateChange(true, false);
    // Enter Hold-to-Aim state ONLY — skill casts upon release (handlePointerUp)!
    onBeginHold();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();

    const overCancel = isPointInCancelZone(e.clientX, e.clientY);
    if (overCancel !== overCancelRef.current) {
      overCancelRef.current = overCancel;
      onHoldStateChange(true, overCancel);
    }

    const dx = e.clientX - downPointRef.current.x;
    const dy = e.clientY - downPointRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxDrag = 34;

    // Require >12px intentional drag from touch-down before switching from Tap Auto-Target to Manual Aim
    if (dist > 12) {
      isManualDragRef.current = true;
    }

    if (isManualDragRef.current) {
      const clamped = Math.min(maxDrag, dist);
      const dragA = Math.atan2(dy, dx);
      setDragOffset({
        x: Math.cos(dragA) * clamped,
        y: Math.sin(dragA) * clamped,
      });

      if (aimStyle !== 'SELF') {
        aimAngleRef.current = dragA;
        setAimAngle(dragA);
        onSteerAim(dragA);
      }
    }
  };

  const finishGesture = (shouldCast: boolean) => {
    const finalAngle = isManualDragRef.current ? aimAngleRef.current : null;
    const cancelled = !shouldCast || overCancelRef.current;

    pointerIdRef.current = null;
    isManualDragRef.current = false;
    aimAngleRef.current = null;
    overCancelRef.current = false;

    setPressed(false);
    setAimAngle(null);
    setDragOffset({ x: 0, y: 0 });
    onHoldStateChange(false, false);
    onSteerAim(null);

    if (cancelled) {
      onCancelCast();
    } else {
      // Cast ONLY upon releasing the skill button! If tapped (finalAngle === null), auto-targets nearest enemy.
      onReleaseCast(finalAngle ?? undefined);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    finishGesture(true);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    finishGesture(false);
  };

  const cdDisplay =
    cooldownRemaining >= 10 ? Math.ceil(cooldownRemaining).toString() : cooldownRemaining.toFixed(1);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        ...stylePos,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
      }}
      className={`pointer-events-auto absolute rounded-full flex items-center justify-center transition-transform duration-95 touch-none ${
        pressed ? 'scale-94 ring-2 ring-emerald-300/80' : isUltimate && ultReady ? 'animate-ult-crown' : 'scale-100'
      } ${
        isUltimate
          ? ultReady
            ? 'bg-gradient-to-br from-[#3D2C14] to-[#23190D] border-[2.5px] border-amber-300 text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.55)] cursor-pointer'
            : 'bg-[#191B22]/92 border-2 border-amber-500/30 text-amber-200/45 cursor-not-allowed'
          : disabled
          ? 'bg-[#161B22]/92 border-2 border-white/12 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-br from-[#1E2D31] to-[#162026] border-2 border-emerald-400/75 text-emerald-200 shadow-lg cursor-pointer'
      }`}
    >
      {/* MOBA Hold-to-Aim Outer Wheel when holding skill button */}
      {pressed && (
        <span
          className="pointer-events-none absolute -inset-4 rounded-full border border-emerald-300/45 bg-emerald-400/10"
          aria-hidden="true"
        />
      )}

      {/* Distinctive Ultimate Cardinal Crown Diamonds */}
      {isUltimate && (
        <>
          <span
            className={`pointer-events-none absolute -top-1 w-2 h-2 rotate-45 ${
              ultReady ? 'bg-amber-300' : 'bg-amber-500/40'
            }`}
          />
          <span
            className={`pointer-events-none absolute -bottom-1 w-2 h-2 rotate-45 ${
              ultReady ? 'bg-amber-300' : 'bg-amber-500/40'
            }`}
          />
        </>
      )}

      {/* Radial SVG Ring for Ultimate Energy Charge OR Cooldown Sweep */}
      <svg
        width={sizePx}
        height={sizePx}
        className="pointer-events-none absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        {isUltimate && !onCooldown && ultEnergy < 100 && (
          <>
            <circle
              cx={sizePx / 2}
              cy={sizePx / 2}
              r={strokeR}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3.5"
            />
            <circle
              cx={sizePx / 2}
              cy={sizePx / 2}
              r={strokeR}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={energyDashOffset}
              strokeLinecap="round"
            />
          </>
        )}

        {onCooldown && (
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={strokeR}
            fill="none"
            stroke={isUltimate ? '#FBBF24' : '#34D399'}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={cdDashOffset}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Pure Skill Icon (Zero Text Labels During Gameplay) */}
      <AbilityIcon iconKey={iconKey} className={isUltimate ? 'w-7 h-7' : 'w-6 h-6'} />

      {/* Live Directional Aim Puck when holding & dragging to aim */}
      {pressed && (aimAngle !== null || Math.hypot(dragOffset.x, dragOffset.y) > 4) && (
        <span
          className="pointer-events-none absolute w-3.5 h-3.5 rounded-full bg-emerald-300 border border-white shadow"
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          }}
        />
      )}

      {/* Cooldown Timer Directly Over Skill Icon */}
      {onCooldown && (
        <div className="pointer-events-none absolute inset-0 rounded-full bg-slate-950/76 flex items-center justify-center font-mono text-sm font-bold text-white tabular-nums">
          {cdDisplay}
        </div>
      )}

      {/* Ultimate Energy Percentage Badge when Charging */}
      {lockedByEnergy && (
        <div className="pointer-events-none absolute bottom-1 font-mono text-[10px] font-bold text-amber-300/90 tabular-nums">
          {ultEnergy}%
        </div>
      )}
    </button>
  );
}

import { Maximize2, Minimize2 } from 'lucide-react';
import { audio } from '../game/audio/AudioManager';
import { getAbilityById } from '../game/data/abilities';
import { getHeroById } from '../game/data/heroes';
import { getPassiveById } from '../game/data/passives';
import {
  DungeonEventDef,
  EquippedLoadout,
  PlayerState,
  RunSummary,
  UpgradeOption,
} from '../game/types';
import { useFullscreenState } from '../utils/fullscreen';

interface UpgradeModalProps {
  choices: UpgradeOption[];
  onSelect: (opt: UpgradeOption) => void;
}

export function UpgradeModal({ choices, onSelect }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto bg-[#1A2027] border border-white/12 rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-6">
        <div className="space-y-1 text-center">
          <div className="text-xs font-medium text-emerald-300">Room Cleared · Sanctuary Blessing</div>
          <h2 className="font-display text-xl sm:text-3xl font-bold text-white">
            Choose One Upgrade
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Strengthen your hero’s strikes, skills, or vitality for the deeper crypt chambers ahead.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {choices.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                audio.playEquip();
                onSelect(opt);
              }}
              className="text-left p-5 rounded-2xl bg-[#222A34] hover:bg-[#2A3441] border border-white/10 hover:border-emerald-400/70 transition-all flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="text-xs font-medium text-emerald-300">{opt.category}</div>
                <h3 className="font-display text-lg font-bold text-white">{opt.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>
              </div>

              {opt.synergyLabel ? (
                <div className="text-[11px] text-amber-300/90 pt-3 border-t border-white/10">
                  {opt.synergyLabel}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 pt-3 border-t border-white/10">
                  Select Upgrade
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EventModalProps {
  eventDef: DungeonEventDef;
  player: PlayerState;
  onResolve: (message: string) => void;
}

export function EventModal({ eventDef, player, onResolve }: EventModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl max-h-[92dvh] overflow-y-auto bg-[#1A2027] border border-white/12 rounded-2xl p-5 sm:p-7 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-amber-300">Crypt Encounter · Current Gold: {player.gold}</div>
          <h2 className="font-display text-2xl font-bold text-white">{eventDef.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{eventDef.description}</p>
        </div>

        <div className="space-y-3">
          {eventDef.choices.map((ch, idx) => {
            const allowed = ch.canChoose ? ch.canChoose(player) : true;
            return (
              <button
                key={idx}
                type="button"
                disabled={!allowed}
                onClick={() => {
                  if (!allowed) return;
                  const msg = ch.resolve(player);
                  onResolve(msg);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  allowed
                    ? 'bg-[#222A34] hover:bg-[#2B3642] border-white/12 hover:border-amber-400/60 cursor-pointer'
                    : 'bg-[#171C22] border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="font-semibold text-sm text-white">{ch.label}</div>
                <div className="text-xs text-slate-400 mt-1">{ch.effectText}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PauseModalProps {
  mode: 'HUB' | 'DUNGEON';
  loadout: EquippedLoadout;
  player: PlayerState | null;
  onResume: () => void;
  onReturnHub: () => void;
}

export function PauseModal({
  mode,
  loadout,
  player,
  onResume,
  onReturnHub,
}: PauseModalProps) {
  const hero = getHeroById(loadout.heroId);
  const passives = hero.passiveIds.map((pid) => getPassiveById(pid));
  const s1 = getAbilityById(loadout.normalSkills[0]);
  const s2 = getAbilityById(loadout.normalSkills[1]);
  const ult = getAbilityById(loadout.ultimate);
  const { isFullscreen, supported: fullscreenSupported, toggleFullscreen } = useFullscreenState();

  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#1A2027] border border-white/12 rounded-2xl p-5 sm:p-7 space-y-4 sm:space-y-5">
        <div className="space-y-1 text-center">
          <div className="text-xs text-slate-400">
            {mode === 'HUB' ? 'Sanctuary Hub' : 'Dungeon Expedition'} · {hero.name}
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Game Paused</h2>
        </div>

        {player && (
          <div className="bg-[#222A34] rounded-xl p-4 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between font-mono tabular-nums">
              <span>Attack Damage: {player.stats.attackDamage}</span>
              <span>Attack Speed: {Math.round(player.stats.attackSpeed * 100)}%</span>
            </div>
            <div className="flex justify-between font-mono tabular-nums">
              <span>Skill Power: {Math.round(player.stats.skillPower * 100)}%</span>
              <span>Crit Chance: {Math.round(player.stats.critChance * 100)}%</span>
            </div>
            <div className="pt-2 border-t border-white/10 text-slate-400">
              Equipped: {s1.name} · {s2.name} · {ult.name}
            </div>
            {passives.length > 0 && (
              <div className="text-slate-400">
                Passives: {passives.map((p) => p.name).join(' · ')}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              audio.playUiClick();
              onResume();
            }}
            className="w-full py-3 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
          >
            Resume Game
          </button>

          {fullscreenSupported && (
            <button
              type="button"
              onClick={() => {
                audio.playUiClick();
                toggleFullscreen();
              }}
              className="w-full py-3 text-sm font-semibold text-slate-200 bg-[#262F3A] hover:bg-[#313D4B] border border-white/10 rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}</span>
            </button>
          )}

          {mode === 'DUNGEON' && (
            <button
              type="button"
              onClick={() => {
                audio.playUiClick();
                onReturnHub();
              }}
              className="w-full min-h-[44px] py-3 text-sm font-semibold text-slate-200 bg-[#262F3A] hover:bg-[#313D4B] border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Return to Main Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface RunSummaryModalProps {
  summary: RunSummary;
  onPlayAgain: () => void;
  onReturnHub: () => void;
}

export function RunSummaryModal({
  summary,
  onPlayAgain,
  onReturnHub,
}: RunSummaryModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl max-h-[92dvh] overflow-y-auto bg-[#1A2027] border border-white/15 rounded-2xl p-5 sm:p-7 space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className={`text-xs font-semibold ${summary.victory ? 'text-amber-300' : 'text-rose-400'}`}>
            {summary.victory ? 'Sanctum Cleansed · Dungeon Victory' : 'Expedition Ended'}
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            {summary.victory ? 'Victory in the Crypts!' : 'Defeated in the Crypts'}
          </h2>
          <p className="text-sm text-slate-300">
            {summary.victory
              ? 'The Mossbound Crypt Warden bows in respect as warm lantern light fills the ancient sanctum.'
              : 'Friendly tavern spirits carry you safely back to the hearthfire to recover for the next descent.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-white/10 font-mono tabular-nums">
          <div>
            <div className="text-xs text-slate-400 font-sans">Rooms Cleared</div>
            <div className="text-lg font-bold text-white">
              {summary.roomsCleared} / {summary.totalRooms}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Foes Defeated</div>
            <div className="text-lg font-bold text-emerald-300">{summary.enemiesDefeated}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Damage Dealt</div>
            <div className="text-lg font-bold text-white">{summary.damageDealt}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Gold Earned</div>
            <div className="text-lg font-bold text-amber-300">{summary.goldCollected}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Hero Level</div>
            <div className="text-lg font-bold text-white">Lv.{summary.levelReached}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Run Time</div>
            <div className="text-lg font-bold text-white">{summary.durationSec}s</div>
          </div>
        </div>

        {summary.upgradesPicked.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Blessings Collected</div>
            <div className="text-xs text-slate-200 leading-relaxed">
              {summary.upgradesPicked.join(' · ')}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              audio.playUiClick();
              onReturnHub();
            }}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-slate-200 bg-[#262F3A] hover:bg-[#313D4B] border border-white/10 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Return to Lobby
          </button>
          <button
            type="button"
            onClick={() => {
              audio.playUiClick();
              onPlayAgain();
            }}
            className="min-h-[44px] px-6 py-2.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

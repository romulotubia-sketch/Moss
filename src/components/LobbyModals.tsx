import { useState } from 'react';
import { Check, Lock, MessageCircle, Shield, Skull, Sparkles, Swords, X } from 'lucide-react';
import { audio } from '../game/audio/AudioManager';
import { HERO_REGISTRY } from '../game/data/heroes';
import { getPassiveById } from '../game/data/passives';
import { LobbyNpcDef } from '../game/types';
import { AbilityIcon } from './AbilityIcon';

interface HeroSelectModalProps {
  currentHeroId: string;
  onClose: () => void;
  onConfirmHero: (heroId: string) => void;
}

export function HeroSelectModal({
  currentHeroId,
  onClose,
  onConfirmHero,
}: HeroSelectModalProps) {
  const [draftHeroId, setDraftHeroId] = useState<string>(currentHeroId);
  const selectedHero = HERO_REGISTRY.find((h) => h.id === draftHeroId) || HERO_REGISTRY[0];
  const heroPassives = selectedHero.passiveIds.map((pid) => getPassiveById(pid));

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 select-none">
      <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col bg-[#161C23] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Compact Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-white truncate">
              Hero Selection
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Choose an available sanctuary hero · Updates immediately in the lobby
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Hero Selection"
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-[#202833] active:scale-95 border border-white/10 text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Compact Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3">
          {/* Horizontal Hero List / Grid (No oversized portraits) */}
          <div className="grid grid-cols-3 gap-2.5">
            {HERO_REGISTRY.map((hero) => {
              const isSelected = hero.id === draftHeroId;
              const isActiveInLobby = hero.id === currentHeroId;

              return (
                <button
                  key={hero.id}
                  type="button"
                  disabled={!hero.unlocked}
                  onClick={() => {
                    if (!hero.unlocked) return;
                    audio.playEquip();
                    setDraftHeroId(hero.id);
                  }}
                  className={`min-h-[84px] p-2.5 sm:p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-colors ${
                    !hero.unlocked
                      ? 'bg-[#13181F] border-white/5 opacity-55 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#1D2D2A] border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.16)] cursor-pointer'
                      : 'bg-[#1D252F] border-white/10 active:bg-[#25303D] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/15"
                        style={{ backgroundColor: `${hero.accentColor}22`, color: hero.accentColor }}
                      >
                        {!hero.unlocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : hero.id === 'zombie' ? (
                          <Swords className="w-3.5 h-3.5" />
                        ) : hero.id === 'skeleton' ? (
                          <Skull className="w-3.5 h-3.5" />
                        ) : hero.id === 'goblin' ? (
                          <AbilityIcon iconKey="twin_daggers" className="w-4 h-4" />
                        ) : hero.id === 'ember_fox' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : (
                          <Shield className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="font-display text-sm font-bold text-white truncate">
                        {hero.name}
                      </span>
                    </div>

                    {isSelected && hero.unlocked && (
                      <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                  </div>

                  <div className="text-[11px] text-slate-300 truncate">{hero.subtitle}</div>

                  <div className="text-[10px] font-mono tabular-nums text-slate-400">
                    {!hero.unlocked
                      ? 'Locked · Future Update'
                      : isActiveInLobby
                      ? 'Active in Lobby'
                      : 'Available'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Concise Selected Hero Description & Compact Stats Strip */}
          <div className="bg-[#1D252F] border border-white/10 rounded-xl p-3 space-y-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-sm font-bold text-white truncate">
                {selectedHero.name} <span className="font-sans font-normal text-xs text-slate-400">· {selectedHero.title}</span>
              </div>
              <span className="text-[11px] text-emerald-300 shrink-0">
                5 Skills · 3 Ultimates · 2 Passives
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-snug">{selectedHero.lore}</p>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 font-mono tabular-nums">
              <div>
                <div className="font-sans text-[10px] text-slate-400">Max HP</div>
                <div className="text-xs font-bold text-emerald-300">
                  {selectedHero.id === 'zombie'
                    ? `${selectedHero.baseStats.maxHp + 20} (+20)`
                    : selectedHero.baseStats.maxHp}
                </div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-slate-400">Attack</div>
                <div className="text-xs font-bold text-white">{selectedHero.baseStats.attackDamage}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-slate-400">Move Spd</div>
                <div className="text-xs font-bold text-sky-300">{selectedHero.baseStats.moveSpeed}</div>
              </div>
              <div>
                <div className="font-sans text-[10px] text-slate-400">Crit Rate</div>
                <div className="text-xs font-bold text-amber-300">
                  {selectedHero.id === 'skeleton'
                    ? `${Math.round((selectedHero.baseStats.critChance + 0.1) * 100)}% (+10%)`
                    : `${Math.round(selectedHero.baseStats.critChance * 100)}%`}
                </div>
              </div>
            </div>
          </div>

          {/* Innate Passive Abilities Section (Always Active, Never Occupy Skill Slots) */}
          {heroPassives.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span className="font-semibold text-slate-200">
                  Innate Passives · Always Active
                </span>
                <span>Occupy 0 Skill Slots</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {heroPassives.map((pas) => (
                  <div
                    key={pas.id}
                    className="bg-[#19222C] border border-white/10 rounded-xl p-2.5 flex items-start gap-2.5"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/15 mt-0.5"
                      style={{
                        backgroundColor: `${pas.accentColor}20`,
                        color: pas.accentColor,
                      }}
                    >
                      <AbilityIcon iconKey={pas.iconKey} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-display text-xs font-bold text-white truncate">
                        {pas.name}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        {pas.description}
                      </p>
                      <div
                        className="text-[10px] font-mono tabular-nums"
                        style={{ color: pas.accentColor }}
                      >
                        {pas.gameplayEffect}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer Confirmation */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0 bg-[#13181E]">
          <button
            type="button"
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-300 bg-[#202833] border border-white/10 active:scale-96 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedHero.unlocked}
            onClick={() => {
              if (!selectedHero.unlocked) return;
              audio.playEquip();
              onConfirmHero(selectedHero.id);
            }}
            className="min-h-[44px] px-5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 active:scale-96 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
          >
            Confirm Hero
          </button>
        </div>
      </div>
    </div>
  );
}

interface NpcDialogueModalProps {
  npc: LobbyNpcDef;
  onClose: () => void;
}

export function NpcDialogueModal({ npc, onClose }: NpcDialogueModalProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const total = npc.dialogueLines.length;

  return (
    <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-xl bg-[#161C23]/96 border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/15 shrink-0"
              style={{ backgroundColor: `${npc.accentColor}22`, color: npc.accentColor }}
            >
              <MessageCircle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-white truncate">{npc.name}</h3>
              <div className="text-[11px] text-slate-400 truncate">
                {npc.role} · Tip {lineIndex + 1} of {total}
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Dialogue"
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-[#202833] border border-white/10 text-slate-300 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed min-h-[44px]">
          “{npc.dialogueLines[lineIndex]}”
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-white/10">
          {total > 1 && (
            <button
              type="button"
              onClick={() => {
                audio.playUiClick();
                setLineIndex((prev) => (prev + 1) % total);
              }}
              className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-200 bg-[#222B37] border border-white/12 active:scale-96 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
            >
              Next Tip
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="min-h-[44px] px-5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 active:scale-96 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

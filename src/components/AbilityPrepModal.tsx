import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { audio } from '../game/audio/AudioManager';
import { getAbilityById } from '../game/data/abilities';
import { getHeroById } from '../game/data/heroes';
import { getPassiveById } from '../game/data/passives';
import { AbilityDefinition, EquippedLoadout } from '../game/types';
import { AbilityIcon } from './AbilityIcon';

interface AbilityPrepScreenProps {
  initialLoadout: EquippedLoadout;
  intent: 'SAVE_LOBBY' | 'ENTER_DUNGEON';
  onCancel: () => void;
  onConfirm: (loadout: EquippedLoadout) => void;
}

export function AbilityPrepScreen({
  initialLoadout,
  intent,
  onCancel,
  onConfirm,
}: AbilityPrepScreenProps) {
  const hero = getHeroById(initialLoadout.heroId);
  const normalPool = hero.normalSkillIds.map((id) => getAbilityById(id));
  const ultPool = hero.ultimateIds.map((id) => getAbilityById(id));
  const activePassives = hero.passiveIds.map((id) => getPassiveById(id));

  // Supports selecting AND deselecting abilities while strictly preventing >2 normals or >1 ultimate
  const [selectedNormals, setSelectedNormals] = useState<string[]>(() =>
    initialLoadout.normalSkills.filter((id) => Boolean(id) && hero.normalSkillIds.includes(id))
  );
  const [selectedUlt, setSelectedUlt] = useState<string | null>(() =>
    initialLoadout.ultimate && hero.ultimateIds.includes(initialLoadout.ultimate)
      ? initialLoadout.ultimate
      : null
  );
  const [ruleHint, setRuleHint] = useState<string | null>(
    intent === 'ENTER_DUNGEON'
      ? 'Equip 2 Normal Skills and 1 Ultimate before entering the dungeon.'
      : null
  );

  const toggleNormalSkill = (skill: AbilityDefinition) => {
    const existingIdx = selectedNormals.indexOf(skill.id);
    if (existingIdx !== -1) {
      audio.playUiClick();
      setSelectedNormals(selectedNormals.filter((id) => id !== skill.id));
      setRuleHint(null);
      return;
    }

    if (selectedNormals.length >= 2) {
      audio.playUiClick();
      setRuleHint('Maximum 2 Normal Skills equipped. Tap an active skill to deselect it first.');
      return;
    }

    audio.playEquip();
    setSelectedNormals([...selectedNormals, skill.id]);
    setRuleHint(null);
  };

  const toggleUltimate = (ult: AbilityDefinition) => {
    if (selectedUlt === ult.id) {
      audio.playUiClick();
      setSelectedUlt(null);
      setRuleHint(null);
      return;
    }

    if (selectedUlt !== null) {
      audio.playUiClick();
      setRuleHint('Maximum 1 Ultimate equipped. Tap your active ultimate to deselect it first.');
      return;
    }

    audio.playEquip();
    setSelectedUlt(ult.id);
    setRuleHint(null);
  };

  const isReady =
    selectedNormals.length === 2 &&
    selectedNormals[0] !== selectedNormals[1] &&
    Boolean(selectedUlt);

  return (
    <div className="fixed inset-0 z-40 bg-black/72 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3.5 select-none">
      <div className="w-full max-w-4xl max-h-[94dvh] flex flex-col bg-[#151B22] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Compact Functional Top Header (Zero portraits, zero banners) */}
        <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-2 bg-[#12171D] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-display text-sm sm:text-base font-bold text-white truncate">
              Skill Preparation · {hero.name}
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-slate-300 shrink-0">
              Skills {selectedNormals.length}/2 · Ult {selectedUlt ? 1 : 0}/1
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Close Skill Preparation"
              onClick={() => {
                audio.playUiClick();
                onCancel();
              }}
              className="w-11 h-11 rounded-xl bg-[#202833] border border-white/10 text-slate-300 flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!isReady}
              onClick={() => {
                if (!isReady || !selectedUlt) return;
                audio.playEquip();
                onConfirm({
                  heroId: hero.id,
                  normalSkills: [selectedNormals[0], selectedNormals[1]],
                  ultimate: selectedUlt,
                });
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-bold transition-transform whitespace-nowrap shrink-0 ${
                isReady
                  ? 'bg-emerald-400 text-slate-950 active:scale-96 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {intent === 'ENTER_DUNGEON' ? 'Confirm & Enter' : 'Save Skills'}
            </button>
          </div>
        </div>

        {/* Compact Always-Active Passives Strip (0 Skill Slots Occupied) */}
        {activePassives.length > 0 && (
          <div className="px-3.5 py-1.5 bg-[#11161C] border-b border-white/8 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 shrink-0">
            <div className="flex items-center gap-3 min-w-0 truncate">
              <span className="text-slate-400">Active Passives:</span>
              {activePassives.map((p, idx) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 truncate">
                  {idx > 0 && <span className="text-slate-600">·</span>}
                  <span style={{ color: p.accentColor }} className="font-semibold">
                    {p.name}
                  </span>
                </span>
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-500 shrink-0">Always Active</span>
          </div>
        )}

        {/* Inline Feedback Strip (only when rule message or incomplete slot count) */}
        {ruleHint && (
          <div className="px-3.5 py-1.5 bg-amber-500/12 border-b border-amber-400/25 text-[11px] text-amber-200 shrink-0">
            {ruleHint}
          </div>
        )}

        {/* Scrollable Compact Grids: 5 Normal Skills + 3 Ultimates */}
        <div className="p-3 sm:p-3.5 overflow-y-auto space-y-3">
          {/* SECTION 1: 5 NORMAL SKILLS */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Normal Skills (Equip 2 of 5)</span>
              <span>Tap to select or deselect</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {normalPool.map((skill) => {
                const slotIdx = selectedNormals.indexOf(skill.id);
                const isEquipped = slotIdx !== -1;
                const lockedOut = !isEquipped && selectedNormals.length >= 2;

                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleNormalSkill(skill)}
                    className={`min-h-[96px] p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-colors cursor-pointer ${
                      isEquipped
                        ? 'bg-[#1B2D2A] border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.16)]'
                        : lockedOut
                        ? 'bg-[#181F27] border-white/8 opacity-65'
                        : 'bg-[#1C242E] border-white/10 active:bg-[#242F3C]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isEquipped
                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                            : 'bg-slate-900/80 border-white/10 text-slate-300'
                        }`}
                      >
                        <AbilityIcon iconKey={skill.iconKey} className="w-4 h-4" />
                      </span>

                      <span
                        className={`text-[10px] font-mono font-bold tabular-nums ${
                          isEquipped ? 'text-emerald-300' : 'text-slate-500'
                        }`}
                      >
                        {isEquipped ? `Slot ${slotIdx + 1}` : `${skill.cooldown}s`}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-display text-xs font-bold text-white leading-tight line-clamp-1">
                        {skill.name}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                        {skill.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: 3 ULTIMATE ABILITIES */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-amber-200">Ultimate Abilities (Equip 1 of 3)</span>
              <span>Requires 100% Soul Energy</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ultPool.map((ult) => {
                const isEquipped = selectedUlt === ult.id;
                const lockedOut = !isEquipped && selectedUlt !== null;

                return (
                  <button
                    key={ult.id}
                    type="button"
                    onClick={() => toggleUltimate(ult)}
                    className={`min-h-[88px] p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-colors cursor-pointer ${
                      isEquipped
                        ? 'bg-[#2B2418] border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.16)]'
                        : lockedOut
                        ? 'bg-[#181F27] border-white/8 opacity-65'
                        : 'bg-[#1C242E] border-white/10 active:bg-[#242F3C]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isEquipped
                              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                              : 'bg-slate-900/80 border-white/10 text-amber-200/80'
                          }`}
                        >
                          <AbilityIcon iconKey={ult.iconKey} className="w-4 h-4" />
                        </span>
                        <span className="font-display text-xs font-bold text-white truncate">
                          {ult.name}
                        </span>
                      </div>

                      {isEquipped ? (
                        <Check className="w-4 h-4 text-amber-300 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                          {ult.cooldown}s
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                      {ult.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

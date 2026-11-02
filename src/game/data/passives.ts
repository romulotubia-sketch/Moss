import { PassiveDefinition } from '../types';

export const PASSIVE_REGISTRY: Record<string, PassiveDefinition> = {
  // --- ZOMBIE PASSIVES (Always Active on Zombie) ---
  zombie_passive_resilience: {
    id: 'zombie_passive_resilience',
    heroId: 'zombie',
    name: 'Undead Resilience',
    iconKey: 'passive_resilience',
    accentColor: '#4ADE80',
    description:
      "Zombie's decaying physiology endures heavy punishment and continuously mends injuries over time.",
    gameplayEffect:
      '+20 Bonus Max HP and regenerates 2 HP/s passively, surging to 6 HP/s for 3.5s after defeating an enemy.',
  },
  zombie_passive_plague_carrier: {
    id: 'zombie_passive_plague_carrier',
    heroId: 'zombie',
    name: 'Plague Carrier',
    iconKey: 'passive_plague',
    accentColor: '#A3E635',
    description:
      "Zombie's infected strikes spread virulent toxins that stack and weaken foes to his plague abilities.",
    gameplayEffect:
      'Attacks have a 45% chance to apply Plague stacks (up to 3). Poisoned foes take +8% bonus damage per stack from poison skills.',
  },

  // --- SKELETON PASSIVES (Always Active on Skeleton) ---
  skeleton_passive_eternal_framework: {
    id: 'skeleton_passive_eternal_framework',
    heroId: 'skeleton',
    name: 'Eternal Framework',
    iconKey: 'passive_framework',
    accentColor: '#E2E8F0',
    description:
      "Skeleton's dense ossified structure shrugs off physical blows that would cripple flesh-and-blood warriors.",
    gameplayEffect:
      'Reduces incoming Physical Damage by 22% with reactive bone-guard plating (magical & elemental hazards bypass bone armor).',
  },
  skeleton_passive_bone_mastery: {
    id: 'skeleton_passive_bone_mastery',
    heroId: 'skeleton',
    name: 'Bone Mastery',
    iconKey: 'passive_mastery',
    accentColor: '#38BDF8',
    description:
      'Innate mastery over bone weaponry sharpens every strike and shatters critical hits into deadly splinters.',
    gameplayEffect:
      '+10% Crit Chance, +12% Bone Skill Power & Shield Strength, and Critical Strikes burst with splintering bone shards.',
  },

  // --- GOBLIN PASSIVES (Always Active on Goblin) ---
  goblin_passive_nimble_reflexes: {
    id: 'goblin_passive_nimble_reflexes',
    heroId: 'goblin',
    name: 'Nimble Reflexes',
    iconKey: 'passive_nimble_reflexes',
    accentColor: '#2DD4BF',
    description:
      'Goblin’s hyper-agile footwork snaps into motion instantly and slips past incoming enemy blows.',
    gameplayEffect:
      'Enhanced movement responsiveness and 20% chance to automatically Evade incoming attacks (3.5s internal cooldown).',
  },
  goblin_passive_opportunistic_predator: {
    id: 'goblin_passive_opportunistic_predator',
    heroId: 'goblin',
    name: 'Opportunistic Predator',
    iconKey: 'passive_opportunistic_predator',
    accentColor: '#FACC15',
    description:
      'Exploits exposed backs and wounded prey with ruthless twin-dagger precision.',
    gameplayEffect:
      '+24% Backstab Damage from behind; +15% Crit Chance & +16% Damage vs foes below 45% HP (crit capped at 75%).',
  },
};

export function getPassiveById(id: string): PassiveDefinition {
  const found = PASSIVE_REGISTRY[id];
  if (!found) {
    throw new Error(`Unknown passive id: ${id}`);
  }
  return found;
}

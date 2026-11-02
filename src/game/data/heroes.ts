import { EquippedLoadout, HeroDefinition } from '../types';

export const HERO_REGISTRY: HeroDefinition[] = [
  {
    id: 'zombie',
    name: 'Zombie',
    title: 'Zed, the Moss-Stitched Guardian',
    subtitle: 'Decay Bruiser · Poison & Regeneration',
    lore: 'Endures chaotic brawls with claw combos, stacking plague toxins, undead regeneration, and loyal sproutlings.',
    accentColor: '#34D399',
    unlocked: true,
    baseStats: {
      maxHp: 130,
      moveSpeed: 215,
      attackDamage: 22,
      attackSpeed: 1.0,
      critChance: 0.12,
      skillPower: 1.0,
      healingPower: 1.0,
      energyGainRate: 1.0,
    },
    basicAttackId: 'zombie_claw',
    normalSkillIds: [
      'zombie_flesh_ripper',
      'zombie_plague_burst',
      'zombie_undead_regen',
      'zombie_rotting_dash',
      'zombie_deaths_embrace',
    ],
    ultimateIds: [
      'zombie_ult_apocalypse',
      'zombie_ult_graveyard',
      'zombie_ult_lord_of_decay',
    ],
    passiveIds: ['zombie_passive_resilience', 'zombie_passive_plague_carrier'],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    title: 'Skelly, the Ivory Blade Dancer',
    subtitle: 'Agile Warrior · Physical & Critical Strikes',
    lore: 'Swift undead duelist wielding a sharpened bone blade, ossified barriers, and devastating critical precision.',
    accentColor: '#38BDF8',
    unlocked: true,
    baseStats: {
      maxHp: 112,
      moveSpeed: 238,
      attackDamage: 25,
      attackSpeed: 1.14,
      critChance: 0.22,
      skillPower: 1.0,
      healingPower: 1.0,
      energyGainRate: 1.05,
    },
    basicAttackId: 'skeleton_bone_strike',
    normalSkillIds: [
      'skeleton_bone_slash',
      'skeleton_bone_spear',
      'skeleton_ribcage_shield',
      'skeleton_skeletal_rush',
      'skeleton_bone_storm',
    ],
    ultimateIds: [
      'skeleton_ult_bone_colossus',
      'skeleton_ult_army_of_bones',
      'skeleton_ult_reapers_judgment',
    ],
    passiveIds: [
      'skeleton_passive_eternal_framework',
      'skeleton_passive_bone_mastery',
    ],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    title: 'Nix, the Shadow-Pouch Trickster',
    subtitle: 'Agility Assassin · Traps & Critical Strikes',
    lore: 'Quick and cunning rogue who darts behind foes with twin daggers, concealed alchemical traps, shadow ambushes, and ruthless backstabs.',
    accentColor: '#FACC15',
    unlocked: true,
    baseStats: {
      maxHp: 104,
      moveSpeed: 256,
      attackDamage: 18,
      attackSpeed: 1.32,
      critChance: 0.25,
      skillPower: 1.0,
      healingPower: 1.0,
      energyGainRate: 1.08,
    },
    basicAttackId: 'goblin_twin_daggers',
    normalSkillIds: [
      'goblin_dagger_flurry',
      'goblin_shadowstep',
      'goblin_explosive_trap',
      'goblin_windrunner',
      'goblin_poisoned_blades',
    ],
    ultimateIds: [
      'goblin_ult_phantom_frenzy',
      'goblin_ult_king_of_thieves',
      'goblin_ult_thousand_daggers',
    ],
    passiveIds: [
      'goblin_passive_nimble_reflexes',
      'goblin_passive_opportunistic_predator',
    ],
  },
];

export const DEFAULT_ZOMBIE_LOADOUT: EquippedLoadout = {
  heroId: 'zombie',
  normalSkills: ['zombie_flesh_ripper', 'zombie_plague_burst'],
  ultimate: 'zombie_ult_apocalypse',
};

export const DEFAULT_SKELETON_LOADOUT: EquippedLoadout = {
  heroId: 'skeleton',
  normalSkills: ['skeleton_bone_slash', 'skeleton_bone_spear'],
  ultimate: 'skeleton_ult_bone_colossus',
};

export const DEFAULT_GOBLIN_LOADOUT: EquippedLoadout = {
  heroId: 'goblin',
  normalSkills: ['goblin_dagger_flurry', 'goblin_shadowstep'],
  ultimate: 'goblin_ult_phantom_frenzy',
};

export function getDefaultLoadoutForHero(heroId: string): EquippedLoadout {
  if (heroId === 'skeleton') {
    return {
      heroId: 'skeleton',
      normalSkills: [...DEFAULT_SKELETON_LOADOUT.normalSkills] as [string, string],
      ultimate: DEFAULT_SKELETON_LOADOUT.ultimate,
    };
  }
  if (heroId === 'goblin') {
    return {
      heroId: 'goblin',
      normalSkills: [...DEFAULT_GOBLIN_LOADOUT.normalSkills] as [string, string],
      ultimate: DEFAULT_GOBLIN_LOADOUT.ultimate,
    };
  }
  return {
    heroId: 'zombie',
    normalSkills: [...DEFAULT_ZOMBIE_LOADOUT.normalSkills] as [string, string],
    ultimate: DEFAULT_ZOMBIE_LOADOUT.ultimate,
  };
}

export function getHeroById(id: string): HeroDefinition {
  const found = HERO_REGISTRY.find((h) => h.id === id && h.unlocked);
  return found || HERO_REGISTRY[0];
}

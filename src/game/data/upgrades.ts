import { DungeonEventDef, EquippedLoadout, HeroStats, PlayerState, UpgradeOption } from '../types';

export const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: 'upg_sharpened_claws',
    name: 'Runic Weapon Hone',
    category: 'Basic Attack',
    description: '+24% Basic Attack Damage and enhanced strike impact.',
    accentColor: '#34D399',
    apply: (stats: HeroStats) => {
      stats.attackDamage = Math.round(stats.attackDamage * 1.24);
    },
  },
  {
    id: 'upg_feral_tempo',
    name: 'Lantern-Warmed Reflexes',
    category: 'Attack Speed',
    description: '+22% Basic Attack Speed for faster melee strike chains.',
    accentColor: '#F59E0B',
    apply: (stats: HeroStats) => {
      stats.attackSpeed = Number((stats.attackSpeed * 1.22).toFixed(2));
    },
  },
  {
    id: 'upg_virulent_spores',
    name: 'Arcane Essence Infusion',
    category: 'Skill Damage',
    description: '+26% Skill & Ultimate Damage across all equipped abilities.',
    synergyAbilityId: 'zombie_plague_burst',
    synergyLabel: 'Boosts all Normal Skills & Ultimates',
    accentColor: '#84CC16',
    apply: (stats: HeroStats) => {
      stats.skillPower = Number((stats.skillPower * 1.26).toFixed(2));
    },
  },
  {
    id: 'upg_flesh_rend_mastery',
    name: 'Keen Executioner Signet',
    category: 'Crit & Burst',
    description: '+12% Critical Hit Chance and +15% Basic Attack Damage.',
    synergyAbilityId: 'goblin_dagger_flurry',
    synergyLabel: 'Strong synergy with Dagger Flurry, Backstabs & Bone Mastery',
    accentColor: '#F43F5E',
    apply: (stats: HeroStats) => {
      stats.critChance = Math.min(0.85, Number((stats.critChance + 0.12).toFixed(2)));
      stats.attackDamage = Math.round(stats.attackDamage * 1.15);
    },
  },
  {
    id: 'upg_mossy_vitality',
    name: 'Hearty Sanctuary Broth',
    category: 'Max Health',
    description: '+35 Maximum Health and immediately restores 35 HP.',
    accentColor: '#10B981',
    apply: (stats: HeroStats, player: PlayerState) => {
      stats.maxHp += 35;
      player.maxHp += 35;
      player.hp = Math.min(player.maxHp, player.hp + 35);
    },
  },
  {
    id: 'upg_verdant_sap',
    name: 'Dewdrop Restoration Ward',
    category: 'Healing & Sustain',
    description: '+35% Healing received and restores 22 HP immediately.',
    synergyAbilityId: 'zombie_undead_regen',
    synergyLabel: 'Enhances Regeneration, Siphon & Sanctuary Springs',
    accentColor: '#2DD4BF',
    apply: (stats: HeroStats, player: PlayerState) => {
      stats.healingPower = Number((stats.healingPower * 1.35).toFixed(2));
      player.hp = Math.min(player.maxHp, player.hp + 22);
    },
  },
  {
    id: 'upg_fleet_stitches',
    name: 'Wind-Step Greaves',
    category: 'Mobility',
    description: '+18% Movement Speed and faster Dodge recovery.',
    synergyAbilityId: 'goblin_windrunner',
    synergyLabel: 'Synergizes with Windrunner, Shadowstep & Rush skills',
    accentColor: '#38BDF8',
    apply: (stats: HeroStats) => {
      stats.moveSpeed = Math.round(stats.moveSpeed * 1.18);
    },
  },
  {
    id: 'upg_soul_lantern',
    name: 'Soulfire Wick',
    category: 'Ultimate Energy',
    description: '+35% Ultimate Energy generation from attacks and kills, plus +25 Energy now.',
    accentColor: '#C084FC',
    apply: (stats: HeroStats, player: PlayerState) => {
      stats.energyGainRate = Number((stats.energyGainRate * 1.35).toFixed(2));
      player.ultEnergy = Math.min(100, player.ultEnergy + 25);
    },
  },
  {
    id: 'upg_crypt_resonance',
    name: 'Ossuary Vanguard Crest',
    category: 'Skill Mastery',
    description: '+18% Skill Damage and +24 Maximum Health.',
    synergyAbilityId: 'skeleton_bone_spear',
    synergyLabel: 'Boosts Spear, Shield & Summoned Allies',
    accentColor: '#A855F7',
    apply: (stats: HeroStats, player: PlayerState) => {
      stats.skillPower = Number((stats.skillPower * 1.18).toFixed(2));
      stats.maxHp += 24;
      player.maxHp += 24;
      player.hp = Math.min(player.maxHp, player.hp + 24);
    },
  },
];

export function rollUpgradeChoices(loadout: EquippedLoadout, count = 3): UpgradeOption[] {
  const equippedSet = new Set<string>([
    ...loadout.normalSkills,
    loadout.ultimate,
  ]);

  const weighted: { item: UpgradeOption; score: number }[] = UPGRADE_POOL.map((item) => {
    const hasSynergy = item.synergyAbilityId && equippedSet.has(item.synergyAbilityId);
    return {
      item,
      score: Math.random() + (hasSynergy ? 0.25 : 0),
    };
  });

  weighted.sort((a, b) => b.score - a.score);
  return weighted.slice(0, count).map((w) => w.item);
}

export const DUNGEON_EVENTS: DungeonEventDef[] = [
  {
    id: 'event_soup_cauldron',
    title: 'The Wandering Goblin’s Kettle',
    description:
      'A friendly spectacled goblin stirs a bubbling cauldron of luminescent mushroom stew beside a warm lantern.',
    choices: [
      {
        label: 'Drink the Hearty Emerald Broth',
        effectText: 'Restore 50% Max HP and gain +15 Max HP',
        resolve: (player: PlayerState) => {
          player.maxHp += 15;
          player.stats.maxHp += 15;
          const heal = Math.round(player.maxHp * 0.5);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          return `Warm sanctuary broth restores ${heal} HP and grants +15 Max HP!`;
        },
      },
      {
        label: 'Sample the Spiced Nightshade Ladle',
        effectText: 'Lose 18 HP · Gain +22% Skill Power & +15% Attack Damage',
        resolve: (player: PlayerState) => {
          player.hp = Math.max(10, player.hp - 18);
          player.stats.skillPower = Number((player.stats.skillPower * 1.22).toFixed(2));
          player.stats.attackDamage = Math.round(player.stats.attackDamage * 1.15);
          return 'Fierce crypt-spice surges through your weapon! Attack & Skill Power permanently boosted.';
        },
      },
      {
        label: 'Trade 25 Gold for Soul Seasoning',
        effectText: 'Spend 25 Gold · Charge Ultimate to 100% & +10% Crit Chance',
        canChoose: (player: PlayerState) => player.gold >= 25,
        resolve: (player: PlayerState) => {
          player.gold -= 25;
          player.ultEnergy = 100;
          player.stats.critChance = Math.min(0.85, Number((player.stats.critChance + 0.1).toFixed(2)));
          return 'The goblin tosses sparkling herbs into your pouch! Ultimate charged & Crit Chance increased.';
        },
      },
    ],
  },
  {
    id: 'event_moss_shrine',
    title: 'Shrine of the Ancient Lantern',
    description:
      'Soft golden sunbeams pierce a crack in the crypt ceiling, illuminating an ancient mossy basin.',
    choices: [
      {
        label: 'Bask in the Sunbeam',
        effectText: 'Restore 45 HP and charge 50 Ultimate Energy',
        resolve: (player: PlayerState) => {
          const heal = Math.round(45 * player.stats.healingPower);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          player.ultEnergy = Math.min(100, player.ultEnergy + 50);
          return `Warm golden light restores ${heal} HP and charges +50 Ultimate Energy!`;
        },
      },
      {
        label: 'Offer a Drop of Vitality',
        effectText: 'Lose 15 HP · Gain 55 Gold & +18% Attack Speed',
        resolve: (player: PlayerState) => {
          player.hp = Math.max(10, player.hp - 15);
          player.gold += 55;
          player.stats.attackSpeed = Number((player.stats.attackSpeed * 1.18).toFixed(2));
          return 'Ancient coins clatter from the moss and your strikes grow swifter! +55 Gold & +18% Attack Speed.';
        },
      },
    ],
  },
];

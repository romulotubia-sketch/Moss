import { EquippedLoadout, RunSummary } from '../types';
import { ALL_ABILITIES } from './abilities';
import {
  DEFAULT_GOBLIN_LOADOUT,
  DEFAULT_SKELETON_LOADOUT,
  DEFAULT_ZOMBIE_LOADOUT,
  getDefaultLoadoutForHero,
  getHeroById,
  HERO_REGISTRY,
} from './heroes';

const STORAGE_KEY = 'cozy_crypts_lobby_save_v2';

export interface PlayerProgression {
  selectedHeroId: string;
  equippedByHero: Record<
    string,
    {
      normalSkills: [string, string];
      ultimate: string;
    }
  >;
  unlockedHeroIds: string[];
  totalGold: number;
  runsCompleted: number;
  victories: number;
  bestRoomsCleared: number;
}

function getDefaultProgression(): PlayerProgression {
  return {
    selectedHeroId: 'zombie',
    equippedByHero: {
      zombie: {
        normalSkills: [...DEFAULT_ZOMBIE_LOADOUT.normalSkills] as [string, string],
        ultimate: DEFAULT_ZOMBIE_LOADOUT.ultimate,
      },
      skeleton: {
        normalSkills: [...DEFAULT_SKELETON_LOADOUT.normalSkills] as [string, string],
        ultimate: DEFAULT_SKELETON_LOADOUT.ultimate,
      },
      goblin: {
        normalSkills: [...DEFAULT_GOBLIN_LOADOUT.normalSkills] as [string, string],
        ultimate: DEFAULT_GOBLIN_LOADOUT.ultimate,
      },
    },
    unlockedHeroIds: ['zombie', 'skeleton', 'goblin'],
    totalGold: 0,
    runsCompleted: 0,
    victories: 0,
    bestRoomsCleared: 0,
  };
}

export function isLoadoutComplete(loadout: EquippedLoadout | null | undefined): boolean {
  if (!loadout || !loadout.heroId) return false;
  const hero = HERO_REGISTRY.find((h) => h.id === loadout.heroId && h.unlocked);
  if (!hero) return false;

  const [s1, s2] = loadout.normalSkills;
  if (!s1 || !s2 || s1 === s2) return false;
  // Strictly enforce hero ownership so Zombie, Skeleton, and Goblin can never cross-equip skills
  if (!hero.normalSkillIds.includes(s1) || !hero.normalSkillIds.includes(s2)) return false;
  if (!ALL_ABILITIES[s1] || !ALL_ABILITIES[s2]) return false;

  if (!loadout.ultimate || !hero.ultimateIds.includes(loadout.ultimate)) return false;
  if (!ALL_ABILITIES[loadout.ultimate]) return false;

  return true;
}

export function loadPlayerProgression(): PlayerProgression {
  const fallback = getDefaultProgression();
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem('cozy_crypts_lobby_save_v1');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PlayerProgression>;

    const unlocked = Array.isArray(parsed.unlockedHeroIds)
      ? Array.from(new Set(['zombie', 'skeleton', 'goblin', ...parsed.unlockedHeroIds]))
      : ['zombie', 'skeleton', 'goblin'];

    const candidateHeroId =
      typeof parsed.selectedHeroId === 'string' &&
      HERO_REGISTRY.some((h) => h.id === parsed.selectedHeroId && h.unlocked)
        ? parsed.selectedHeroId
        : 'zombie';

    const equippedByHero = {
      ...fallback.equippedByHero,
      ...(parsed.equippedByHero || {}),
    };

    // Sanitize every unlocked hero's saved loadout so each hero retains independent valid skills
    for (const hero of HERO_REGISTRY) {
      if (!hero.unlocked) continue;
      const savedEquip = equippedByHero[hero.id];
      if (
        !savedEquip ||
        !Array.isArray(savedEquip.normalSkills) ||
        savedEquip.normalSkills.length !== 2 ||
        savedEquip.normalSkills[0] === savedEquip.normalSkills[1] ||
        !hero.normalSkillIds.includes(savedEquip.normalSkills[0]) ||
        !hero.normalSkillIds.includes(savedEquip.normalSkills[1]) ||
        !hero.ultimateIds.includes(savedEquip.ultimate)
      ) {
        const defLoadout = getDefaultLoadoutForHero(hero.id);
        equippedByHero[hero.id] = {
          normalSkills: [defLoadout.normalSkills[0], defLoadout.normalSkills[1]],
          ultimate: defLoadout.ultimate,
        };
      }
    }

    return {
      selectedHeroId: candidateHeroId,
      equippedByHero,
      unlockedHeroIds: unlocked,
      totalGold:
        typeof parsed.totalGold === 'number' && parsed.totalGold >= 0
          ? Math.floor(parsed.totalGold)
          : 0,
      runsCompleted:
        typeof parsed.runsCompleted === 'number' && parsed.runsCompleted >= 0
          ? Math.floor(parsed.runsCompleted)
          : 0,
      victories:
        typeof parsed.victories === 'number' && parsed.victories >= 0
          ? Math.floor(parsed.victories)
          : 0,
      bestRoomsCleared:
        typeof parsed.bestRoomsCleared === 'number' && parsed.bestRoomsCleared >= 0
          ? Math.floor(parsed.bestRoomsCleared)
          : 0,
    };
  } catch {
    return fallback;
  }
}

export function savePlayerProgression(next: PlayerProgression): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}

export function getActiveLoadoutFromProgression(prog: PlayerProgression): EquippedLoadout {
  const hero = getHeroById(prog.selectedHeroId);
  const equip = prog.equippedByHero[hero.id];
  if (
    equip &&
    hero.normalSkillIds.includes(equip.normalSkills[0]) &&
    hero.normalSkillIds.includes(equip.normalSkills[1]) &&
    hero.ultimateIds.includes(equip.ultimate)
  ) {
    return {
      heroId: hero.id,
      normalSkills: [equip.normalSkills[0], equip.normalSkills[1]],
      ultimate: equip.ultimate,
    };
  }
  return getDefaultLoadoutForHero(hero.id);
}

export function updateProgressionLoadout(
  prog: PlayerProgression,
  loadout: EquippedLoadout
): PlayerProgression {
  const next: PlayerProgression = {
    ...prog,
    selectedHeroId: loadout.heroId,
    equippedByHero: {
      ...prog.equippedByHero,
      [loadout.heroId]: {
        normalSkills: [loadout.normalSkills[0], loadout.normalSkills[1]],
        ultimate: loadout.ultimate,
      },
    },
  };
  savePlayerProgression(next);
  return next;
}

export function updateProgressionRunComplete(
  prog: PlayerProgression,
  summary: RunSummary
): PlayerProgression {
  const next: PlayerProgression = {
    ...prog,
    totalGold: prog.totalGold + Math.max(0, summary.goldCollected),
    runsCompleted: prog.runsCompleted + 1,
    victories: prog.victories + (summary.victory ? 1 : 0),
    bestRoomsCleared: Math.max(prog.bestRoomsCleared, summary.roomsCleared),
  };
  savePlayerProgression(next);
  return next;
}

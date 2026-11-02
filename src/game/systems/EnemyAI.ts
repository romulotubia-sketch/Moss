import { EnemyKind, EnemyState, PlayerState, RoomData } from '../types';
import {
  damageEnemy,
  hurtPlayer,
  resolveCircleObstacles,
  spawnParticles,
  WorldEffectsContext,
} from './CombatSystem';
import { createEnemy, nextEntityId } from './DungeonGenerator';

export function updateEnemiesAI(
  dt: number,
  player: PlayerState,
  room: RoomData,
  ctx: WorldEffectsContext
): void {
  for (let i = ctx.enemies.length - 1; i >= 0; i--) {
    const e = ctx.enemies[i];

    // Death animation progression
    if (e.dead) {
      e.deathAnim += dt * 3.2;
      if (e.deathAnim >= 1) {
        ctx.enemies.splice(i, 1);
      }
      continue;
    }

    if (e.hurtFlash > 0) e.hurtFlash = Math.max(0, e.hurtFlash - dt);
    if (e.rootTimer > 0) e.rootTimer = Math.max(0, e.rootTimer - dt);

    // Poison Damage Over Time (amplified by Plague Carrier stacks!)
    if (e.poisonTimer > 0) {
      e.poisonTimer -= dt;
      e.poisonTickTimer -= dt;
      if (Math.random() < dt * 6) {
        ctx.particles.push({
          x: e.x + (Math.random() - 0.5) * e.radius,
          y: e.y - e.radius * 0.5,
          vx: (Math.random() - 0.5) * 15,
          vy: -28,
          size: 3.2,
          color: '#84CC16',
          alpha: 0.9,
          life: 0.4,
          maxLife: 0.4,
          glow: true,
        });
      }
      if (e.poisonTickTimer <= 0) {
        e.poisonTickTimer = 0.5;
        damageEnemy(player, e, e.poisonDps * 0.5, 0, 0, ctx, {
          canCrit: false,
          colorOverride: '#A3E635',
          isPoisonAbility: true,
          silent: true,
        });
        if (e.dead) continue;
      }
      if (e.poisonTimer <= 0) {
        e.poisonStacks = 0;
      }
    }

    // Apply decaying knockback velocity
    if (Math.abs(e.knockVx) > 1 || Math.abs(e.knockVy) > 1) {
      e.x += e.knockVx * dt;
      e.y += e.knockVy * dt;
      e.knockVx *= Math.pow(0.002, dt);
      e.knockVy *= Math.pow(0.002, dt);
      resolveCircleObstacles(e, room);
    }

    if (e.kind === EnemyKind.TRAINING_DUMMY) {
      continue;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angleToPlayer = Math.atan2(dy, dx);

    const canMove = e.rootTimer <= 0;
    e.aiTimer -= dt;

    // Individual Enemy AI & Attack Telegraph Patterns
    switch (e.kind) {
      case EnemyKind.MOSS_SLIME: {
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
            e.walkCycle += dt * 9;
          }
          if (dist < 135 && e.aiTimer <= 0 && canMove) {
            e.aiState = 'TELEGRAPH';
            e.aiTimer = 0.58;
            e.telegraphAngle = angleToPlayer;
            e.telegraphRange = 125;
            e.telegraphType = 'LINE';
          }
        } else if (e.aiState === 'TELEGRAPH') {
          if (e.aiTimer <= 0) {
            e.aiState = 'ATTACK';
            e.aiTimer = 0.24;
            e.vx = Math.cos(e.telegraphAngle) * 360;
            e.vy = Math.sin(e.telegraphAngle) * 360;
          }
        } else if (e.aiState === 'ATTACK') {
          if (canMove) {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }
          if (dist <= e.radius + player.radius + 4) {
            hurtPlayer(player, e.contactDamage, e.telegraphAngle, ctx, 'PHYSICAL');
          } else {
            // Damage nearby Skeletal Warrior minions if they intercept the lunge!
            for (const m of ctx.minions) {
              if (m.kind === 'SKELETON_WARRIOR' && m.hp !== undefined && (m.hurtFlash || 0) <= 0) {
                if (Math.hypot(e.x - m.x, e.y - m.y) <= e.radius + m.radius + 4) {
                  m.hp -= e.contactDamage;
                  m.hurtFlash = 0.22;
                  break;
                }
              }
            }
          }
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = 0.9;
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = 0.9;
          }
        }
        break;
      }

      case EnemyKind.GLOOM_SHROOM: {
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            if (dist > 250) {
              e.x += (dx / dist) * e.speed * dt;
              e.y += (dy / dist) * e.speed * dt;
              e.walkCycle += dt * 7;
            } else if (dist < 150) {
              e.x -= (dx / dist) * e.speed * 0.75 * dt;
              e.y -= (dy / dist) * e.speed * 0.75 * dt;
              e.walkCycle += dt * 7;
            }
          }
          if (dist < 360 && e.aiTimer <= 0) {
            e.aiState = 'TELEGRAPH';
            e.aiTimer = 0.68;
            e.telegraphAngle = angleToPlayer;
            e.telegraphRange = 330;
            e.telegraphType = 'LINE';
          }
        } else if (e.aiState === 'TELEGRAPH') {
          // Gently track player slightly early in telegraph, lock in last 0.25s
          if (e.aiTimer > 0.25) {
            e.telegraphAngle = angleToPlayer;
            e.facingAngle = angleToPlayer;
          }
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = 1.45;
            const pSpeed = 255;
            ctx.projectiles.push({
              id: nextEntityId('spore_proj'),
              x: e.x + Math.cos(e.telegraphAngle) * 18,
              y: e.y + Math.sin(e.telegraphAngle) * 18,
              vx: Math.cos(e.telegraphAngle) * pSpeed,
              vy: Math.sin(e.telegraphAngle) * pSpeed,
              radius: 8,
              damage: e.contactDamage + 3,
              damageType: 'MAGIC',
              friendly: false,
              color: '#C084FC',
              life: 2.2,
            });
            spawnParticles(ctx.particles, e.x, e.y, '#C084FC', 6, 30, 90, 2, 4, 0.3);
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = 0.8;
          }
        }
        break;
      }

      case EnemyKind.BONE_SCUTTLER: {
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
            e.walkCycle += dt * 12;
          }
          if (dist <= 74 && e.aiTimer <= 0) {
            e.aiState = 'TELEGRAPH';
            e.aiTimer = 0.5;
            e.telegraphAngle = angleToPlayer;
            e.telegraphRange = 78;
            e.telegraphType = 'CONE';
          }
        } else if (e.aiState === 'TELEGRAPH') {
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = 0.85;
            ctx.slashes.push({
              id: nextEntityId('bone_slash'),
              x: e.x + Math.cos(e.telegraphAngle) * 14,
              y: e.y + Math.sin(e.telegraphAngle) * 14,
              angle: e.telegraphAngle,
              radius: 68,
              arc: 1.4,
              life: 0.16,
              maxLife: 0.16,
              colorPrimary: '#FB7185',
              colorSecondary: '#FDA4AF',
              flip: false,
              style: 'CLAW',
            });
            if (dist <= 82 + player.radius) {
              let diff = Math.atan2(player.y - e.y, player.x - e.x) - e.telegraphAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              if (Math.abs(diff) <= 0.95) {
                hurtPlayer(player, e.contactDamage, e.telegraphAngle, ctx, 'PHYSICAL');
              }
            }
            for (const m of ctx.minions) {
              if (m.kind === 'SKELETON_WARRIOR' && m.hp !== undefined && Math.hypot(m.x - e.x, m.y - e.y) <= 78) {
                m.hp -= e.contactDamage;
                m.hurtFlash = 0.2;
              }
            }
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = 0.45;
          }
        }
        break;
      }

      case EnemyKind.EMBER_IMP: {
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            // Strafe around player
            const strafeAngle = angleToPlayer + Math.PI * 0.38;
            e.x += Math.cos(strafeAngle) * e.speed * dt;
            e.y += Math.sin(strafeAngle) * e.speed * dt;
            e.walkCycle += dt * 10;
          }
          if (e.aiTimer <= 0) {
            e.aiState = 'TELEGRAPH';
            e.aiTimer = 0.62;
            e.telegraphAngle = angleToPlayer;
            e.telegraphRange = 260;
            e.telegraphType = 'CONE';
          }
        } else if (e.aiState === 'TELEGRAPH') {
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = 1.5;
            for (let s = -1; s <= 1; s++) {
              const a = e.telegraphAngle + s * 0.26;
              ctx.projectiles.push({
                id: nextEntityId('ember_orb'),
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * 215,
                vy: Math.sin(a) * 215,
                radius: 7,
                damage: e.contactDamage,
                damageType: 'MAGIC',
                friendly: false,
                color: '#FB923C',
                life: 2.0,
              });
            }
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = 1.1;
          }
        }
        break;
      }

      case EnemyKind.BRAMBLE_KNIGHT: {
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
            e.walkCycle += dt * 8;
          }
          if (dist < 145 && e.aiTimer <= 0) {
            e.aiState = 'TELEGRAPH';
            e.attackPattern = (e.attackPattern + 1) % 2;
            e.telegraphAngle = angleToPlayer;
            if (e.attackPattern === 0) {
              e.aiTimer = 0.78;
              e.telegraphRange = 128;
              e.telegraphType = 'CIRCLE';
            } else {
              e.aiTimer = 0.65;
              e.telegraphRange = 175;
              e.telegraphType = 'LINE';
            }
          }
        } else if (e.aiState === 'TELEGRAPH') {
          if (e.aiTimer <= 0) {
            if (e.attackPattern === 0) {
              // Bramble Slam AoE
              e.aiState = 'COOLDOWN';
              e.aiTimer = 1.15;
              ctx.addScreenShake(6);
              ctx.slashes.push({
                id: nextEntityId('elite_slam'),
                x: e.x,
                y: e.y,
                angle: 0,
                radius: e.telegraphRange,
                arc: Math.PI * 2,
                life: 0.28,
                maxLife: 0.28,
                colorPrimary: '#F59E0B',
                colorSecondary: '#FB7185',
                flip: false,
                style: 'NOVA',
              });
              if (dist <= e.telegraphRange + player.radius * 0.7) {
                hurtPlayer(player, e.contactDamage + 4, angleToPlayer, ctx, 'PHYSICAL');
              }
              for (const m of ctx.minions) {
                if (m.kind === 'SKELETON_WARRIOR' && m.hp !== undefined && Math.hypot(m.x - e.x, m.y - e.y) <= e.telegraphRange) {
                  m.hp -= e.contactDamage + 4;
                  m.hurtFlash = 0.22;
                }
              }
            } else {
              // Shield Charge
              e.aiState = 'ATTACK';
              e.aiTimer = 0.28;
              e.vx = Math.cos(e.telegraphAngle) * 420;
              e.vy = Math.sin(e.telegraphAngle) * 420;
            }
          }
        } else if (e.aiState === 'ATTACK') {
          if (canMove) {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }
          if (dist <= e.radius + player.radius + 6) {
            hurtPlayer(player, e.contactDamage, e.telegraphAngle, ctx, 'PHYSICAL');
          }
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = 1.1;
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = 0.85;
          }
        }
        break;
      }

      case EnemyKind.CRYPT_WARDEN_BOSS: {
        const enraged = e.hp < e.maxHp * 0.5;
        if (e.aiState === 'CHASE') {
          e.facingAngle = angleToPlayer;
          if (canMove) {
            e.x += (dx / dist) * (e.speed * (enraged ? 1.2 : 1.0)) * dt;
            e.y += (dy / dist) * (e.speed * (enraged ? 1.2 : 1.0)) * dt;
            e.walkCycle += dt * 7;
          }
          if (e.aiTimer <= 0) {
            e.aiState = 'TELEGRAPH';
            e.attackPattern = (e.attackPattern + 1) % 3;
            e.telegraphAngle = angleToPlayer;

            if (e.attackPattern === 0) {
              // Pattern 0: Wide Runic Axe Cleave
              e.aiTimer = enraged ? 0.7 : 0.85;
              e.telegraphRange = 175;
              e.telegraphType = 'CONE';
            } else if (e.attackPattern === 1) {
              // Pattern 1: Lantern Core Radial Ring Projectiles
              e.aiTimer = enraged ? 0.72 : 0.88;
              e.telegraphRange = 120;
              e.telegraphType = 'RING';
            } else {
              // Pattern 2: Summon 4 Ground Vine Eruption Telegraphs around player
              e.aiTimer = 0.65;
              e.telegraphRange = 95;
              e.telegraphType = 'GROUND_VINES';
              for (let v = 0; v < (enraged ? 5 : 3); v++) {
                const offsetA = (Math.PI * 2 * v) / (enraged ? 5 : 3);
                const gx = v === 0 ? player.x : player.x + Math.cos(offsetA) * 115;
                const gy = v === 0 ? player.y : player.y + Math.sin(offsetA) * 115;
                ctx.hazards.push({
                  id: nextEntityId('boss_vine'),
                  kind: 'BOSS_VINE_TELEGRAPH',
                  x: Math.max(85, Math.min(room.width - 85, gx)),
                  y: Math.max(85, Math.min(room.height - 85, gy)),
                  radius: 56,
                  life: 0.95,
                  maxLife: 0.95,
                  tickTimer: 99,
                  damage: 20,
                  friendly: false,
                });
              }
            }
          }
        } else if (e.aiState === 'TELEGRAPH') {
          if (e.aiTimer <= 0) {
            e.aiState = 'COOLDOWN';
            e.aiTimer = enraged ? 0.95 : 1.25;

            if (e.attackPattern === 0) {
              ctx.addScreenShake(9);
              ctx.slashes.push({
                id: nextEntityId('boss_axe'),
                x: e.x + Math.cos(e.telegraphAngle) * 28,
                y: e.y + Math.sin(e.telegraphAngle) * 28,
                angle: e.telegraphAngle,
                radius: 170,
                arc: 1.9,
                life: 0.26,
                maxLife: 0.26,
                colorPrimary: '#F59E0B',
                colorSecondary: '#34D399',
                flip: false,
                style: 'TWIN_RIP',
              });
              if (dist <= 180 + player.radius) {
                let diff = Math.atan2(player.y - e.y, player.x - e.x) - e.telegraphAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                if (Math.abs(diff) <= 1.05) {
                  hurtPlayer(player, e.contactDamage + 4, e.telegraphAngle, ctx, 'PHYSICAL');
                }
              }
              for (const m of ctx.minions) {
                if (m.kind === 'SKELETON_WARRIOR' && m.hp !== undefined && Math.hypot(m.x - e.x, m.y - e.y) <= 175) {
                  m.hp -= e.contactDamage + 4;
                  m.hurtFlash = 0.22;
                }
              }
            } else if (e.attackPattern === 1) {
              ctx.addScreenShake(7);
              const bolts = enraged ? 12 : 9;
              for (let b = 0; b < bolts; b++) {
                const a = e.telegraphAngle + (Math.PI * 2 * b) / bolts;
                ctx.projectiles.push({
                  id: nextEntityId('warden_orb'),
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(a) * 210,
                  vy: Math.sin(a) * 210,
                  radius: 9,
                  damage: 18,
                  damageType: 'MAGIC',
                  friendly: false,
                  color: '#F59E0B',
                  life: 3.0,
                });
              }
              // Occasionally spawn a helper slime if enraged and few enemies
              if (enraged && ctx.enemies.length < 3) {
                ctx.enemies.push(createEnemy(EnemyKind.MOSS_SLIME, e.x + 70, e.y + 40, 1.0));
              }
            }
          }
        } else if (e.aiState === 'COOLDOWN') {
          if (e.aiTimer <= 0) {
            e.aiState = 'CHASE';
            e.aiTimer = enraged ? 0.85 : 1.15;
          }
        }
        break;
      }
    }

    // Soft enemy-to-enemy separation so enemies don't stack into a single dot
    for (let j = i - 1; j >= 0; j--) {
      const other = ctx.enemies[j];
      if (other.dead) continue;
      const sx = e.x - other.x;
      const sy = e.y - other.y;
      const sDist = Math.hypot(sx, sy) || 0.01;
      const minSep = e.radius + other.radius;
      if (sDist < minSep) {
        const push = (minSep - sDist) * 0.5;
        e.x += (sx / sDist) * push;
        e.y += (sy / sDist) * push;
        if (other.kind !== EnemyKind.TRAINING_DUMMY) {
          other.x -= (sx / sDist) * push;
          other.y -= (sy / sDist) * push;
        }
      }
    }

    resolveCircleObstacles(e, room);
  }
}

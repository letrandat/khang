/**
 * Weapon Configuration - Brotato-style weapon system
 * 12 weapons with 3 tiers each
 *
 * Tier bonuses:
 * - Damage: +50% per tier (T1=1x, T2=1.5x, T3=2x)
 * - Fire rate: +25% per tier (faster = lower interval)
 * - Projectiles: T2 +1, T3 +2 (for multi-projectile weapons)
 * - T3 special effects (piercing, explosion, chain, etc.)
 */

// Base weapons configuration
export const WEAPONS = {
  // 1. Energy Blaster - Fast, balanced shots (starter weapon)
  energyBlaster: {
    id: 'energyBlaster',
    name: 'Energy Blaster',
    description: 'Fast, balanced shots',
    baseDamage: 10,
    baseFireRate: 200, // ms between shots
    baseSpeed: 400,
    projectileCount: 1,
    behavior: 'straight',
    projectileTexture: 'bullet',
    critTexture: 'bullet-crit',
    color: 0xffffff,
  },

  // 2. Bow & Arrow - Charged shots, slower but higher damage
  bow: {
    id: 'bow',
    name: 'Bow & Arrow',
    description: 'Slow but powerful shots',
    baseDamage: 25,
    baseFireRate: 600,
    baseSpeed: 500,
    projectileCount: 1,
    behavior: 'straight',
    projectileTexture: 'bullet-arrow',
    critTexture: 'bullet-arrow-crit',
    color: 0x8b4513,
  },

  // 3. Magic Staff - Homing orbs, seek enemies
  magicStaff: {
    id: 'magicStaff',
    name: 'Magic Staff',
    description: 'Homing magical orbs',
    baseDamage: 12,
    baseFireRate: 400,
    baseSpeed: 250,
    projectileCount: 1,
    behavior: 'homing',
    projectileTexture: 'bullet-magic',
    critTexture: 'bullet-magic-crit',
    color: 0x9b59b6,
  },

  // 4. Launcher - Explosive, area damage
  launcher: {
    id: 'launcher',
    name: 'Launcher',
    description: 'Explosive area damage',
    baseDamage: 30,
    baseFireRate: 1000,
    baseSpeed: 300,
    projectileCount: 1,
    behavior: 'explosive',
    explosionRadius: 60,
    projectileTexture: 'bullet-launcher',
    critTexture: 'bullet-launcher-crit',
    color: 0xff6600,
  },

  // 5. Shotgun - Spread shot (3-5 pellets), close range
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    description: 'Spread shot, close range',
    baseDamage: 8,
    baseFireRate: 500,
    baseSpeed: 450,
    projectileCount: 3, // Base pellets
    behavior: 'spread',
    spreadAngle: 15, // degrees between pellets
    projectileTexture: 'bullet-shotgun',
    critTexture: 'bullet-shotgun-crit',
    color: 0xaaaaaa,
  },

  // 6. SMG - Rapid fire, lower damage per shot
  smg: {
    id: 'smg',
    name: 'SMG',
    description: 'Rapid fire, low damage',
    baseDamage: 5,
    baseFireRate: 80,
    baseSpeed: 500,
    projectileCount: 1,
    behavior: 'straight',
    projectileTexture: 'bullet-smg',
    critTexture: 'bullet-smg-crit',
    color: 0xffcc00,
  },

  // 7. Sniper - Slow, high damage, piercing
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    description: 'Slow, powerful, piercing',
    baseDamage: 50,
    baseFireRate: 1200,
    baseSpeed: 800,
    projectileCount: 1,
    behavior: 'piercing',
    maxPierceCount: 2, // T3 increases this
    projectileTexture: 'bullet-sniper',
    critTexture: 'bullet-sniper-crit',
    color: 0x00ff00,
  },

  // 8. Flamethrower - Continuous short-range particles
  flamethrower: {
    id: 'flamethrower',
    name: 'Flamethrower',
    description: 'Continuous flames',
    baseDamage: 3,
    baseFireRate: 50,
    baseSpeed: 300,
    projectileCount: 1,
    behavior: 'flame',
    projectileLifetime: 300, // ms
    projectileTexture: 'bullet-flame',
    critTexture: 'bullet-flame-crit',
    color: 0xff4400,
  },

  // 9. Ice Gun - Slows enemies on hit
  iceGun: {
    id: 'iceGun',
    name: 'Ice Gun',
    description: 'Slows enemies on hit',
    baseDamage: 8,
    baseFireRate: 300,
    baseSpeed: 350,
    projectileCount: 1,
    behavior: 'slow',
    slowAmount: 0.5, // 50% speed reduction
    slowDuration: 2000, // ms
    projectileTexture: 'bullet-ice',
    critTexture: 'bullet-ice-crit',
    color: 0x00ccff,
  },

  // 10. Lightning - Chain damage to nearby enemies
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    description: 'Chains to nearby enemies',
    baseDamage: 15,
    baseFireRate: 450,
    baseSpeed: 600,
    projectileCount: 1,
    behavior: 'chain',
    chainRange: 100,
    maxChains: 2, // T3 increases this
    projectileTexture: 'bullet-lightning',
    critTexture: 'bullet-lightning-crit',
    color: 0xffff00,
  },

  // 11. Laser Beam - Continuous beam
  laserBeam: {
    id: 'laserBeam',
    name: 'Laser Beam',
    description: 'Continuous beam',
    baseDamage: 2,
    baseFireRate: 30,
    baseSpeed: 1000,
    projectileCount: 1,
    behavior: 'beam',
    beamWidth: 4,
    projectileTexture: 'bullet-laser',
    critTexture: 'bullet-laser-crit',
    color: 0xff0000,
  },

  // 12. Boomerang - Returns to player, hits twice
  boomerang: {
    id: 'boomerang',
    name: 'Boomerang',
    description: 'Returns to player',
    baseDamage: 18,
    baseFireRate: 700,
    baseSpeed: 350,
    projectileCount: 1,
    behavior: 'boomerang',
    returnDistance: 300,
    projectileTexture: 'bullet-boomerang',
    critTexture: 'bullet-boomerang-crit',
    color: 0x00ff88,
  },
};

// Tier multipliers
export const TIER_MULTIPLIERS = {
  1: {
    damage: 1.0,
    fireRate: 1.0, // multiplier for fire interval (1.0 = base speed)
    projectiles: 0, // extra projectiles
  },
  2: {
    damage: 1.5,
    fireRate: 0.75, // 25% faster (lower interval)
    projectiles: 1, // +1 projectile for multi-shot weapons
  },
  3: {
    damage: 2.0,
    fireRate: 0.5, // 50% faster
    projectiles: 2, // +2 projectiles
    special: true, // Enables T3 special effects
  },
};

// Get weapon names for random selection
export const WEAPON_IDS = Object.keys(WEAPONS);

/**
 * Get weapon stats with tier applied
 * @param {string} weaponId - Weapon ID
 * @param {number} tier - Tier (1-3)
 * @returns {Object} Weapon stats with tier bonuses
 */
export function getWeaponWithTier(weaponId, tier) {
  const weapon = WEAPONS[weaponId];
  if (!weapon) {
    console.error(`Unknown weapon: ${weaponId}`);
    return null;
  }

  const tierMult = TIER_MULTIPLIERS[tier];
  if (!tierMult) {
    console.error(`Invalid tier: ${tier}`);
    return null;
  }

  // Calculate projectile count for spread weapons
  let projectileCount = weapon.projectileCount;
  if (weapon.behavior === 'spread' || weapon.behavior === 'shotgun') {
    projectileCount += tierMult.projectiles;
  }

  return {
    ...weapon,
    tier,
    damage: Math.round(weapon.baseDamage * tierMult.damage),
    fireRate: Math.round(weapon.baseFireRate * tierMult.fireRate),
    speed: weapon.baseSpeed,
    projectileCount,
    hasSpecial: tierMult.special || false,
    displayName: `${weapon.name} T${tier}`,
  };
}

/**
 * Get a random weapon ID different from the current one
 * @param {string} currentWeaponId - Current weapon ID to exclude
 * @returns {string} Random weapon ID
 */
export function getRandomWeaponId(currentWeaponId) {
  const availableWeapons = WEAPON_IDS.filter((id) => id !== currentWeaponId);
  return availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
}

/**
 * Determine next weapon based on rotation rules
 * 40% chance: Same weapon upgrades to next tier (if not T3)
 * 60% chance: Random different weapon (resets to T1)
 * @param {string} currentWeaponId - Current weapon ID
 * @param {number} currentTier - Current tier
 * @returns {Object} { weaponId, tier }
 */
export function rotateWeapon(currentWeaponId, currentTier) {
  const roll = Math.random();

  // 40% chance to upgrade if not already T3
  if (roll < 0.4 && currentTier < 3) {
    return {
      weaponId: currentWeaponId,
      tier: currentTier + 1,
      upgraded: true,
    };
  }

  // 60% chance (or if already T3): Get random different weapon at T1
  return {
    weaponId: getRandomWeaponId(currentWeaponId),
    tier: 1,
    upgraded: false,
  };
}

export default WEAPONS;

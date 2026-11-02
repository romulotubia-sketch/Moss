interface AbilityIconProps {
  iconKey: string;
  className?: string;
}

export function AbilityIcon({ iconKey, className = 'w-6 h-6' }: AbilityIconProps) {
  switch (iconKey) {
    case 'claw':
      // Zombie Claw: 3 sharp curved spectral claw slash marks + glint
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 23C10 15 16 9 25 6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M8 27C13 19 19 13 27 10"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M13 28C17 22 22 18 28 15"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="24" cy="7" r="2" fill="currentColor" />
        </svg>
      );

    case 'ripper':
      // Flesh Ripper: Crossed X twin-claw rend shockwave
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 7L27 25M9 5L27 20M5 12L23 27"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M27 7L5 25M23 5L5 20M27 12L9 27"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.88"
          />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </svg>
      );

    case 'plague':
      // Plague Burst: Bubbling spore nova with toxic droplets
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2.6" />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
          <circle cx="16" cy="5.5" r="2.3" fill="currentColor" />
          <circle cx="16" cy="26.5" r="2.3" fill="currentColor" />
          <circle cx="5.5" cy="16" r="2.3" fill="currentColor" />
          <circle cx="26.5" cy="16" r="2.3" fill="currentColor" />
          <circle cx="8.8" cy="8.8" r="1.8" fill="currentColor" />
          <circle cx="23.2" cy="23.2" r="1.8" fill="currentColor" />
          <circle cx="23.2" cy="8.8" r="1.8" fill="currentColor" />
          <circle cx="8.8" cy="23.2" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'embrace':
      // Death's Embrace: Spectral undead hand rising from cracked earth
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 25H27"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M12 25V15L9.5 11.5M15.5 25V12.5L15.5 7.5M19 25V13L20.5 8.5M21.5 25V16.5L24 13.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 27.5L13 25L16 28L20 25L23 27.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'dash':
      // Rotting Dash: Forward phase arrow with trailing poison pools
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 8L26 16L12 24L16 16L12 8Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 12H11M3 16H13M5 20H11"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="24.5" r="2" fill="currentColor" />
          <circle cx="11.5" cy="26" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'regen':
      // Undead Regeneration: Stitched heart with sprouting leaf & heal cross
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 26.5C16 26.5 6.5 20.5 6.5 13.5C6.5 10.2 9.1 7.8 12.1 7.8C14 7.8 15.3 8.8 16 10.1C16.7 8.8 18 7.8 19.9 7.8C22.9 7.8 25.5 10.2 25.5 13.5C25.5 20.5 16 26.5 16 26.5Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M16 13.5V19.5M13 16.5H19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 8V4.5M16 5C19 3.5 20.5 5.5 18 6.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'apocalypse':
      // Zombie Apocalypse: Trio of cute undead minion skulls rising
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="13" r="6" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="14" cy="12.5" r="1.3" fill="currentColor" />
          <circle cx="18" cy="12.5" r="1.3" fill="currentColor" />
          <path d="M16 7V4.5L18.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="19" r="4.5" stroke="currentColor" strokeWidth="2.1" />
          <circle cx="24" cy="19" r="4.5" stroke="currentColor" strokeWidth="2.1" />
          <path d="M13 24H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'graveyard':
      // Graveyard Eruption: Carved runic tombstone + erupting energy lines
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M9 26V13C9 9.134 12.134 6 16 6C19.866 6 23 9.134 23 13V26"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path d="M5 26H27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M16 11V19M13 14.5H19" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M5 19L7.5 15M27 19L24.5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'lord':
      // Lord of Decay: Sovereign horned crown with ascending aura
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 22L4.5 10L11.5 15L16 7L20.5 15L27.5 10L26 22H6Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M7 25.5H25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="17.5" r="2" fill="currentColor" />
        </svg>
      );

    case 'dodge':
      // Dodge Hop: Nimble wind-dash boot arc
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M7 21C11 13 18 11 26 13"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21 9L26.5 13L21.5 17.5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M5 25H16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'interact':
      // Contextual Interact: Glowing lantern / chest star
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 5L19 13L27 16L19 19L16 27L13 19L5 16L13 13L16 5Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="2.5" fill="currentColor" />
        </svg>
      );

    case 'bone_strike':
      // Bone Strike: Sharpened serrated bone blade with crossguard
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M7 25L12 20M9 17L15 23"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M12.5 19.5L25.5 6.5L23.5 12.5L19.5 13.5L18.5 17.5L12.5 19.5Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="26" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'bone_slash':
      // Bone Slash: Wide multi-ribbon physical blade arc + bone splinters
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 22C9 12 17 7 27 8C21 12 16 17 14 26"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 25C13 17 19 13 26 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M23 5L26 4M27 17L29 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'bone_spear':
      // Bone Spear: Barbed piercing bone javelin + slipstream rings
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path d="M5 27L24 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path
            d="M27 5L17 8.5L20.5 11.5L23.5 15L27 5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 19C9 15 13 13 16 15M13 23C15 21 18 19 17 16"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'ribcage_shield':
      // Ribcage Shield: Curved interlocking skeletal ribs forming an aegis
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path d="M16 5V27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path
            d="M7 10C10 7.5 22 7.5 25 10M6 15.5C10 13 22 13 26 15.5M8 21C11 19 21 19 24 21"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'skeletal_rush':
      // Skeletal Rush: High-speed twin-chevron blade dash
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M14 7L27 16L14 25L18.5 16L14 7Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M7 10L15 16L7 22"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M3 16H9" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      );

    case 'bone_storm':
      // Bone Storm: Swirling vortex of orbiting bone shards
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 7C21.5 7 25.5 11 25.5 16C25.5 21 21.5 25 16 25C10.5 25 6.5 21 6.5 16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeDasharray="5 4"
          />
          <path
            d="M16 4L19 8L15 9Z"
            fill="currentColor"
          />
          <path d="M12 12L20 20M20 12L12 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'bone_colossus':
      // Bone Colossus: Horned giant skull crest + sovereign aura
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M9 12C5 9 4 5 6 4C8 6 10 8 12 9M23 12C27 9 28 5 26 4C24 6 22 8 20 9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 16C9.5 11.8 12.4 9 16 9C19.6 9 22.5 11.8 22.5 16C22.5 18.8 21 20.5 19.5 21.5V25H12.5V21.5C11 20.5 9.5 18.8 9.5 16Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="13.5" cy="15.5" r="1.5" fill="currentColor" />
          <circle cx="18.5" cy="15.5" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'army_of_bones':
      // Army of Bones: Skeletal warrior skull + crossed bone swords
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path d="M6 25L26 7M26 25L6 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="16" cy="15" r="6" fill="#161C23" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="14" cy="14.5" r="1.3" fill="currentColor" />
          <circle cx="18" cy="14.5" r="1.3" fill="currentColor" />
        </svg>
      );

    case 'reapers_judgment':
      // Reaper's Judgment: Curved Spectral Scythe + dark energy crescent
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path d="M8 27L22 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path
            d="M20 7C26 8 28.5 14 25 21C23.5 15.5 20.5 12 16.5 11.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M6 16C8 11 12 8 17 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    case 'passive_resilience':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 26C16 26 7 20.2 7 13.5C7 10.4 9.5 8 12.4 8C14.2 8 15.4 9 16 10.2C16.6 9 17.8 8 19.6 8C22.5 8 25 10.4 25 13.5C25 20.2 16 26 16 26Z"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M16 13V19M13 16H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'passive_plague':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="18" r="5.5" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="21" cy="11" r="3.5" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="16" cy="18" r="2" fill="currentColor" />
        </svg>
      );

    case 'passive_framework':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 5L25 9V16.5C25 21.8 21.1 25.8 16 27.5C10.9 25.8 7 21.8 7 16.5V9L16 5Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M11 13.5H21M12 18H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'passive_mastery':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path d="M7 25L24 8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <path
            d="M23 5L24.5 8.5L28 10L24.5 11.5L23 15L21.5 11.5L18 10L21.5 8.5L23 5Z"
            fill="currentColor"
          />
          <path d="M9 17L15 23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'twin_daggers':
      // Twin Dagger Strikes: Crossed curved rogue daggers + glint
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M7 25L12 20M9 17.5L14.5 23M12 20C16 14 20.5 10 26 7C23 12.5 19 17 12 20Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 25L20 20M23 17.5L17.5 23M20 20C16 14 11.5 10 6 7C9 12.5 13 17 20 20Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.88"
          />
        </svg>
      );

    case 'dagger_flurry':
      // Dagger Flurry: Multi-angle rapid fan of dagger slashes + crit spark
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 21L26 8M5 16L27 16M6 11L26 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="16" r="2.3" fill="currentColor" />
          <circle cx="21" cy="9" r="1.8" fill="currentColor" />
          <circle cx="21" cy="23" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'shadowstep':
      // Shadowstep: Dissolving shadow crescent blinking into backstab dagger point
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 23C6 14 12 8 21 8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="4 3.5"
          />
          <path
            d="M19 5L27 10L19 15L21.5 10L19 5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M13 26L25 14M17 26L21 22"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'explosive_trap':
      // Explosive Trap: Toothed spring-plate mechanism + blast spark above
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <ellipse cx="16" cy="21" rx="10" ry="5" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="16" cy="21" r="2.5" fill="currentColor" />
          <path
            d="M16 5L18 11L24 9L19.5 14L23 16.5M16 5L14 11L8 9L12.5 14L9 16.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'windrunner':
      // Windrunner: Swirling gale slipstreams + swift leaf
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 13H21C23.5 13 25 11.2 25 9.2C25 7.2 23.3 5.8 21.3 6.2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M3 18.5H24.5C26.8 18.5 28 20.2 28 22C28 23.8 26.5 25.2 24.5 25"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M6 24H16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'poisoned_blades':
      // Poisoned Blades: Rogue dagger dripping virulent venom droplets
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 23L11 18M8.5 15L14 20.5M11.5 17.5L25 6L20 18.5L11.5 17.5Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23 18C23 18 20.5 21.5 20.5 23.2C20.5 24.6 21.6 25.8 23 25.8C24.4 25.8 25.5 24.6 25.5 23.2C25.5 21.5 23 18 23 18Z"
            fill="currentColor"
          />
        </svg>
      );

    case 'phantom_frenzy':
      // Phantom Frenzy: 4-way converging assassin clone star-slash
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 5L27 27M27 5L5 27"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M16 3V29M3 16H29"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            opacity="0.72"
          />
          <circle cx="16" cy="16" r="3.5" fill="#161C23" stroke="currentColor" strokeWidth="2.4" />
        </svg>
      );

    case 'king_of_thieves':
      // King of Thieves: Roguish jagged thief crown + shadow portal dagger
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 19L5 9.5L11.5 14L16 6.5L20.5 14L27 9.5L26 19H6Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M8 24C11 21.5 21 21.5 24 24"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="16" cy="14.5" r="1.9" fill="currentColor" />
        </svg>
      );

    case 'thousand_daggers':
      // Thousand Daggers: Rain of enchanted daggers plunging downward
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 4V21M13 10H19M16 25L13.5 19H18.5L16 25Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 7V19M6 11H10M8 22L6.3 17.5H9.7L8 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <path
            d="M24 7V19M22 11H26M24 22L22.3 17.5H25.7L24 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <path d="M5 27H27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'passive_nimble_reflexes':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 20C10 12 17 10 26 12M9 25C13 19 19 17 25 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="12" r="2.3" fill="currentColor" />
        </svg>
      );

    case 'passive_opportunistic_predator':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.3" strokeDasharray="5 3.5" />
          <path d="M11 11L21 21M21 11L11 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.2" fill="currentColor" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      );
  }
}

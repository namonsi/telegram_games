import type { CaseMeta } from '../src/game/mystery.js';

export type MysteryCase = CaseMeta & { id: string; culpritId: string; solution: string };

// SERVER-ONLY: never imported by anything under src/ so culprits never reach the client bundle
export const MYSTERY_CASES: MysteryCase[] = [
  {
    id: 'ring',
    title: 'The Vanished Ring',
    story:
      'During a villa dinner party, Grandma Ada\'s engagement ring disappeared from the locked bedroom upstairs between 8:00 and 10:00 pm. The jewelry box was untouched except for the empty ring slot, and the bedroom door was still locked afterward — opened only with a four-digit code. Four people had access to the code. One of them took it.',
    suspects: [
      { id: 'marco', name: 'Marco the Waiter', blurb: 'Served the dinner table all night. Polite, quick, everywhere.' },
      { id: 'elena', name: 'Elena the Sister', blurb: 'Hosted the party. Upstairs twice early evening, then downstairs.' },
      { id: 'tessa', name: 'Tessa the Best Friend', blurb: 'Maid of honor. Knew the code too — "Ada made me memorize it."' },
      { id: 'ravi', name: 'Ravi the Gardener', blurb: 'Finished trimming hedges at dusk. Left before dinner started.' },
    ],
    clues: [
      'The ring was last seen at 7:45 pm when Ada put it in the box before going down to greet guests.',
      'Six guests independently confirm Marco never left the dining terrace between 8:00 and 10:00 pm.',
      'Fresh garden mud was tracked across the upstairs hallway carpet.',
      'The estate gate log shows Ravi checked out at 6:05 pm and never re-entered that night.',
      'Phone records place Elena on a video call with her fiancé from 8:15 to 9:40 pm, camera on, in the kitchen.',
      'A pearl hairpin was found beneath the bedroom windowsill — Tessa wore an identical set all evening and swears she never went upstairs after 7:00.',
      'The bedroom lock has no scratches or damage: whoever entered punched in the correct four-digit code.',
      'The villa wifi log shows a device named "Tessa\'s Phone 📱" pinging the bedroom-range extender at 8:22 pm.',
    ],
    culpritId: 'tessa',
    solution:
      'Tessa slipped away during dinner, let herself in with the code she had memorized, pocketed the ring, and slipped out through the garden door — leaving mud on the hall carpet and her hairpin by the window. Her phone betrayed her: it auto-joined the bedroom extender at 8:22 pm.',
  },
  {
    id: 'song',
    title: 'The Leaked Song',
    story:
      'Pop duo Nova&June finished their secret single "Midnight Coffee" on Friday. By Monday morning it was trending on a leak forum — two days before its premiere. The studio copy lived on one laptop, played exactly three times. Whoever leaked it had studio access that weekend.',
    suspects: [
      { id: 'dev', name: 'Dev the Producer', blurb: 'Mixed the track. Left Friday 11 pm, says he "went straight home."' },
      { id: 'pip', name: 'Pip the Intern', blurb: 'Cleans the studio weekends. Has building keys but no laptop password.' },
      { id: 'sol', name: 'Sol the Label Exec', blurb: 'Was in Miami at a conference all weekend — allegedly.' },
      { id: 'reina', name: 'Reina the Neighbor', blurb: 'Runs the coffee cart downstairs. Close with both artists.' },
    ],
    clues: [
      'The leak appeared online Sunday at 11:52 pm, tagged "recorded off-speakers, sorry for background hum."',
      'Audio forensics: the leaked version contains faint espresso machine hiss in quiet passages.',
      'Studio keycard log: Dev entered Saturday 9:12 am and left 10:40 am — contradicting his "went straight home."',
      'The laptop was found still logged in; its password is written on a sticky note under the keyboard.',
      'Pip\'s keycard shows weekend entries only on Sunday morning, 7–9 am, cleaning hours — before the leak posted.',
      'Sol\'s conference badge scans show him in Miami panels continuously from Saturday morning through Monday.',
      'The studio speaker system has a known quirk: playing without logging "airplay mode" leaves a session marker. One exists: Saturday 10:21 am.',
      'The coffee cart\'s card terminal places Reina\'s stand at the farmers market all day Sunday, twelve transactions, none near the studio.',
    ],
    culpritId: 'dev',
    solution:
      'Dev came in Saturday morning, played the track aloud, and recorded it off the speakers — the espresso-hiss and the 10:21 airplay marker prove playback happened while only his keycard was inside. His keycard exit at 10:40 sealed it: the leak posted hours later from elsewhere, but the recording was his.',
  },
  {
    id: 'picnic',
    title: 'The Rooftop Thief',
    story:
      'The Moonlight Picnic Club meets every full moon on the Harlow Building rooftop. Three meetings in a row something vanished: a tin of cookies, a bottle of elderflower cordial, and finally a silver lantern. Same pattern each time — items taken mid-evening, while everyone was watching the city lights. Five regular members, one of them a repeat thief.',
    suspects: [
      { id: 'nadia', name: 'Nadia the Organizer', blurb: 'Brings the baskets, sets the blankets, never sits down.' },
      { id: 'oskar', name: 'Oskar the Photographer', blurb: 'Shoots long exposures from the far corner most of the night.' },
      { id: 'june', name: 'June the Baker', blurb: 'Made the cookie tin herself. Sits closest to the snack basket.' },
      { id: 'felix', name: 'Felix the Newcomer', blurb: 'Joined this season. Charming. Always first to suggest stargazing.' },
    ],
    clues: [
      'All three thefts happened within ten minutes of Felix calling everyone over to "look at that constellation."',
      'Nadia was fetching ice from the stairwell during theft number one; the doorman saw her the whole time.',
      'Oskar\'s long-exposure photos accidentally capture the whole rooftop every meeting — timestamps line up with each theft window.',
      'In photo #1, everyone is visible in frame except June, whose blanket chair is empty for four minutes.',
      'In photo #2 and #3, June is clearly in frame beside the basket the entire time.',
      'The stairwell camera caught nobody carrying anything out — the stolen goods never left the roof that night.',
      'A hidden storage nook behind the water tank holds the cookie tin, the empty cordial bottle, and the silver lantern, arranged like a shrine.',
      'Fingerprints on the lantern are smudged by gardening gloves — June wears fingerless baking gloves; Nadia keeps a gardening kit up there.',
    ],
    culpritId: 'nadia',
    solution:
      'Nadia orchestrated the distractions and stashed everything behind the water tank, gloved. She never sat down because she was curating her "lost picnic" scene. The doorman\'s alibi covers her absence during theft one — she was already hiding the cookies behind the tank when she fetched ice.',
  },
];

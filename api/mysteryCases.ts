import type { CaseMeta } from '../src/game/mystery.js';

export type MysteryCase = CaseMeta & { id: string; culpritId: string; solution: string };

// SERVER-ONLY: never imported by anything under src/ so culprits never reach the client bundle.
// Cases follow the classic detective formula: evidence artifacts, red herrings, motive/means/opportunity.
export const MYSTERY_CASES: MysteryCase[] = [
  {
    id: 'ring',
    title: 'The Vanished Ring',
    scene: '💍🌙🏡✨',
    story:
      'During a villa dinner party, Grandma Ada\'s engagement ring disappeared from the locked bedroom upstairs between 8:00 and 10:00 pm. The jewelry box was open, the ring gone, and the door — which only opens with a four-digit code — was locked again afterward. Four people knew the code. One of them took it.',
    suspects: [
      { id: 'marco', name: 'Marco the Waiter', blurb: 'Served the dinner table all night. Polite, quick, everywhere.', avatar: '🍽️', color: '#4a7ba6' },
      { id: 'elena', name: 'Elena the Sister', blurb: 'Hosted the party. Went upstairs twice before dinner.', avatar: '💃', color: '#a64a7b' },
      { id: 'tessa', name: 'Tessa the Best Friend', blurb: 'Maid of honor. "Ada made me memorize the code."', avatar: '👰', color: '#8a6d3b' },
      { id: 'ravi', name: 'Ravi the Gardener', blurb: 'Finished the hedges at dusk. Left before dinner.', avatar: '🌿', color: '#4a7b52' },
    ],
    clues: [
      'EVIDENCE LOG — Ring last seen 7:45 pm: Ada filmed a story showing the box before joining the guests.',
      'STAFF SHEET — Marco was assigned table service 8:00–10:00 pm; six guests confirm he never left the terrace.',
      'FORENSICS — Fresh garden mud, pressed heel pattern, tracked across the upstairs hallway carpet.',
      'GATE LOG — Ravi badged out at 6:05 pm. No re-entry recorded for the rest of the night.',
      'PHONE RECORDS — Elena on video call with her fiancé 8:15–9:40 pm, camera on, from the kitchen. [RED HERRING: an early suspect]',
      'PHOTO — Party snapshot at 7:58 pm: Tessa by the stairs, hairpin glinting — the pearl set she wore all evening.',
      'LOCK REPORT — No scratches on the bedroom lock. The correct code was typed in. Only family and the maid of honor knew it.',
      'WIFI LOG — 8:22 pm: device "Tessa\'s Phone 📱" auto-joined the bedroom-range extender.',
    ],
    culpritId: 'tessa',
    solution:
      'Tessa slipped out during dinner, typed in the code she had "memorized", pocketed the ring and left through the garden door — mud on her heels, hairpin by the window. Her phone betrayed her: it auto-joined the bedroom extender at 8:22 pm. Motive: debts she\'d been hiding from everyone, including Ada.',
  },
  {
    id: 'song',
    title: 'The Leaked Song',
    scene: '🎵🎧🌃☕',
    story:
      'Pop duo Nova&June finished their secret single "Midnight Coffee" on Friday. By Monday morning it was trending on a leak forum — two days before its premiere. The studio copy lived on one laptop, played exactly three times. Whoever leaked it had studio access that weekend.',
    suspects: [
      { id: 'dev', name: 'Dev the Producer', blurb: 'Mixed the track. "Went straight home" Friday night.', avatar: '🎚️', color: '#6b4aa6' },
      { id: 'pip', name: 'Pip the Intern', blurb: 'Cleans the studio weekends. Has building keys, no laptop password.', avatar: '🧹', color: '#3b8a8a' },
      { id: 'sol', name: 'Sol the Label Exec', blurb: 'At a Miami conference all weekend — allegedly.', avatar: '🕶️', color: '#a6744a' },
      { id: 'reina', name: 'Reina the Neighbor', blurb: 'Runs the coffee cart downstairs. Close with both artists.', avatar: '☕', color: '#a64a4a' },
    ],
    clues: [
      'FORUM TIMESTAMP — Leak posted Sunday 11:52 pm, tagged "recorded off-speakers, sorry for the hum."',
      'AUDIO FORENSICS — Faint espresso-machine hiss in the quiet passages of the leaked file.',
      'KEYCARD LOG — Dev entered Saturday 9:12 am, exited 10:40 am. He had told everyone he never came in.',
      'STUDIO NOTE — Laptop password on a sticky note under the keyboard. Anyone inside could play the track.',
      'KEYCARD LOG — Pip\'s weekend entries: Sunday 7–9 am only, standard cleaning round. [RED HERRING: the convenient suspect]',
      'CONFERENCE APP — Sol\'s badge scanned into every Miami panel from Saturday dawn to Monday. No gaps.',
      'SYSTEM MARKER — The speakers leave an "airplay session" marker when played without logging in. One marker exists: Saturday 10:21 am.',
      'TERMINAL DATA — Reina\'s card machine: twelve farmers-market transactions on Sunday, zero near the studio.',
    ],
    culpritId: 'dev',
    solution:
      'Dev came in Saturday morning, played the track aloud and recorded it off the speakers — the espresso hiss and the 10:21 am airplay marker prove playback happened while only his keycard was inside. He lied about the visit entirely. Motive: he\'d been cut out of the songwriting credits and wanted leverage.',
  },
  {
    id: 'picnic',
    title: 'The Rooftop Thief',
    scene: '🌙🧺🏮🏙️',
    story:
      'The Moonlight Picnic Club meets every full moon on the Harlow Building rooftop. Three meetings in a row something vanished: a tin of cookies, a bottle of elderflower cordial, and finally a silver lantern. Always mid-evening, always while everyone watched the city lights. Five regular members. One repeat thief.',
    suspects: [
      { id: 'nadia', name: 'Nadia the Organizer', blurb: 'Brings the baskets, sets the blankets, never sits down.', avatar: '🧺', color: '#7b4aa6' },
      { id: 'oskar', name: 'Oskar the Photographer', blurb: 'Shoots long exposures from the far corner all night.', avatar: '📷', color: '#4a4a7b' },
      { id: 'june', name: 'June the Baker', blurb: 'Baked the cookie tin herself. Sits closest to the basket.', avatar: '🍪', color: '#a6854a' },
      { id: 'felix', name: 'Felix the Newcomer', blurb: 'Joined this season. Always first to suggest stargazing.', avatar: '✨', color: '#4a8a6d' },
    ],
    clues: [
      'MEETING NOTES — Every theft happened within ten minutes of Felix calling everyone to "look at that constellation." [RED HERRING: the obvious suspect]',
      'DOORMAN STATEMENT — During theft #1 Nadia was in the stairwell fetching ice — he saw her the entire time. Or so he says.',
      'PHOTO METADATA — Oskar\'s long exposures capture the whole rooftop every meeting; timestamps match each theft window.',
      'PHOTO #1 — Everyone in frame except June: her blanket chair sits empty for four minutes. [RED HERRING: the close suspect]',
      'PHOTOS #2 & #3 — June clearly beside the basket the whole time. Her early absence never repeats.',
      'STAIRWELL CAMERA — Nobody carried anything out on any of the three nights. The goods never left the roof.',
      'HIDDEN NOOK — Behind the water tank: the cookie tin, the empty cordial bottle and the silver lantern, arranged like a shrine.',
      'PRINT REPORT — Lantern prints smeared by gardening gloves. June wears fingerless baking gloves; Nadia keeps a rooftop gardening kit.',
    ],
    culpritId: 'nadia',
    solution:
      'Nadia staged the distractions, stashed everything behind the water tank and gloved up — she never sat down because she was curating her "lost picnic" scene. The doorman\'s alibi covers theft #1 because she hid the cookies before fetching the ice. Motive: the club was planning to replace her as organizer; she wanted a mystery only she could "solve".',
  },
  {
    id: 'cupcake',
    title: 'The Fairground Poisoning',
    scene: '🧁🎪🏆🤢',
    story:
      'Baker Marigold Bloom collapsed mid-judging at the County Fair — her showstopper cupcake had been laced with something bitter. She survived after a night in hospital, but she\'s out of the competition, and rival baker Dolly Winslow walked away with the blue ribbon. Four people were near Marigold\'s station in the crucial twenty minutes. One of them did it.',
    suspects: [
      { id: 'dolly', name: 'Dolly Winslow', blurb: 'The reigning champion. Five blue ribbons on her shelf.', avatar: '🎀', color: '#c25a8a' },
      { id: 'gus', name: 'Gus the Gatekeeper', blurb: 'Checks wristbands at the tent. Sees everyone coming and going.', avatar: '🎟️', color: '#5a7ba6' },
      { id: 'wren', name: 'Wren the Apprentice', blurb: 'Marigold\'s own apprentice. Carried the ingredients in.', avatar: '🥣', color: '#4a8a6d' },
      { id: 'hank', name: 'Hank the Ex-Partner', blurb: 'Marigold\'s former business partner. Sued her last spring — and lost.', avatar: '🧑‍⚖️', color: '#a6744a' },
    ],
    clues: [
      'TENT MAP — Only four people entered the baking station between 2:10 and 2:30 pm: Dolly, Gus, Wren, Hank.',
      'LAB REPORT — The bitter taste was bitter almond extract — food-grade, sold at the fair\'s own hobby stall.',
      'RECEIPT — Hobby-stall ledger, 1:38 pm: one bottle of almond extract, paid CASH. No name. [RED HERRING: anyone could have bought it]',
      'WRISTBAND LOG — Gus never left the gate 1:50–2:40 pm; two volunteers confirm. He only poked his head in at 2:15 to check a banner.',
      'WITNESS STATEMENT — Wren carried Marigold\'s ingredient box in at 2:12 — sealed, and Marigold iced the cupcakes herself from it.',
      'SUE DOCKET — Hank lost his lawsuit in April; the court ordered HIM to pay Marigold\'s legal fees. [RED HERRING: the angry suspect]',
      'SECURITY STILL — 2:24 pm, someone in a pink ruffle sleeve — Dolly\'s signature — leaning over Marigold\'s display. Face out of frame.',
      'FABRIC SCAN — Pink sugar-glitter fibers, matching Dolly\'s famous ruffled sleeves, found on the cupcake box lid.',
    ],
    culpritId: 'dolly',
    solution:
      'Dolly bought the almond extract at the hobby stall with cash, then used a "congratulations" lean over the display to doctor the cupcake — her ruffled sleeve left glitter fibers on the box lid and her pink ruffle is on the security still at 2:24 pm. Motive: Marigold\'s new pastry was about to end Dolly\'s five-year winning streak.',
  },
  {
    id: 'lighthouse',
    title: 'Murder at the Lighthouse',
    scene: '🗼🌊🌫️🕯️',
    story:
      'Keeper Elias Marsh was found at the foot of the lighthouse stairs at dawn — a fall, the constable says, but his tea mug was still warm on the desk upstairs and the lamp log had an entry Elias could not have written. The ferry brings the mainland constable at noon. Until then, four islanders who visited Elias last evening must account for themselves.',
    suspects: [
      { id: 'mira', name: 'Mira the Ferrywoman', blurb: 'Brings supplies Tuesdays. Knew the tide tables by heart.', avatar: '⛵', color: '#4a7ba6' },
      { id: 'silas', name: 'Silas the Innkeeper', blurb: 'Owes the lighthouse forty years of stories — and money.', avatar: '🍺', color: '#8a6d3b' },
      { id: 'odette', name: 'Odette the Cartographer', blurb: 'Mapping the coast all summer. Very curious about the lamp.', avatar: '🗺️', color: '#a64a7b' },
      { id: 'tobin', name: 'Tobin the Deckhand', blurb: 'Elias\'s grand-nephew. In line for the keeper\'s pension.', avatar: '🪢', color: '#4a8a6d' },
    ],
    clues: [
      'LAMP LOG — 9:40 pm, in Elias\'s neat hand: "Trimmed wick. All well." But the doctor fixes Elias\'s tremor — he could not write after 8 pm.',
      'DOCTOR\'S NOTE — Elias\'s handwriting had deteriorated badly this month. The 9:40 entry is too neat to be his. Someone forged it.',
      'TEA MUG — Chamomile, still warm at dawn. Elias only drank chamomile at bedtime — meaning he was alive upstairs well past 9 pm.',
      'TIDE TABLES — The supply boat could not reach the mainland before 6 am. Whoever left by sea needed Mira\'s boat. [RED HERRING: points at the ferrywoman]',
      'BOAT LEDGER — Mira\'s rowboat logged out 8:05 pm, back 8:50 pm — a short supply run, witnessed by the harbor master. She was gone before the death window.',
      'INN LEDGER — Silas pawned a gold watch on Monday. The pawn ticket is made out to the inn, but the watch is engraved E.M. — Elias Marsh.',
      'STAIR RAIL — A smear of inn-grease (the pub\'s frying fat) on the rail at exactly hand height. Silas cooks with it every night.',
      'PENSION PAPERS — Found in the desk: Tobin\'s inheritance is void if Elias is "removed for cause" before winter — but valid forever if Elias dies naturally. Tobin had every reason NOT to touch him. [RED HERRING: the heir]',
    ],
    culpritId: 'silas',
    solution:
      'Silas climbed the tower after 9 pm, pushed Elias down the stairs in the dark, and forged the 9:40 lamp-log entry to suggest Elias died later, alone. The greasy handprint on the rail and the pawned gold watch — Elias\'s, taken from the body to settle the innkeeper\'s debts — seal it. Motive: forty years of borrowed money he could never repay.',
  },
  {
    id: 'marathon',
    title: 'The Marathon Sabotage',
    scene: '🏃🏅☀️🥤',
    story:
      'Race favorite Lena Fox pulled out at kilometer 18, dizzy and sick — her personalized electrolyte bottles had been swapped with a laxative-laced batch. Her rival took the gold. Race officials found four people had unsupervised access to the runner bottles between 6:00 and 6:30 am. One of them sabotaged the race.',
    suspects: [
      { id: 'kofi', name: 'Kofi the Rival', blurb: 'Took the gold after Lena dropped out. Has never beaten her.', avatar: '🥇', color: '#c25a8a' },
      { id: 'petra', name: 'Petra the Physio', blurb: 'Tapes Lena\'s knees. Knows her race schedule better than Lena does.', avatar: '🩹', color: '#4a7ba6' },
      { id: 'milo', name: 'Milo the Volunteer', blurb: 'Stacked the bottle crates at dawn. New to the job.', avatar: '🦺', color: '#4a8a6d' },
      { id: 'ida', name: 'Ida the Reporter', blurb: 'Covering the race. Promised an exposé "that will shake the sport."', avatar: '🎙️', color: '#a6744a' },
    ],
    clues: [
      'BOTTLE MANIFEST — Lena\'s six personal bottles were mixed up with the water-station crate between 6:00 and 6:30 am. All six were tampered with — overkill for one race.',
      'PHARMACY LOG — Laxative purchased Saturday, cash. Camera above the counter: a cap and a race volunteer jacket. [RED HERRING: frames the volunteers]',
      'JACKET CHECK — Volunteer jackets hang in an unlocked public tent. Anyone — press, staff, athletes — could take one.',
      'SCHEDULE LEAK — Ida\'s article draft (found in her car) contains Lena\'s PRIVATE bottle-mixing routine, printed word for word. [RED HERRING: she knows too much]',
      'IDA\'S SOURCE — Ida\'s notes: "deep throat is K." She paid for the tip, nothing more — her exposé was about doping, not sabotage.',
      'PHYSIO CALENDAR — Petra was taping three other runners 5:45–6:35 am, all photographed by their own teams. Rock-solid alibi.',
      'STRAVA DATA — Kofi\'s warm-up jog: his route detoured past the bottle depot 6:04–6:22 am — the exact tampering window. He told officials he never left the start pen.',
      'TREADMILL TEST — Kofi\'s watch synced a 12-minute pause at the depot coordinates, then a sprint back. He forgot watches sync to the cloud.',
    ],
    culpritId: 'kofi',
    solution:
      'Kofi bought the laxative in a volunteer jacket, slipped out of the start pen at dawn and doctored all six bottles — then jogged back like nothing happened. His watch quietly uploaded the detour to the cloud. Motive: seven straight defeats by Lena, and a sponsorship clause that paid double for a gold.',
  },
  {
    id: 'letters',
    title: 'The Stolen Love Letters',
    scene: '💌🏚️📮🌙',
    story:
      'For a month, love letters between two residents of the Alder Street boarding house never arrived — while cruel anonymous notes about the pair started appearing on the noticeboard. The landlady keeps one mailbox key. A spare exists. Four suspects had access to the hallway table where the post is sorted. One of them is the letter thief.',
    suspects: [
      { id: 'beatrix', name: 'Beatrix the Landlady', blurb: 'Runs the house with an iron broom. Hates "scandal" under her roof.', avatar: '🔑', color: '#7b4aa6' },
      { id: 'colm', name: 'Colm the Poet', blurb: 'Writes the letters. Romantic, broke, up at all hours.', avatar: '🖋️', color: '#4a7ba6' },
      { id: 'sybil', name: 'Sybil the Telephonist', blurb: 'Works the exchange. Reads everyone\'s calls like postcards.', avatar: '☎️', color: '#a6744a' },
      { id: 'harold', name: 'Harold the Retired Postman', blurb: 'Forty years on the round. Still "helps" sort the mail.', avatar: '📮', color: '#4a8a6d' },
    ],
    clues: [
      'NOTICEBOARD — The anonymous notes are written on the back of old telegraph forms from the exchange. [RED HERRING: points at the telephonist]',
      'SYBIL\'S SHIFT LOG — Sybil was on the overnight exchange for every date a letter went missing. She swears the forms were stolen from the bin, not used by her.',
      'POST OFFICE STAMP — The stolen letters never left the building: none carry a postmark. They were taken before collection.',
      'INK TEST — The anonymous notes use violet ink — the same shade as the landlady\'s rent ledger, page after page of it.',
      'BIN FINDINGS — The telegraph forms in the hallway bin were torn, not crumpled — torn by someone wearing a thimble. Beatrix mends with a thimble; Sybil never wears one.',
      'HAROLD\'S ROUTINE — Harold sorts mail at 7 am sharp, then naps until noon. The sorting table sits empty 7:05–7:50 — plenty of window, for anyone. [RED HERRING: the ex-postman]',
      'FLOORBOARD STASH — Under a loose board by the landlady\'s door: seventeen letters, unopened, tied with kitchen twine.',
      'TWINE MATCH — The kitchen twine matches the roll in the landlady\'s pantry, and the knots are grocer\'s loops — the way Beatrix ties everything.',
    ],
    culpritId: 'beatrix',
    solution:
      'Beatrix intercepted the letters from the sorting table, hid them under the floorboard, and wrote the anonymous notes in her ledger ink on stolen telegraph forms — torn with her mending thimble, tied with her kitchen twine. Motive: she disapproved of the romance and wanted the "scandal" out of her house — until the pair announced an engagement and she panicked.',
  },
  {
    id: 'masterpiece',
    title: 'The Smashed Masterpiece',
    scene: '🖼️🔨🏛️🍷',
    story:
      'The gallery\'s centerpiece — a half-million-dollar seascape, three days from auction — was found smashed in its frame on Monday morning. The frame is intact; the canvas was destroyed from the FRONT, by someone who knew exactly what they were looking at. The gallery was locked all night. Four keys exist. One of them opened more than a door.',
    suspects: [
      { id: 'vera', name: 'Vera the Curator', blurb: 'Discovered the "masterpiece". Her reputation rests on it.', avatar: '🎩', color: '#6b4aa6' },
      { id: 'anton', name: 'Anton the Restorer', blurb: 'Cleaned the painting last week. Called it "a pretty forgery."', avatar: '🧽', color: '#3b8a8a' },
      { id: 'lola', name: 'Lola the Intern', blurb: 'Last one out Friday. Adores the painting — has a tattoo of it.', avatar: '🌊', color: '#4a7ba6' },
      { id: 'mrgray', name: 'Mr. Gray the Buyer', blurb: 'Quiet collector who paid for a private viewing Saturday.', avatar: '🕴️', color: '#555f6b' },
    ],
    clues: [
      'AUCTION DOSSIER — The seascape\'s authenticity certificate expires this week: a forensic re-examination was scheduled for Thursday.',
      'RESTORER\'S EMAIL — Anton to the auction house, Friday 11 pm: "Under the varnish the brushwork is wrong. I will confirm Thursday." [RED HERRING: he had the biggest motive to bury it]',
      'GLASS ANALYSIS — The canvas was cut, THEN the frame smashed over it — staged vandalism, done calmly, in that order.',
      'KEY LOG — Lola signed out Friday 7:02 pm, alarm set 7:10 pm. Night patrol confirms no re-entry on her key all weekend.',
      'VIEWING BOOK — Mr. Gray\'s private viewing: Saturday 2–3 pm, alone with the painting, escorted. He left before the alarm was tested at 3:15.',
      'INSURANCE CLAUSE — The gallery\'s policy pays the full half-million for "vandalism" — but nothing for a fake exposed at auction.',
      'UV SWEEP — Fresh pencil marks under the smashed canvas: "copy after original — V." Written by whoever KNEW, in Vera\'s cataloguing shorthand.',
      'CABINET INVENTORY — Vera\'s private cabinet holds the real seascape — a smaller study, canvas older, signed with the true monogram. She "forgot" to list it.',
    ],
    culpritId: 'vera',
    solution:
      'Vera knew Thursday\'s forensic test would expose her seascape as a copy — so she staged its "murder" on Sunday night with her own key, cutting the canvas first and smashing the frame after, to claim the vandalism payout instead of a fraud scandal. Her own cataloguing shorthand on the hidden study gives her away. Motive: the forgery was hers to bury — and the insurance would pay better than the auction.',
  },
];

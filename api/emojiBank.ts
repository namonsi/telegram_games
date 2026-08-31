// SERVER-ONLY: answers must never ship to the client bundle
// All riddles sourced from real emoji quiz sites (WikiRiddles, Typito, WikiHow, RiddlesPuzzle)
export type EmojiRiddle = { emojis: string; category: string; answer: string };

export const EMOJI_BANK: EmojiRiddle[] = [
  // ── Movies (15) ──────────────────────────────────────────────
  { emojis: '🧊🚢💔', category: 'Movie', answer: 'titanic' },
  { emojis: '🦁👑', category: 'Movie', answer: 'lion king' },
  { emojis: '🧙‍♂️🧹⚡', category: 'Movie', answer: 'harry potter' },
  { emojis: '🦖🏞️', category: 'Movie', answer: 'jurassic park' },
  { emojis: '🕷️🧑', category: 'Movie', answer: 'spiderman' },
  { emojis: '🎈🏠🎈', category: 'Movie', answer: 'up' },
  { emojis: '🐼🥋', category: 'Movie', answer: 'kung fu panda' },
  { emojis: '🔎🐟', category: 'Movie', answer: 'finding nemo' },
  { emojis: '🕰️🔙🚗⚡', category: 'Movie', answer: 'back to the future' },
  { emojis: '😈👗👠', category: 'Movie', answer: 'the devil wears prada' },
  { emojis: '👸🐸', category: 'Movie', answer: 'the princess and the frog' },
  { emojis: '🍫🏭🎩', category: 'Movie', answer: 'charlie and the chocolate factory' },
  { emojis: '🧸❤️🚀', category: 'Movie', answer: 'toy story' },
  { emojis: '❄️⛄👭', category: 'Movie', answer: 'frozen' },
  { emojis: '👽🍬🏠', category: 'Movie', answer: 'et' },

  // ── TV Shows (10) ────────────────────────────────────────────
  { emojis: '🧟‍♂️🚶', category: 'TV Show', answer: 'walking dead' },
  { emojis: '👑🐉⚔️', category: 'TV Show', answer: 'game of thrones' },
  { emojis: '💡👨‍🔬🧪', category: 'TV Show', answer: 'breaking bad' },
  { emojis: '🧲🧒📍', category: 'TV Show', answer: 'stranger things' },
  { emojis: '🦑🎮', category: 'TV Show', answer: 'squid game' },
  { emojis: '👩🏻📱🇫🇷', category: 'TV Show', answer: 'emily in paris' },
  { emojis: '👧🏻🖤👋', category: 'TV Show', answer: 'wednesday' },
  { emojis: '🏢👥', category: 'TV Show', answer: 'the office' },
  { emojis: '👩‍👩‍👧‍👦🏡', category: 'TV Show', answer: 'modern family' },
  { emojis: '🧑‍⚖️👔📂', category: 'TV Show', answer: 'suits' },

  // ── Songs (10) ───────────────────────────────────────────────
  { emojis: '☔🌧️', category: 'Song', answer: 'purple rain' },
  { emojis: '👁️🐯', category: 'Song', answer: 'eye of the tiger' },
  { emojis: '👟👟👟', category: 'Song', answer: 'ice ice baby' },
  { emojis: '🕺👑', category: 'Song', answer: 'dancing queen' },
  { emojis: '☎️🤙', category: 'Song', answer: 'call me maybe' },
  { emojis: '🕯️🌬️', category: 'Song', answer: 'candle in the wind' },
  { emojis: '🧟‍♂️🕺', category: 'Song', answer: 'thriller' },
  { emojis: '🤠🛣️🐎', category: 'Song', answer: 'old town road' },
  { emojis: '👨‍🎤✨', category: 'Song', answer: 'starboy' },
  { emojis: '🎶🎤🕺', category: 'Song', answer: 'uptown funk' },

  // ── Phrases / Idioms (15) ────────────────────────────────────
  { emojis: '🌧️🐈🐕', category: 'Phrase', answer: 'raining cats and dogs' },
  { emojis: '🐷✈️', category: 'Phrase', answer: 'when pigs fly' },
  { emojis: '🧊🍰', category: 'Phrase', answer: 'piece of cake' },
  { emojis: '🍎👁️', category: 'Phrase', answer: 'apple of my eye' },
  { emojis: '🕰️💰', category: 'Phrase', answer: 'time is money' },
  { emojis: '🥶🦶', category: 'Phrase', answer: 'cold feet' },
  { emojis: '📖🐛', category: 'Phrase', answer: 'bookworm' },
  { emojis: '🐱👜', category: 'Phrase', answer: "cat's out of the bag" },
  { emojis: '🗣️😈', category: 'Phrase', answer: 'speak of the devil' },
  { emojis: '🤴🌍', category: 'Phrase', answer: 'on top of the world' },
  { emojis: '🥜🐚', category: 'Phrase', answer: 'in a nutshell' },
  { emojis: '🤜🪵', category: 'Phrase', answer: 'knock on wood' },
  { emojis: '😢🥛', category: 'Phrase', answer: 'cry over spilled milk' },
  { emojis: '🙈🙉🙊', category: 'Phrase', answer: 'see no evil hear no evil speak no evil' },
  { emojis: '⏰🦅', category: 'Phrase', answer: 'the early bird catches the worm' },

  // ── Animals (5) ──────────────────────────────────────────────
  { emojis: '🐻🍯', category: 'Animal', answer: 'bear' },
  { emojis: '🐧❄️', category: 'Animal', answer: 'penguin' },
  { emojis: '🦁🌍', category: 'Animal', answer: 'lion' },
  { emojis: '🐘💧', category: 'Animal', answer: 'elephant' },
  { emojis: '🦊🦊', category: 'Animal', answer: 'fox' },

  // ── Food (5) ─────────────────────────────────────────────────
  { emojis: '🍕🧀', category: 'Food', answer: 'pizza' },
  { emojis: '🍣🍙', category: 'Food', answer: 'sushi' },
  { emojis: '🍔🍟', category: 'Food', answer: 'burger and fries' },
  { emojis: '🍩☕', category: 'Food', answer: 'donut' },
  { emojis: '🍝🍷', category: 'Food', answer: 'pasta' },
];

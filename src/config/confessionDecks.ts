/**
 * Pre-built Confession Decks by Theme
 * Each deck contains a short ordered list of verses phrased as first-person declarations,
 * traceable to actual Scripture references.
 *
 * Themes:
 * 1. Identity
 * 2. Healing
 * 3. Provision/Finance
 * 4. Family
 * 5. Peace/Anxiety
 * 6. Purpose
 * 7. Protection
 */

export interface ConfessionItem {
  id: string;
  deckId: string;
  title: string;
  scriptureReference: string;
  confessionText: string;
  sortOrder: number;
}

export interface ConfessionDeck {
  id: string;
  title: string;
  theme:
    | 'Identity'
    | 'Healing'
    | 'Provision/Finance'
    | 'Family'
    | 'Peace/Anxiety'
    | 'Purpose'
    | 'Protection'
    | 'Custom';
  description: string;
  isCustom?: boolean;
  items: ConfessionItem[];
}

export const PREBUILT_CONFESSION_DECKS: ConfessionDeck[] = [
  // 1. IDENTITY
  {
    id: 'deck_identity',
    title: 'Identity in Christ',
    theme: 'Identity',
    description: 'Anchor who you are in what God has declared over your life.',
    items: [
      {
        id: 'id_1',
        deckId: 'deck_identity',
        title: 'New Creation',
        scriptureReference: '2 Corinthians 5:17',
        confessionText:
          'I am a new creation in Christ Jesus. The old life has passed away; behold, all things have become new.',
        sortOrder: 1,
      },
      {
        id: 'id_2',
        deckId: 'deck_identity',
        title: 'Masterpiece of God',
        scriptureReference: 'Ephesians 2:10',
        confessionText:
          'I am God’s workmanship, handcrafted in Christ Jesus for good works which God prepared beforehand.',
        sortOrder: 2,
      },
      {
        id: 'id_3',
        deckId: 'deck_identity',
        title: 'Child of God',
        scriptureReference: 'John 1:12',
        confessionText:
          'I have received Christ and believed in His name; therefore, I have the right to be called a beloved child of God.',
        sortOrder: 3,
      },
      {
        id: 'id_4',
        deckId: 'deck_identity',
        title: 'Fearfully & Wonderfully Made',
        scriptureReference: 'Psalm 139:14',
        confessionText:
          'I praise You, Lord, for I am fearfully and wonderfully made. Wonderful are Your works, and my soul knows it well.',
        sortOrder: 4,
      },
      {
        id: 'id_5',
        deckId: 'deck_identity',
        title: 'No Condemnation',
        scriptureReference: 'Romans 8:1',
        confessionText:
          'There is now no condemnation for me, for I am in Christ Jesus and walk according to the Spirit.',
        sortOrder: 5,
      },
    ],
  },

  // 2. HEALING
  {
    id: 'deck_healing',
    title: 'Divine Health & Wholeness',
    theme: 'Healing',
    description: 'Stand upon God’s covenant promises for physical, mental, and bodily restoration.',
    items: [
      {
        id: 'heal_1',
        deckId: 'deck_healing',
        title: 'Healed by His Wounds',
        scriptureReference: '1 Peter 2:24',
        confessionText:
          'Jesus bore my sins in His own body on the cross. By His wounds and stripes, I am healed and made completely whole.',
        sortOrder: 1,
      },
      {
        id: 'heal_2',
        deckId: 'deck_healing',
        title: 'Redeemed from Disease',
        scriptureReference: 'Psalm 103:2-3',
        confessionText:
          'I bless the Lord with all my soul and forget none of His benefits: He forgives all my iniquities and heals all my diseases.',
        sortOrder: 2,
      },
      {
        id: 'heal_3',
        deckId: 'deck_healing',
        title: 'Life to Mortal Flesh',
        scriptureReference: 'Romans 8:11',
        confessionText:
          'The Spirit of Him who raised Jesus from the dead dwells in me, giving vitality, strength, and life to my mortal body.',
        sortOrder: 3,
      },
      {
        id: 'heal_4',
        deckId: 'deck_healing',
        title: 'Medicine to My Soul',
        scriptureReference: 'Proverbs 4:20-22',
        confessionText:
          'God’s words are life to my heart and health and medicine to all my flesh.',
        sortOrder: 4,
      },
      {
        id: 'heal_5',
        deckId: 'deck_healing',
        title: 'I Shall Live',
        scriptureReference: 'Psalm 118:17',
        confessionText:
          'I shall not die, but live, and proclaim the glorious works and faithfulness of the Lord.',
        sortOrder: 5,
      },
    ],
  },

  // 3. PROVISION / FINANCE
  {
    id: 'deck_provision',
    title: 'Supernatural Provision & Favor',
    theme: 'Provision/Finance',
    description: 'Release fear and declare abundance, open doors, and stewardship over resources.',
    items: [
      {
        id: 'prov_1',
        deckId: 'deck_provision',
        title: 'All Needs Supplied',
        scriptureReference: 'Philippians 4:19',
        confessionText:
          'My God supplies all my needs according to His riches in glory by Christ Jesus. I lack no good thing.',
        sortOrder: 1,
      },
      {
        id: 'prov_2',
        deckId: 'deck_provision',
        title: 'The Good Shepherd',
        scriptureReference: 'Psalm 23:1',
        confessionText:
          'The Lord is my shepherd; because He leads me, I do not want. He guides me beside still waters.',
        sortOrder: 2,
      },
      {
        id: 'prov_3',
        deckId: 'deck_provision',
        title: 'Abounding in Every Good Work',
        scriptureReference: '2 Corinthians 9:8',
        confessionText:
          'God is able to make all grace abound toward me, so that having all sufficiency in all things, I may abound in every good work.',
        sortOrder: 3,
      },
      {
        id: 'prov_4',
        deckId: 'deck_provision',
        title: 'Honor and Increase',
        scriptureReference: 'Proverbs 3:9-10',
        confessionText:
          'I honor the Lord with my substance and firstfruits; my storehouses are filled with plenty, and my life overflows with blessing.',
        sortOrder: 4,
      },
      {
        id: 'prov_5',
        deckId: 'deck_provision',
        title: 'Blessing Without Sorrow',
        scriptureReference: 'Proverbs 10:22',
        confessionText:
          'The blessing of the Lord makes me rich in every good thing, and He adds no painful sorrow to my life.',
        sortOrder: 5,
      },
    ],
  },

  // 4. FAMILY
  {
    id: 'deck_family',
    title: 'Generational Blessing & Home',
    theme: 'Family',
    description: 'Speak peace, salvation, and protection over your household, children, and marriage.',
    items: [
      {
        id: 'fam_1',
        deckId: 'deck_family',
        title: 'We Will Serve the Lord',
        scriptureReference: 'Joshua 24:15',
        confessionText:
          'As for me and my household, we will serve, honor, and follow the Lord wholeheartedly.',
        sortOrder: 1,
      },
      {
        id: 'fam_2',
        deckId: 'deck_family',
        title: 'Great Peace for Children',
        scriptureReference: 'Isaiah 54:13',
        confessionText:
          'All my children are taught by the Lord, and great is their peace, safety, and prosperity.',
        sortOrder: 2,
      },
      {
        id: 'fam_3',
        deckId: 'deck_family',
        title: 'Generation of the Upright',
        scriptureReference: 'Psalm 112:2',
        confessionText:
          'My descendants shall be mighty upon the earth; the generation of the upright will be blessed.',
        sortOrder: 3,
      },
      {
        id: 'fam_4',
        deckId: 'deck_family',
        title: 'Love in Our Home',
        scriptureReference: '1 Corinthians 13:4-7',
        confessionText:
          'Our household walks in love: patient, kind, bearing all things, believing all things, hoping all things.',
        sortOrder: 4,
      },
    ],
  },

  // 5. PEACE / ANXIETY
  {
    id: 'deck_peace',
    title: 'Peace of Mind & Freedom from Anxiety',
    theme: 'Peace/Anxiety',
    description: 'Dismantle anxiety and rest in the tranquil, unshakeable calm of the Holy Spirit.',
    items: [
      {
        id: 'peace_1',
        deckId: 'deck_peace',
        title: 'Perfect Peace',
        scriptureReference: 'Isaiah 26:3',
        confessionText:
          'God keeps me in perfect peace because my mind is anchored on Him and I trust in Him completely.',
        sortOrder: 1,
      },
      {
        id: 'peace_2',
        deckId: 'deck_peace',
        title: 'Anxious for Nothing',
        scriptureReference: 'Philippians 4:6-7',
        confessionText:
          'I am anxious for nothing. In everything by prayer and thanksgiving, God’s peace which surpasses all understanding guards my heart and mind.',
        sortOrder: 2,
      },
      {
        id: 'peace_3',
        deckId: 'deck_peace',
        title: 'Casting All Cares',
        scriptureReference: '1 Peter 5:7',
        confessionText:
          'I cast all my worries, anxieties, and concerns once and for all onto God, knowing that He cares affectionately for me.',
        sortOrder: 3,
      },
      {
        id: 'peace_4',
        deckId: 'deck_peace',
        title: 'Sound Mind',
        scriptureReference: '2 Timothy 1:7',
        confessionText:
          'God has not given me a spirit of fear, but of power, love, and a calm, well-balanced mind.',
        sortOrder: 4,
      },
      {
        id: 'peace_5',
        deckId: 'deck_peace',
        title: 'Untroubled Heart',
        scriptureReference: 'John 14:27',
        confessionText:
          'Peace Jesus has left with me; His own peace He gives to me. My heart is not troubled, neither is it afraid.',
        sortOrder: 5,
      },
    ],
  },

  // 6. PURPOSE
  {
    id: 'deck_purpose',
    title: 'Divine Purpose & Destiny',
    theme: 'Purpose',
    description: 'Walk confidently into God’s sovereign calling and fruitful assignments.',
    items: [
      {
        id: 'purp_1',
        deckId: 'deck_purpose',
        title: 'Hope and a Future',
        scriptureReference: 'Jeremiah 29:11',
        confessionText:
          'I know the thoughts and plans God has for me: plans for peace and prosperity, not for harm, to give me a future and a living hope.',
        sortOrder: 1,
      },
      {
        id: 'purp_2',
        deckId: 'deck_purpose',
        title: 'Working for Good',
        scriptureReference: 'Romans 8:28',
        confessionText:
          'All things are working together for my good, because I love God and am called according to His sovereign purpose.',
        sortOrder: 2,
      },
      {
        id: 'purp_3',
        deckId: 'deck_purpose',
        title: 'Fulfilling His Plan',
        scriptureReference: 'Psalm 138:8',
        confessionText:
          'The Lord will fulfill His purpose for me. Your steadfast love, O Lord, endures forever.',
        sortOrder: 3,
      },
      {
        id: 'purp_4',
        deckId: 'deck_purpose',
        title: 'Equipped for Everything',
        scriptureReference: 'Philippians 4:13',
        confessionText:
          'I can do all things through Christ who empowers and infuses inner strength into me.',
        sortOrder: 4,
      },
      {
        id: 'purp_5',
        deckId: 'deck_purpose',
        title: 'Confident Completion',
        scriptureReference: 'Philippians 1:6',
        confessionText:
          'I am confident of this very thing: He who began a good work in me will complete it until the day of Jesus Christ.',
        sortOrder: 5,
      },
    ],
  },

  // 7. PROTECTION
  {
    id: 'deck_protection',
    title: 'Secret Place & Divine Protection',
    theme: 'Protection',
    description: 'Declare angelic shelter, preservation, and victory over every unseen adversary.',
    items: [
      {
        id: 'prot_1',
        deckId: 'deck_protection',
        title: 'Under His Shadow',
        scriptureReference: 'Psalm 91:1-2',
        confessionText:
          'I dwell in the secret place of the Most High and abide under the shadow of the Almighty. The Lord is my refuge and my fortress.',
        sortOrder: 1,
      },
      {
        id: 'prot_2',
        deckId: 'deck_protection',
        title: 'No Weapon Prospering',
        scriptureReference: 'Isaiah 54:17',
        confessionText:
          'No weapon formed against me shall prosper, and every tongue that rises against me in judgment is condemned.',
        sortOrder: 2,
      },
      {
        id: 'prot_3',
        deckId: 'deck_protection',
        title: 'My Light and Stronghold',
        scriptureReference: 'Psalm 27:1',
        confessionText:
          'The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?',
        sortOrder: 3,
      },
      {
        id: 'prot_4',
        deckId: 'deck_protection',
        title: 'Preserved from All Evil',
        scriptureReference: 'Psalm 121:7-8',
        confessionText:
          'The Lord preserves me from all evil; He preserves my soul. The Lord guards my going out and my coming in, now and forever.',
        sortOrder: 4,
      },
      {
        id: 'prot_5',
        deckId: 'deck_protection',
        title: 'Delivered Safely',
        scriptureReference: '2 Timothy 4:18',
        confessionText:
          'The Lord will rescue me from every evil deed and bring me safely into His heavenly kingdom. To Him be glory forever.',
        sortOrder: 5,
      },
    ],
  },
];

/**
 * Low-Guilt Confession Streak Calculation:
 * Counts cumulative daily declaration milestones without penalizing or zeroing
 * out when days are skipped.
 */
export function calculateConfessionStreak(
  currentStreak: number,
  lastCompletedDate: string | null,
  todayStr: string
): { nextStreak: number; isNewDay: boolean } {
  if (!lastCompletedDate) {
    return { nextStreak: 1, isNewDay: true };
  }
  if (lastCompletedDate === todayStr) {
    // Already completed today
    return { nextStreak: currentStreak, isNewDay: false };
  }
  // Low-guilt milestone increment
  return { nextStreak: currentStreak + 1, isNewDay: true };
}

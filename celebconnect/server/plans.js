// Monthly subscription tiers. Prices in whole USD; converted to cents where needed.
const PLANS = {
  free: {
    id: 'free',
    name: 'Fan',
    price: 0,
    interval: 'month',
    perks: ['Follow unlimited stars', 'Like, comment & react', 'Standard feed'],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 4.99,
    interval: 'month',
    perks: ['Everything in Fan', 'Gold "Plus" badge on your comments', 'Ad-free feed', 'Early access to livestream posts'],
    stripePriceEnv: 'STRIPE_PRICE_PLUS',
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    price: 14.99,
    interval: 'month',
    perks: ['Everything in Plus', 'Purple "VIP" badge', 'Voice-note comments highlighted', 'Priority placement in comment threads'],
    stripePriceEnv: 'STRIPE_PRICE_VIP',
  },
};

module.exports = { PLANS };

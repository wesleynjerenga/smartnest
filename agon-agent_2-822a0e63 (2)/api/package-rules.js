const PACKAGE_RULES = [
  { name: 'STARTER', deposit: 450, monthly: 1050, daily: 35, duration: 25, referralBonus: 50, maxPurchases: 1 },
  { name: 'STARTER FLOCK', deposit: 800, monthly: 1890, daily: 63, duration: 30, referralBonus: 150, maxPurchases: 1 },
  { name: 'CHICK BOOSTER', deposit: 1600, monthly: 2850, daily: 95, duration: 30, referralBonus: 250, maxPurchases: 2 },
  { name: 'GROWER PLAN', deposit: 2100, monthly: 3900, daily: 130, duration: 30, referralBonus: 450, maxPurchases: 2 },
  { name: 'HEN BUILDER', deposit: 5000, monthly: 9000, daily: 300, duration: 30, referralBonus: 1000, maxPurchases: 2 },
  { name: 'FARM PRO', deposit: 10000, monthly: 22400, daily: 800, duration: 28, referralBonus: 2500, maxPurchases: 3 },
  { name: 'GOLDEN COOP', deposit: 15000, monthly: 37500, daily: 1500, duration: 28, referralBonus: 3500, maxPurchases: 3 },
  { name: 'MEGA FLOCK', deposit: 25000, monthly: 52500, daily: 2100, duration: 28, referralBonus: 4500, maxPurchases: 4 },
  { name: 'ELITE FLOCK', deposit: 30000, monthly: 64000, daily: 3200, duration: 28, referralBonus: 6000, maxPurchases: 5 },
];

function normalizeName(name = '') {
  return name.toUpperCase().replace(/^\s*(?:PACKAGE\s*)?\d+\.?\s*/, '').trim();
}

export function getPackageTerms(pkg, index = null) {
  const normalizedName = normalizeName(pkg?.name);
  return PACKAGE_RULES.find(rule => rule.name === normalizedName)
    || (index === null ? null : PACKAGE_RULES[index] || null);
}

export function applyPackageRules(packages) {
  return packages.map((pkg, index) => {
    const terms = getPackageTerms(pkg, index);
    if (!terms) return pkg;
    const { name, deposit, monthly, daily, duration, referralBonus, maxPurchases } = terms;
    return {
      ...pkg,
      name,
      price: deposit,
      description: JSON.stringify({ monthly, daily, duration, referralBonus, maxPurchases }),
      referral_bonus: referralBonus,
      max_purchases: maxPurchases,
    };
  });
}
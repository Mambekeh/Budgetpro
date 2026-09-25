// utils/zarChargeMap.js
// Static ZAR charge mapping for Paystack (always charges in ZAR)
// Amounts are in cents (Paystack requirement)

export const ZAR_CHARGE_MAP = {
  // Whitelisted African countries - use South Africa pricing
  "South Africa": { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  },
  "Nigeria": { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  },
  "Kenya": { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  },
  "Ghana": { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  },
  "Botswana": { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  },

  // USA, Canada, Europe - higher pricing tier
  "United States": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Canada": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "United Kingdom": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Germany": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "France": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Italy": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Spain": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Netherlands": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Belgium": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Switzerland": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Sweden": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Norway": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Denmark": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "Australia": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },
  "New Zealand": { 
    basic: 7500, 
    pro: 11500, 
    lifetime: 279900 
  },

  // Non-whitelisted Africa - lower pricing tier
  "Zimbabwe": { 
    basic: 3800, 
    pro: 7500, 
    lifetime: 99000 
  },
  "Tanzania": { 
    basic: 3800, 
    pro: 7500, 
    lifetime: 99000 
  },
  "Uganda": { 
    basic: 3800, 
    pro: 7500, 
    lifetime: 99000 
  },
  "Zambia": { 
    basic: 3800, 
    pro: 7500, 
    lifetime: 99000 
  },
  "Mozambique": { 
    basic: 3800, 
    pro: 7500, 
    lifetime: 99000 
  },

  // Rest of World - default pricing tier
  DEFAULT: { 
    basic: 4900, 
    pro: 8900, 
    lifetime: 199900 
  }
};

// Helper function to get ZAR charge amount
export const getZARChargeAmount = (countryName, planKey) => {
  if (!countryName || !planKey) return ZAR_CHARGE_MAP.DEFAULT.basic;
  
  const country = ZAR_CHARGE_MAP[countryName] || ZAR_CHARGE_MAP.DEFAULT;
  return country[planKey] || ZAR_CHARGE_MAP.DEFAULT[planKey];
};
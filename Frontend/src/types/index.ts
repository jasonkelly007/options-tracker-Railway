export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalCost: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lastUpdated: string;
  account: string;
  coveredCallsCount: number;
}

export interface OptionsPosition {
  id: number;
  underlyingSymbol: string;
  optionType: string;
  strategy: string;
  strikePrice: number;
  expirationDate: string;
  contracts: number;
  premiumPerContract: number;
  currentPrice: number;
  totalPremiumCollected: number;
  currentValue: number;
  unrealizedPnL: number;
  openDate: string;
  closeDate?: string;
  status: string;
  account: string;
  underlyingPositionId?: number;
  daysToExpiration: number;
  requiredCapital: number;
  notes: string;
  isRolled: boolean;
  rolledFromId?: number;
  rolledToId?: number;
}

export interface CreateCoveredCallDto {
  positionId: number;
  strikePrice: number;
  expirationDate: string;
  contracts: number;
  premiumPerContract: number;
  notes?: string;
}

export interface CreateCashSecuredPutDto {
  underlyingSymbol: string;
  strikePrice: number;
  expirationDate: string;
  contracts: number;
  premiumPerContract: number;
  account: string;
  notes?: string;
}

export interface RollOptionDto {
  optionsPositionId: number;
  newStrikePrice: number;
  newExpirationDate: string;
  newPremiumPerContract: number;
  closingPremium: number;
  notes?: string;
}

export interface RollHistory {
  id: number;
  fromOptionsPositionId: number;
  toOptionsPositionId: number;
  rollDate: string;
  netCredit: number;
  oldStrike: number;
  newStrike: number;
  oldExpiration: string;
  newExpiration: string;
  daysExtended: number;
  isRollUp: boolean;
  isRollDown: boolean;
  isRollOut: boolean;
  notes: string;
}

export interface DashboardSummary {
  totalPortfolioValue: number;
  totalUnrealizedPnL: number;
  totalPremiumCollected: number;
  activeCoveredCalls: number;
  activeCashSecuredPuts: number;
  positionsCount: number;
  topPositions: Position[];
  expiringOptions: OptionsPosition[];
}

export interface CsvImportResult {
  success: boolean;
  transactionsImported: number;
  errors: string[];
  warnings: string[];
  message: string;
}

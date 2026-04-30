using System;

namespace OptionsTracker.DTOs
{
    public class PositionDto
    {
        public int Id { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal AverageCost { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal TotalCost { get; set; }
        public decimal MarketValue { get; set; }
        public decimal UnrealizedPnL { get; set; }
        public decimal UnrealizedPnLPercent { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Account { get; set; } = string.Empty;
        public int CoveredCallsCount { get; set; }
    }

    public class OptionsPositionDto
    {
        public int Id { get; set; }
        public string UnderlyingSymbol { get; set; } = string.Empty;
        public string OptionType { get; set; } = string.Empty;
        public string Strategy { get; set; } = string.Empty;
        public decimal StrikePrice { get; set; }
        public DateTime ExpirationDate { get; set; }
        public int Contracts { get; set; }
        public decimal PremiumPerContract { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal TotalPremiumCollected { get; set; }
        public decimal CurrentValue { get; set; }
        public decimal UnrealizedPnL { get; set; }
        public DateTime OpenDate { get; set; }
        public DateTime? CloseDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public int? UnderlyingPositionId { get; set; }
        public int DaysToExpiration { get; set; }
        public decimal RequiredCapital { get; set; }
        public string Notes { get; set; } = string.Empty;
        public bool IsRolled { get; set; }
        public int? RolledFromId { get; set; }
        public int? RolledToId { get; set; }
    }

    public class CreateCoveredCallDto
    {
        public int PositionId { get; set; }
        public decimal StrikePrice { get; set; }
        public DateTime ExpirationDate { get; set; }
        public int Contracts { get; set; }
        public decimal PremiumPerContract { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateCashSecuredPutDto
    {
        public string UnderlyingSymbol { get; set; } = string.Empty;
        public decimal StrikePrice { get; set; }
        public DateTime ExpirationDate { get; set; }
        public int Contracts { get; set; }
        public decimal PremiumPerContract { get; set; }
        public string Account { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class RollOptionDto
    {
        public int OptionsPositionId { get; set; }
        public decimal NewStrikePrice { get; set; }
        public DateTime NewExpirationDate { get; set; }
        public decimal NewPremiumPerContract { get; set; }
        public decimal ClosingPremium { get; set; }
        public string? Notes { get; set; }
    }

    public class RollHistoryDto
    {
        public int Id { get; set; }
        public int FromOptionsPositionId { get; set; }
        public int ToOptionsPositionId { get; set; }
        public DateTime RollDate { get; set; }
        public decimal NetCredit { get; set; }
        public decimal OldStrike { get; set; }
        public decimal NewStrike { get; set; }
        public DateTime OldExpiration { get; set; }
        public DateTime NewExpiration { get; set; }
        public int DaysExtended { get; set; }
        public bool IsRollUp { get; set; }
        public bool IsRollDown { get; set; }
        public bool IsRollOut { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class TransactionDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Amount { get; set; }
        public decimal Fees { get; set; }
        public string Account { get; set; } = string.Empty;
        public string? OptionType { get; set; }
        public decimal? StrikePrice { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
    }

    public class DashboardSummaryDto
    {
        public decimal TotalPortfolioValue { get; set; }
        public decimal TotalUnrealizedPnL { get; set; }
        public decimal TotalPremiumCollected { get; set; }
        public int ActiveCoveredCalls { get; set; }
        public int ActiveCashSecuredPuts { get; set; }
        public int PositionsCount { get; set; }
        public List<PositionDto> TopPositions { get; set; } = new();
        public List<OptionsPositionDto> ExpiringOptions { get; set; } = new();
    }
}

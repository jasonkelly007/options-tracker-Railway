using Microsoft.EntityFrameworkCore;
using OptionsTracker.Data;
using OptionsTracker.Models;
using OptionsTracker.DTOs;

namespace OptionsTracker.Services
{
    public interface IOptionsService
    {
        Task<List<OptionsPositionDto>> GetAllOptionsPositionsAsync(string? account = null, PositionStatus? status = null);
        Task<OptionsPositionDto?> GetOptionsPositionByIdAsync(int id);
        Task<OptionsPositionDto> CreateCoveredCallAsync(CreateCoveredCallDto dto);
        Task<OptionsPositionDto> CreateCashSecuredPutAsync(CreateCashSecuredPutDto dto);
        Task<RollHistoryDto> RollOptionAsync(RollOptionDto dto);
        Task<List<RollHistoryDto>> GetRollHistoryAsync(int? optionsPositionId = null);
        Task<bool> CloseOptionsPositionAsync(int id, decimal closingPrice);
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(string? account = null);
    }

    public class OptionsService : IOptionsService
    {
        private readonly ApplicationDbContext _context;

        public OptionsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<OptionsPositionDto>> GetAllOptionsPositionsAsync(string? account = null, PositionStatus? status = null)
        {
            var query = _context.OptionsPositions
                .Include(o => o.UnderlyingPosition)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(account))
                query = query.Where(o => o.Account == account);

            if (status.HasValue)
                query = query.Where(o => o.Status == status.Value);

            var options = await query.OrderByDescending(o => o.ExpirationDate).ToListAsync();

            return options.Select(MapToDto).ToList();
        }

        public async Task<OptionsPositionDto?> GetOptionsPositionByIdAsync(int id)
        {
            var option = await _context.OptionsPositions
                .Include(o => o.UnderlyingPosition)
                .FirstOrDefaultAsync(o => o.Id == id);

            return option != null ? MapToDto(option) : null;
        }

        public async Task<OptionsPositionDto> CreateCoveredCallAsync(CreateCoveredCallDto dto)
        {
            // Verify the position exists
            var position = await _context.Positions.FindAsync(dto.PositionId);
            if (position == null)
                throw new ArgumentException("Position not found");

            // Verify sufficient shares
            var existingCalls = await _context.OptionsPositions
                .Where(o => o.UnderlyingPositionId == dto.PositionId && o.Status == PositionStatus.Open)
                .SumAsync(o => o.Contracts);

            var requiredShares = (existingCalls + dto.Contracts) * 100;
            if (position.Quantity < requiredShares)
                throw new InvalidOperationException($"Insufficient shares. Have {position.Quantity}, need {requiredShares}");

            var coveredCall = new OptionsPosition
            {
                UnderlyingSymbol = position.Symbol,
                OptionType = OptionType.Call,
                Strategy = OptionStrategy.CoveredCall,
                StrikePrice = dto.StrikePrice,
                ExpirationDate = dto.ExpirationDate,
                Contracts = dto.Contracts,
                PremiumPerContract = dto.PremiumPerContract,
                CurrentPrice = dto.PremiumPerContract,
                OpenDate = DateTime.UtcNow,
                Status = PositionStatus.Open,
                Account = position.Account,
                UnderlyingPositionId = dto.PositionId,
                Notes = dto.Notes ?? string.Empty
            };

            _context.OptionsPositions.Add(coveredCall);
            await _context.SaveChangesAsync();

            return MapToDto(coveredCall);
        }

        public async Task<OptionsPositionDto> CreateCashSecuredPutAsync(CreateCashSecuredPutDto dto)
        {
            var csp = new OptionsPosition
            {
                UnderlyingSymbol = dto.UnderlyingSymbol,
                OptionType = OptionType.Put,
                Strategy = OptionStrategy.CashSecuredPut,
                StrikePrice = dto.StrikePrice,
                ExpirationDate = dto.ExpirationDate,
                Contracts = dto.Contracts,
                PremiumPerContract = dto.PremiumPerContract,
                CurrentPrice = dto.PremiumPerContract,
                OpenDate = DateTime.UtcNow,
                Status = PositionStatus.Open,
                Account = dto.Account,
                Notes = dto.Notes ?? string.Empty
            };

            _context.OptionsPositions.Add(csp);
            await _context.SaveChangesAsync();

            return MapToDto(csp);
        }

        public async Task<RollHistoryDto> RollOptionAsync(RollOptionDto dto)
        {
            var oldPosition = await _context.OptionsPositions
                .Include(o => o.UnderlyingPosition)
                .FirstOrDefaultAsync(o => o.Id == dto.OptionsPositionId);

            if (oldPosition == null)
                throw new ArgumentException("Options position not found");

            if (oldPosition.Status != PositionStatus.Open)
                throw new InvalidOperationException("Can only roll open positions");

            // Close the old position
            oldPosition.Status = PositionStatus.Rolled;
            oldPosition.CloseDate = DateTime.UtcNow;
            oldPosition.CurrentPrice = dto.ClosingPremium;

            // Create the new position
            var newPosition = new OptionsPosition
            {
                UnderlyingSymbol = oldPosition.UnderlyingSymbol,
                OptionType = oldPosition.OptionType,
                Strategy = oldPosition.Strategy,
                StrikePrice = dto.NewStrikePrice,
                ExpirationDate = dto.NewExpirationDate,
                Contracts = oldPosition.Contracts,
                PremiumPerContract = dto.NewPremiumPerContract,
                CurrentPrice = dto.NewPremiumPerContract,
                OpenDate = DateTime.UtcNow,
                Status = PositionStatus.Open,
                Account = oldPosition.Account,
                UnderlyingPositionId = oldPosition.UnderlyingPositionId,
                RolledFromId = oldPosition.Id,
                Notes = dto.Notes ?? $"Rolled from {oldPosition.StrikePrice} exp {oldPosition.ExpirationDate:MM/dd/yyyy}"
            };

            oldPosition.RolledToId = newPosition.Id;

            _context.OptionsPositions.Add(newPosition);

            // Calculate net credit/debit
            var premiumCollected = newPosition.TotalPremiumCollected;
            var premiumPaid = dto.ClosingPremium * oldPosition.Contracts * 100;
            var netCredit = premiumCollected - premiumPaid;

            // Create roll history
            var rollHistory = new RollHistory
            {
                FromPosition = oldPosition,
                ToPosition = newPosition,
                RollDate = DateTime.UtcNow,
                NetCredit = netCredit,
                Notes = dto.Notes ?? string.Empty
            };

            _context.RollHistories.Add(rollHistory);
            await _context.SaveChangesAsync();

            return new RollHistoryDto
            {
                Id = rollHistory.Id,
                FromOptionsPositionId = rollHistory.FromOptionsPositionId,
                ToOptionsPositionId = rollHistory.ToOptionsPositionId,
                RollDate = rollHistory.RollDate,
                NetCredit = rollHistory.NetCredit,
                OldStrike = rollHistory.OldStrike,
                NewStrike = rollHistory.NewStrike,
                OldExpiration = rollHistory.OldExpiration,
                NewExpiration = rollHistory.NewExpiration,
                DaysExtended = rollHistory.DaysExtended,
                IsRollUp = rollHistory.IsRollUp,
                IsRollDown = rollHistory.IsRollDown,
                IsRollOut = rollHistory.IsRollOut,
                Notes = rollHistory.Notes
            };
        }

        public async Task<List<RollHistoryDto>> GetRollHistoryAsync(int? optionsPositionId = null)
        {
            var query = _context.RollHistories
                .Include(r => r.FromPosition)
                .Include(r => r.ToPosition)
                .AsQueryable();

            if (optionsPositionId.HasValue)
            {
                query = query.Where(r => r.FromOptionsPositionId == optionsPositionId.Value || 
                                        r.ToOptionsPositionId == optionsPositionId.Value);
            }

            var rolls = await query.OrderByDescending(r => r.RollDate).ToListAsync();

            return rolls.Select(r => new RollHistoryDto
            {
                Id = r.Id,
                FromOptionsPositionId = r.FromOptionsPositionId,
                ToOptionsPositionId = r.ToOptionsPositionId,
                RollDate = r.RollDate,
                NetCredit = r.NetCredit,
                OldStrike = r.OldStrike,
                NewStrike = r.NewStrike,
                OldExpiration = r.OldExpiration,
                NewExpiration = r.NewExpiration,
                DaysExtended = r.DaysExtended,
                IsRollUp = r.IsRollUp,
                IsRollDown = r.IsRollDown,
                IsRollOut = r.IsRollOut,
                Notes = r.Notes
            }).ToList();
        }

        public async Task<bool> CloseOptionsPositionAsync(int id, decimal closingPrice)
        {
            var position = await _context.OptionsPositions.FindAsync(id);
            if (position == null)
                return false;

            position.Status = PositionStatus.Closed;
            position.CloseDate = DateTime.UtcNow;
            position.CurrentPrice = closingPrice;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string? account = null)
        {
            var positionsQuery = _context.Positions.AsQueryable();
            var optionsQuery = _context.OptionsPositions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(account))
            {
                positionsQuery = positionsQuery.Where(p => p.Account == account);
                optionsQuery = optionsQuery.Where(o => o.Account == account);
            }

            var positions = await positionsQuery.ToListAsync();
            var options = await optionsQuery.Where(o => o.Status == PositionStatus.Open).ToListAsync();

            var totalPortfolioValue = positions.Sum(p => p.MarketValue);
            var totalUnrealizedPnL = positions.Sum(p => p.UnrealizedPnL) + options.Sum(o => o.UnrealizedPnL);
            var totalPremiumCollected = options
                .Where(o => o.Strategy == OptionStrategy.CoveredCall || o.Strategy == OptionStrategy.CashSecuredPut)
                .Sum(o => o.TotalPremiumCollected);

            var activeCoveredCalls = options.Count(o => o.Strategy == OptionStrategy.CoveredCall);
            var activeCashSecuredPuts = options.Count(o => o.Strategy == OptionStrategy.CashSecuredPut);

            var topPositions = positions
                .OrderByDescending(p => p.MarketValue)
                .Take(5)
                .Select(p => new PositionDto
                {
                    Id = p.Id,
                    Symbol = p.Symbol,
                    Quantity = p.Quantity,
                    AverageCost = p.AverageCost,
                    CurrentPrice = p.CurrentPrice,
                    TotalCost = p.TotalCost,
                    MarketValue = p.MarketValue,
                    UnrealizedPnL = p.UnrealizedPnL,
                    UnrealizedPnLPercent = p.UnrealizedPnLPercent,
                    LastUpdated = p.LastUpdated,
                    Account = p.Account
                }).ToList();

            var expiringOptions = options
                .Where(o => o.DaysToExpiration <= 7)
                .OrderBy(o => o.ExpirationDate)
                .Select(MapToDto)
                .ToList();

            return new DashboardSummaryDto
            {
                TotalPortfolioValue = totalPortfolioValue,
                TotalUnrealizedPnL = totalUnrealizedPnL,
                TotalPremiumCollected = totalPremiumCollected,
                ActiveCoveredCalls = activeCoveredCalls,
                ActiveCashSecuredPuts = activeCashSecuredPuts,
                PositionsCount = positions.Count,
                TopPositions = topPositions,
                ExpiringOptions = expiringOptions
            };
        }

        private OptionsPositionDto MapToDto(OptionsPosition option)
        {
            return new OptionsPositionDto
            {
                Id = option.Id,
                UnderlyingSymbol = option.UnderlyingSymbol,
                OptionType = option.OptionType.ToString(),
                Strategy = option.Strategy.ToString(),
                StrikePrice = option.StrikePrice,
                ExpirationDate = option.ExpirationDate,
                Contracts = option.Contracts,
                PremiumPerContract = option.PremiumPerContract,
                CurrentPrice = option.CurrentPrice,
                TotalPremiumCollected = option.TotalPremiumCollected,
                CurrentValue = option.CurrentValue,
                UnrealizedPnL = option.UnrealizedPnL,
                OpenDate = option.OpenDate,
                CloseDate = option.CloseDate,
                Status = option.Status.ToString(),
                Account = option.Account,
                UnderlyingPositionId = option.UnderlyingPositionId,
                DaysToExpiration = option.DaysToExpiration,
                RequiredCapital = option.RequiredCapital,
                Notes = option.Notes,
                IsRolled = option.RolledToId.HasValue,
                RolledFromId = option.RolledFromId,
                RolledToId = option.RolledToId
            };
        }
    }
}

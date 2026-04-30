import { useEffect, useState } from 'react';
import { optionsApi } from '../api/client';
import type { DashboardSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await optionsApi.getDashboard();
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Portfolio Value"
          value={formatCurrency(dashboard.totalPortfolioValue)}
          subtitle={`${dashboard.positionsCount} positions`}
          bgColor="bg-blue-50"
          textColor="text-blue-900"
        />
        
        <SummaryCard
          title="Unrealized P&L"
          value={formatCurrency(dashboard.totalUnrealizedPnL)}
          isProfit={dashboard.totalUnrealizedPnL >= 0}
          bgColor={dashboard.totalUnrealizedPnL >= 0 ? "bg-green-50" : "bg-red-50"}
          textColor={dashboard.totalUnrealizedPnL >= 0 ? "text-green-900" : "text-red-900"}
        />
        
        <SummaryCard
          title="Premium Collected"
          value={formatCurrency(dashboard.totalPremiumCollected)}
          subtitle={`${dashboard.activeCoveredCalls} CCs, ${dashboard.activeCashSecuredPuts} CSPs`}
          bgColor="bg-purple-50"
          textColor="text-purple-900"
        />
      </div>

      {/* Top Positions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top Positions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboard.topPositions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{position.symbol}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{position.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(position.averageCost)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(position.currentPrice)}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(position.marketValue)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(position.unrealizedPnL)}
                    <span className="text-sm ml-1">
                      ({formatPercent(position.unrealizedPnLPercent)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring Options */}
      {dashboard.expiringOptions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Expiring Soon (Next 7 Days)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Strike</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contracts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard.expiringOptions.map((option) => (
                  <tr key={option.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{option.underlyingSymbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        option.optionType === 'Call' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {option.strategy}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(option.strikePrice)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(option.expirationDate).toLocaleDateString()}
                      <span className="text-sm text-gray-500 ml-2">({option.daysToExpiration}d)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{option.contracts}</td>
                    <td className={`px-4 py-3 text-right font-medium ${option.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(option.unrealizedPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  isProfit?: boolean;
  bgColor: string;
  textColor: string;
}

function SummaryCard({ title, value, subtitle, bgColor, textColor }: SummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-lg shadow p-6`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
    </div>
  );
}

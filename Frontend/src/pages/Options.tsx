import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { optionsApi } from '../api/client';
import type { OptionsPosition } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Options() {
  const [options, setOptions] = useState<OptionsPosition[]>([]);
  const [filter, setFilter] = useState<string>('Open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, [filter]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await optionsApi.getAll(undefined, filter);
      setOptions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const coveredCalls = options.filter(o => o.strategy === 'CoveredCall');
  const cashSecuredPuts = options.filter(o => o.strategy === 'CashSecuredPut');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Options Positions</h1>
        <div className="flex space-x-3">
          <Link
            to="/cash-secured-puts/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            New CSP
          </Link>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Rolled">Rolled</option>
            <option value="Expired">Expired</option>
            <option value="Assigned">Assigned</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Covered Calls"
          count={coveredCalls.length}
          premium={coveredCalls.reduce((sum, o) => sum + o.totalPremiumCollected, 0)}
          pnl={coveredCalls.reduce((sum, o) => sum + o.unrealizedPnL, 0)}
          bgColor="bg-blue-50"
        />
        <SummaryCard
          title="Cash Secured Puts"
          count={cashSecuredPuts.length}
          premium={cashSecuredPuts.reduce((sum, o) => sum + o.totalPremiumCollected, 0)}
          pnl={cashSecuredPuts.reduce((sum, o) => sum + o.unrealizedPnL, 0)}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Covered Calls Table */}
      {coveredCalls.length > 0 && (
        <OptionsTable
          title="Covered Calls"
          options={coveredCalls}
          onRoll={(id) => console.log('Roll', id)}
          onClose={(id) => console.log('Close', id)}
        />
      )}

      {/* Cash Secured Puts Table */}
      {cashSecuredPuts.length > 0 && (
        <OptionsTable
          title="Cash Secured Puts"
          options={cashSecuredPuts}
          onRoll={(id) => console.log('Roll', id)}
          onClose={(id) => console.log('Close', id)}
        />
      )}

      {options.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No options positions found</p>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  count: number;
  premium: number;
  pnl: number;
  bgColor: string;
}

function SummaryCard({ title, count, premium, pnl, bgColor }: SummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-lg shadow p-6`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Active Contracts:</span>
          <span className="font-medium text-gray-900">{count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Premium Collected:</span>
          <span className="font-medium text-gray-900">{formatCurrency(premium)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Unrealized P&L:</span>
          <span className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(pnl)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface OptionsTableProps {
  title: string;
  options: OptionsPosition[];
  onRoll: (id: number) => void;
  onClose: (id: number) => void;
}

function OptionsTable({ title, options, onRoll, onClose }: OptionsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Strike</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contracts</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Premium</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {options.map((option) => (
              <tr key={option.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {option.underlyingSymbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(option.strikePrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(option.expirationDate)}
                  <span className="text-xs text-gray-500 ml-2">({option.daysToExpiration}d)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {option.contracts}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(option.totalPremiumCollected)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(option.currentValue)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                  option.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(option.unrealizedPnL)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    option.status === 'Open' ? 'bg-green-100 text-green-800' :
                    option.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                    option.status === 'Rolled' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {option.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {option.status === 'Open' && (
                    <>
                      <button
                        onClick={() => onRoll(option.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Roll
                      </button>
                      <button
                        onClick={() => onClose(option.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Close
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

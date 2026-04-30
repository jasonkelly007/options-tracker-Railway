import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { positionsApi } from '../api/client';
import type { Position } from '../types';
import PositionCard from '../components/PositionCard';

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const response = await positionsApi.getAll();
      setPositions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Positions</h1>
        <Link
          to="/positions/new"
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              symbol={position.symbol}
              type="Stock"
              details={{
                quantity: position.quantity,
                avgCost: position.averageCost,
                currentPrice: position.currentPrice
              }}
              pnl={position.unrealizedPnL}
              pnlPercent={position.unrealizedPnLPercent}
              actions={
                <Link 
                  to={`/covered-calls/new?positionId=${position.id}`}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg"
                >
                  Sell CC
                </Link>
              }
            />
          ))}

          {positions.length === 0 && (
            <div className="col-span-full text-center py-20 glass-card">
              <p className="text-slate-400 font-medium">No stock positions found</p>
              <Link to="/positions/new" className="mt-4 inline-block text-indigo-600 font-bold">Add your first position</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

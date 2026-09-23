import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell
} from 'recharts';
import { ClimaticDataPoint } from '../types';
import { CloudRain, Thermometer, BarChart3 } from 'lucide-react';

interface Props {
  data: ClimaticDataPoint[];
}

type ChartMode = 'precipitation' | 'temperature' | 'combined';

const ClimaticChart: React.FC<Props> = ({ data }) => {
  const [mode, setMode] = useState<ChartMode>('precipitation');

  // Compute summary stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    let totalRain = 0;
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let maxRain = -Infinity;
    let wettestMonth = '';

    for (const d of data) {
      const p = Math.max(0, Number(d.precipitation) || 0);
      const high = Number(d.tempHigh) || 0;
      const low = Number(d.tempLow) || 0;

      totalRain += p;
      if (high > maxTemp) maxTemp = high;
      if (low < minTemp) minTemp = low;
      if (p > maxRain) {
        maxRain = p;
        wettestMonth = d.month;
      }
    }

    return {
      annualRain: Math.round(totalRain),
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      wettestMonth: wettestMonth || 'Jul',
      maxRain: Math.round(maxRain)
    };
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full mt-4 p-4 md:p-5 bg-[#F7F8F0] rounded-2xl border border-[#E6E1D6] shadow-xs">
      {/* Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-[#4F6600] uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 size={14} /> Climatic Trends & Seasonal Patterns
          </h4>
          <p className="text-[11px] text-[#797667] mt-0.5">
            Average monthly temperature range (°C) & precipitation (mm)
          </p>
        </div>

        {/* View Selection Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6E1D6] shadow-xs">
          <button
            type="button"
            onClick={() => setMode('precipitation')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'precipitation'
                ? 'bg-[#4F6600] text-white shadow-xs'
                : 'text-[#494631] hover:text-[#1D1B16] hover:bg-[#F7F8F0]'
            }`}
          >
            <CloudRain size={12} />
            <span>Precipitation</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('temperature')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'temperature'
                ? 'bg-[#4F6600] text-white shadow-xs'
                : 'text-[#494631] hover:text-[#1D1B16] hover:bg-[#F7F8F0]'
            }`}
          >
            <Thermometer size={12} />
            <span>Temperature</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('combined')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'combined'
                ? 'bg-[#4F6600] text-white shadow-xs'
                : 'text-[#494631] hover:text-[#1D1B16] hover:bg-[#F7F8F0]'
            }`}
          >
            <BarChart3 size={12} />
            <span>Overview</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Badges */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-white px-3 py-2 rounded-xl border border-[#E6E1D6] text-center">
            <span className="block text-[10px] uppercase font-bold text-[#797667]">Annual Rainfall</span>
            <span className="text-sm font-extrabold text-[#4F6600]">~{stats.annualRain} mm</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-[#E6E1D6] text-center">
            <span className="block text-[10px] uppercase font-bold text-[#797667]">Peak Heat</span>
            <span className="text-sm font-extrabold text-[#C2410C]">{stats.maxTemp}°C</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-[#E6E1D6] text-center">
            <span className="block text-[10px] uppercase font-bold text-[#797667]">Min Cold</span>
            <span className="text-sm font-extrabold text-[#0284C7]">{stats.minTemp}°C</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-[#E6E1D6] text-center">
            <span className="block text-[10px] uppercase font-bold text-[#797667]">Wettest Month</span>
            <span className="text-sm font-extrabold text-[#1D1B16]">{stats.wettestMonth} ({stats.maxRain} mm)</span>
          </div>
        </div>
      )}

      {/* Main Responsive Chart Container */}
      <div className="w-full h-52 bg-white p-3 rounded-xl border border-[#E6E1D6]">
        <ResponsiveContainer width="100%" height={180}>
          {mode === 'precipitation' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D6" />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#E6E1D6' }} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#797667', fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#797667' }}
                unit=" mm"
              />
              <Tooltip 
                cursor={{ fill: '#F7F8F0', opacity: 0.8 }}
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '12px', 
                  border: '1px solid #E6E1D6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                formatter={(value: any) => [`${value} mm`, 'Rainfall']}
              />
              <Bar 
                dataKey="precipitation" 
                radius={[4, 4, 0, 0]} 
                name="Rainfall (mm)"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.precipitation >= (stats?.maxRain || 1) * 0.8 ? '#4F6600' : '#88A735'} 
                  />
                ))}
              </Bar>
            </BarChart>
          ) : mode === 'temperature' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D6" />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#E6E1D6' }} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#797667', fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#797667' }}
                unit="°C"
              />
              <Tooltip 
                cursor={{ fill: '#F7F8F0', opacity: 0.8 }}
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '12px', 
                  border: '1px solid #E6E1D6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                formatter={(value: any, name: any) => [
                  `${value}°C`, 
                  name === 'tempHigh' ? 'Avg High' : 'Avg Low'
                ]}
              />
              <Legend 
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }}
                formatter={(val) => val === 'tempHigh' ? 'High Temp (°C)' : 'Low Temp (°C)'}
              />
              <Bar 
                dataKey="tempHigh" 
                fill="#EA580C" 
                radius={[4, 4, 0, 0]} 
                name="tempHigh"
              />
              <Bar 
                dataKey="tempLow" 
                fill="#0284C7" 
                radius={[4, 4, 0, 0]} 
                name="tempLow"
              />
            </BarChart>
          ) : (
            /* Combined Dual-Axis Overview */
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D6" />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#E6E1D6' }} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#797667', fontWeight: 600 }}
              />
              <YAxis 
                yAxisId="precip"
                orientation="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#797667' }}
                unit=" mm"
              />
              <YAxis 
                yAxisId="temp"
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#797667' }}
                unit="°C"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '12px', 
                  border: '1px solid #E6E1D6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: 600
                }} 
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '4px' }} 
              />
              <Bar 
                yAxisId="precip"
                dataKey="precipitation" 
                fill="#88A735" 
                radius={[4, 4, 0, 0]} 
                name="Rainfall (mm)"
              />
              <Line 
                yAxisId="temp"
                type="monotone"
                dataKey="tempHigh" 
                stroke="#EA580C" 
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#EA580C' }}
                name="High (°C)"
              />
              <Line 
                yAxisId="temp"
                type="monotone"
                dataKey="tempLow" 
                stroke="#0284C7" 
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#0284C7' }}
                name="Low (°C)"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClimaticChart;

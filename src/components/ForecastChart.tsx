import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { DayForecast } from '../types/cashflow';
import { AppLanguage } from '../types/munimji';
import {
  TRANSLATIONS,
  formatRupee,
  formatShortDate,
  translateWeekdayAbbr
} from '../utils/translations';

interface ForecastChartProps {
  days: DayForecast[];
  comparisonDays?: DayForecast[] | null;
  minimumReserve: number;
  timeframe: 7 | 30 | 90;
  onTimeframeChange: (timeframe: 7 | 30 | 90) => void;
  scenarioName?: string | null;
  onSelectDate?: (day: DayForecast) => void;
  language?: AppLanguage;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  days,
  comparisonDays,
  minimumReserve,
  timeframe,
  onTimeframeChange,
  scenarioName,
  onSelectDate,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeDays = days.slice(0, timeframe);
  const activeComparison = comparisonDays ? comparisonDays.slice(0, timeframe) : null;

  const allBalances = [
    ...activeDays.map((d) => d.endingBalance),
    ...(activeComparison ? activeComparison.map((d) => d.endingBalance) : []),
    minimumReserve,
    0,
  ];

  const maxVal = Math.max(...allBalances, 50000) * 1.15;
  const minVal = Math.min(...allBalances) < 0 ? Math.min(...allBalances) * 1.3 : -15000;
  const valRange = maxVal - minVal || 1;

  const svgWidth = 850;
  const svgHeight = 300;
  const paddingLeft = 82;
  const paddingRight = 25;
  const paddingTop = 34;
  const paddingBottom = 46;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (activeDays.length <= 1) return paddingLeft;
    return paddingLeft + (index / (activeDays.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const normalized = (val - minVal) / valRange;
    return paddingTop + (1 - normalized) * plotHeight;
  };

  const points = activeDays
    .map((d, i) => `${getX(i)},${getY(d.endingBalance)}`)
    .join(' ');
  const comparisonPoints = activeComparison
    ? activeComparison
        .map((d, i) => `${getX(i)},${getY(d.endingBalance)}`)
        .join(' ')
    : null;

  const areaPoints = `${getX(0)},${getY(minVal)} ${points} ${getX(
    activeDays.length - 1
  )},${getY(minVal)}`;

  const zeroY = getY(0);
  const reserveY = getY(minimumReserve);

  const shortfallIdx = activeDays.findIndex((d) => d.endingBalance < 0);
  const shortfallDay = shortfallIdx !== -1 ? activeDays[shortfallIdx] : null;

  const activeHover =
    hoveredIndex !== null && activeDays[hoveredIndex]
      ? activeDays[hoveredIndex]
      : null;

  const getTimeframeBtnLabel = (tf: 7 | 30 | 90) => {
    if (tf === 7) return t.days7Btn;
    if (tf === 30) return t.days30Btn;
    return t.days90Btn;
  };

  return (
    <div className="khata-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE6D5] gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <TrendingUp className="w-6 h-6 text-[#14532D]" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
              {t.chartTitle}
            </h3>
            {scenarioName && (
              <span className="text-base font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300">
                {t.simulatingPrefix}: {scenarioName}
              </span>
            )}
          </div>
          <p className="text-lg text-[#57534E] mt-0.5">
            {t.chartSubtitle(timeframe)}
          </p>
        </div>

        {/* Timeframe Toggle Buttons (>= 48px touch targets) */}
        <div className="flex items-center p-1 bg-[#FAF1DF] border border-[#D6C5A9] rounded-2xl shrink-0 self-start sm:self-auto gap-1">
          {([7, 30, 90] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => onTimeframeChange(tf)}
              className={`min-h-[48px] px-4 py-2 text-base font-extrabold rounded-xl transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#14532D] text-white shadow-xs'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              {getTimeframeBtnLabel(tf)}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative select-none overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[540px] h-64 sm:h-72 overflow-visible"
        >
          <defs>
            <linearGradient id="cfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14532D" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#14532D" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#14532D" stopOpacity="0.0" />
            </linearGradient>

            <pattern
              id="dangerHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#FECDD3" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Shaded Danger Zone (< 0) */}
          {minVal < 0 && (
            <rect
              x={paddingLeft}
              y={zeroY}
              width={plotWidth}
              height={getY(minVal) - zeroY}
              fill="url(#dangerHatch)"
              opacity="0.35"
            />
          )}

          {/* Y-axis gridlines and Indian ₹ labels */}
          {[60000, 40000, 20000, 0, -20000].map((val) => {
            const y = getY(val);
            if (val > maxVal * 1.1 || val < minVal * 1.1) return null;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={val === 0 ? '#CBBBA0' : '#EFE6D5'}
                  strokeWidth={val === 0 ? '1.5' : '1'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[11px] fill-[#57534E] font-bold"
                >
                  {formatRupee(val, language)}
                </text>
              </g>
            );
          })}

          <polygon points={areaPoints} fill="url(#cfGradient)" />

          {/* Keep-aside horizontal line */}
          <line
            x1={paddingLeft}
            y1={reserveY}
            x2={svgWidth - paddingRight}
            y2={reserveY}
            stroke="#EF4444"
            strokeWidth="1.75"
            strokeDasharray="4 4"
          />

          {/* Simulated Comparison Line */}
          {comparisonPoints && (
            <polyline
              fill="none"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="4 3"
              points={comparisonPoints}
            />
          )}

          {/* Main Projected Cash Line */}
          <polyline
            fill="none"
            stroke="#14532D"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Date Nodes */}
          {activeDays.map((day, idx) => {
            const cx = getX(idx);
            const cy = getY(day.endingBalance);
            const isCriticalShortfall = day.endingBalance < 0;

            return (
              <g
                key={day.date}
                className="cursor-pointer"
                onClick={() => onSelectDate && onSelectDate(day)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isCriticalShortfall ? 6 : 3.5}
                  fill={isCriticalShortfall ? '#DC2626' : '#14532D'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                <rect
                  x={cx - plotWidth / (activeDays.length * 2)}
                  y={paddingTop}
                  width={plotWidth / activeDays.length}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Pinned Shortfall Callout Tag */}
          {shortfallDay && shortfallIdx !== -1 && (
            <g
              transform={`translate(${getX(shortfallIdx)}, ${getY(
                shortfallDay.endingBalance
              )})`}
              className="pointer-events-none"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={-38}
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <g transform="translate(-70, -80)">
                <rect width="140" height="42" rx="8" fill="#DC2626" />
                <text
                  x="70"
                  y="17"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="700"
                >
                  {t.shortfallPinLabel(formatShortDate(shortfallDay.date, language))}
                </text>
                <text
                  x="70"
                  y="34"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="800"
                  className="font-mono"
                >
                  {formatRupee(Math.abs(shortfallDay.endingBalance), language)}
                </text>
              </g>
            </g>
          )}

          {/* Hover Crosshair */}
          {hoveredIndex !== null && activeHover && (
            <g className="pointer-events-none">
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={paddingTop + plotHeight}
                stroke="#57534E"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(activeHover.endingBalance)}
                r={6}
                fill="#14532D"
                stroke="#FFF"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Localized X-Axis Date Labels */}
          {activeDays.map((day, idx) => {
            const step = timeframe === 7 ? 1 : timeframe === 30 ? 3 : 10;
            if (idx % step !== 0 && idx !== activeDays.length - 1) return null;

            return (
              <text
                key={day.date}
                x={getX(idx)}
                y={svgHeight - 14}
                textAnchor="middle"
                className="font-mono text-[11px] fill-[#57534E] font-bold"
              >
                {formatShortDate(day.date, language)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Selected / Hovered Day Summary Strip (Clean Tailwind layout, zero inline styles) */}
      {activeHover && (
        <div className="rounded-2xl bg-[#1C1917] text-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-[#FDE68A]">
              {translateWeekdayAbbr(activeHover.dayOfWeek, language)},{' '}
              {formatShortDate(activeHover.date, language)}
            </span>
            <span
              className={`px-3 py-0.5 rounded-lg text-base font-bold ${
                activeHover.endingBalance < 0
                  ? 'bg-rose-500/30 text-rose-200'
                  : activeHover.endingBalance < minimumReserve
                  ? 'bg-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/30 text-emerald-200'
              }`}
            >
              {activeHover.endingBalance < 0
                ? t.statusShortOfMoney
                : activeHover.endingBalance < minimumReserve
                ? t.statusLowCash
                : t.statusSafe}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-base">
            <span>
              {t.chartStartLabel}:{' '}
              <strong className="font-mono">
                {formatRupee(activeHover.startingBalance, language)}
              </strong>
            </span>
            {activeHover.inflow > 0 && (
              <span className="text-emerald-300">
                {t.chartMoneyInLabel}:{' '}
                <strong className="font-mono">
                  {formatRupee(activeHover.inflow, language, true)}
                </strong>
              </span>
            )}
            {activeHover.outflow > 0 && (
              <span className="text-rose-300">
                {t.chartBillsOutLabel}:{' '}
                <strong className="font-mono">
                  -{formatRupee(activeHover.outflow, language)}
                </strong>
              </span>
            )}
            <span>
              {t.chartEndDayLabel}:{' '}
              <strong
                className={`font-mono ${
                  activeHover.endingBalance < 0
                    ? 'text-rose-300'
                    : 'text-emerald-300'
                }`}
              >
                {formatRupee(activeHover.endingBalance, language)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Plain-Language Legend */}
      <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#EFE6D5] text-lg text-[#44403C] font-bold">
        <div className="flex items-center gap-2">
          <span className="w-5 h-1.5 bg-[#14532D] rounded-full inline-block" />
          <span>{t.legendExpectedMoney}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-0.5 border-b-2 border-dashed border-[#EF4444] inline-block" />
          <span>{t.moneyKeepAside}</span>
        </div>
      </div>
    </div>
  );
};

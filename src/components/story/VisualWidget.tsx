/**
 * @file VisualWidget.tsx
 * Reusable, code-driven interactive animation widgets and SVG illustrations for StoryLearn.
 * Implements slider, graph, numberline, dragdrop, and pie templates.
 */

import React, { useState } from 'react';
import { SceneVisual } from '../../types/learning';
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface VisualWidgetProps {
  visual: SceneVisual;
  topicTitle?: string;
}

export const VisualWidget: React.FC<VisualWidgetProps> = ({ visual, topicTitle }) => {
  const { widget, emoji, illustrationPrompt, type } = visual;
  const template = widget?.template || 'none';
  const params = widget?.parameters || {};

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-700/60 p-4 sm:p-6 shadow-xl backdrop-blur-md overflow-hidden">
      {/* Top indicator & Emoji */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-3xl sm:text-4xl filter drop-shadow-md animate-bounce select-none">
            {emoji || '✨'}
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {template !== 'none' ? `Interactive ${template} Lab` : 'Scene Visualization'}
            </div>
            <div className="text-xs text-slate-400">
              {params.label || topicTitle || 'Concept Simulator'}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          Live Model
        </div>
      </div>

      {/* Render the appropriate interactive template */}
      {template === 'slider' && <SliderWidget parameters={params} />}
      {template === 'numberline' && <NumberlineWidget parameters={params} />}
      {template === 'graph' && <GraphWidget parameters={params} />}
      {template === 'dragdrop' && <DragDropWidget parameters={params} />}
      {template === 'pie' && <PieWidget parameters={params} />}
      {template === 'none' && (
        <IllustrationCanvas prompt={illustrationPrompt} emoji={emoji} />
      )}

      {/* Explanation caption if provided */}
      {params.explanation && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-xl">
          <span className="text-amber-400 font-bold shrink-0">💡 Note:</span>
          <span>{params.explanation}</span>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 1. SLIDER WIDGET: Physics / Math Value Changer
// ----------------------------------------------------
const SliderWidget: React.FC<{ parameters: any }> = ({ parameters }) => {
  const min = parameters.min ?? 0;
  const max = parameters.max ?? 100;
  const step = parameters.step ?? 1;
  const defaultValue = parameters.defaultValue ?? (min + max) / 2;
  const unit = parameters.unit || '';
  const label = parameters.label || 'Adjust Parameter';

  const [value, setValue] = useState<number>(defaultValue);

  // Normalized 0 to 1 for animations
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  // Dynamic visual speed or size
  const ballPositionPercent = norm * 85 + 5;
  const flameSize = 0.5 + norm * 1.2;

  return (
    <div className="space-y-4">
      {/* Simulation Stage */}
      <div className="relative h-32 sm:h-36 w-full rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
        {/* Track Line */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-150"
            style={{ width: `${norm * 100}%` }}
          />
        </div>

        {/* Animated Moving Object (Submarine / Cart / Particle) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-150 flex flex-col items-center"
          style={{ left: `${ballPositionPercent}%` }}
        >
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-lg shadow-amber-500/30 flex items-center justify-center text-xl text-white font-bold transition-transform"
            style={{ transform: `scale(${0.85 + norm * 0.3}) rotate(${norm * 360}deg)` }}
          >
            ⚡
          </div>
          <span className="text-[10px] font-mono text-amber-300 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">
            {value} {unit}
          </span>
        </div>

        {/* Start / End Markers */}
        <div className="absolute left-3 bottom-2 text-[10px] text-slate-500 font-mono">
          Min: {min} {unit}
        </div>
        <div className="absolute right-3 bottom-2 text-[10px] text-slate-500 font-mono">
          Max: {max} {unit}
        </div>
      </div>

      {/* Control Slider */}
      <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-medium text-slate-200">{label}</span>
          <span className="text-sm font-bold text-amber-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            {value} {unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. NUMBERLINE WIDGET: Integers, Coordinates, Real Numbers
// ----------------------------------------------------
const NumberlineWidget: React.FC<{ parameters: any }> = ({ parameters }) => {
  const min = parameters.min ?? -50;
  const max = parameters.max ?? 50;
  const unit = parameters.unit || '';
  const initialPoints = parameters.points || [
    { value: 0, label: 'Origin', color: '#10b981' },
    { value: -25, label: 'Depth', color: '#3b82f6' }
  ];

  const [activeValue, setActiveValue] = useState<number>(parameters.defaultValue ?? 0);

  const range = max - min || 1;
  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - min) / range) * 100));
  };

  return (
    <div className="space-y-4">
      {/* Visual Numberline Gauge */}
      <div className="relative h-32 w-full rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-center">
        {/* Center Zero reference dashed line if min < 0 < max */}
        {min < 0 && max > 0 && (
          <div
            className="absolute top-2 bottom-8 w-0.5 border-l-2 border-dashed border-slate-600 z-0"
            style={{ left: `${getPercent(0)}%` }}
          >
            <span className="absolute -top-1 -translate-x-1/2 text-[9px] font-mono text-slate-400 bg-slate-900 px-1 rounded">
              0
            </span>
          </div>
        )}

        {/* The Main Axis Line */}
        <div className="relative h-2 w-full bg-slate-700 rounded-full my-auto">
          {/* Preset Fixed Points from story */}
          {initialPoints.map((pt: any, idx: number) => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              style={{ left: `${getPercent(pt.value)}%` }}
              onClick={() => setActiveValue(pt.value)}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125"
                style={{ backgroundColor: pt.color || '#f59e0b' }}
              />
              <span className="text-[10px] font-medium text-slate-300 mt-2 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                {pt.label} ({pt.value}{unit})
              </span>
            </div>
          ))}

          {/* Interactive User Pointer */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-75"
            style={{ left: `${getPercent(activeValue)}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/50 flex items-center justify-center text-[10px] font-bold text-slate-900">
              ▼
            </div>
            <span className="text-xs font-bold text-amber-300 -top-7 absolute font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/50">
              {activeValue > 0 ? `+${activeValue}` : activeValue} {unit}
            </span>
          </div>
        </div>

        {/* Ticks & bounds */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-8">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* Touch/Scrub slider */}
      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
          <span>Drag along the number line:</span>
          <span className="font-mono text-amber-400 font-bold">{activeValue} {unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={activeValue}
          onChange={(e) => setActiveValue(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. GRAPH WIDGET: Motion, Temperature, Relationships
// ----------------------------------------------------
const GraphWidget: React.FC<{ parameters: any }> = ({ parameters }) => {
  const xLabel = parameters.xAxisLabel || 'Time (s)';
  const yLabel = parameters.yAxisLabel || 'Distance / Value (m)';
  const [pointIndex, setPointIndex] = useState<number>(3);

  // Generate 8 sample points
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 15 },
    { x: 2, y: 35 },
    { x: 3, y: 60 },
    { x: 4, y: 90 },
    { x: 5, y: 130 },
    { x: 6, y: 180 },
    { x: 7, y: 240 }
  ];

  const currentPt = points[pointIndex];
  const maxValY = 240;

  return (
    <div className="space-y-4">
      {/* SVG Coordinate Grid */}
      <div className="relative h-44 w-full bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col justify-end">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 130">
          {/* Grid lines */}
          <line x1="30" y1="15" x2="290" y2="15" stroke="#334155" strokeDasharray="3 3" />
          <line x1="30" y1="55" x2="290" y2="55" stroke="#334155" strokeDasharray="3 3" />
          <line x1="30" y1="95" x2="290" y2="95" stroke="#334155" strokeDasharray="3 3" />

          {/* X & Y Axes */}
          <line x1="30" y1="10" x2="30" y2="110" stroke="#94a3b8" strokeWidth="2" />
          <line x1="30" y1="110" x2="290" y2="110" stroke="#94a3b8" strokeWidth="2" />

          {/* Curved Line Path */}
          <path
            d="M 30 110 Q 150 100, 280 20"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Highlighted Scrubber Point */}
          {(() => {
            const svgX = 30 + (pointIndex / 7) * 250;
            const svgY = 110 - (currentPt.y / maxValY) * 95;
            return (
              <g>
                <circle cx={svgX} cy={svgY} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <line x1={svgX} y1={svgY} x2={svgX} y2="110" stroke="#f59e0b" strokeDasharray="2 2" />
                <line x1="30" y1={svgY} x2={svgX} y2={svgY} stroke="#f59e0b" strokeDasharray="2 2" />
                <text x={svgX + 8} y={svgY - 8} fill="#fef08a" fontSize="10" fontFamily="monospace">
                  ({currentPt.x}s, {currentPt.y}m)
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Axis Labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
          <span>{yLabel}</span>
          <span>{xLabel} →</span>
        </div>
      </div>

      {/* Live Graph Scrubber */}
      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
          <span>Scrub time along curve:</span>
          <span className="font-mono text-cyan-400 font-bold">
            t = {currentPt.x}s | y = {currentPt.y}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="7"
          value={pointIndex}
          onChange={(e) => setPointIndex(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. DRAGDROP WIDGET: Sorting / Classification (Conductors, Acids, etc.)
// ----------------------------------------------------
const DragDropWidget: React.FC<{ parameters: any }> = ({ parameters }) => {
  const categories: string[] = parameters.categories || ['Category A', 'Category B'];
  const defaultItems = parameters.items || [
    { id: '1', text: 'Iron Nail', correctCategory: categories[0], emoji: '🔩' },
    { id: '2', text: 'Plastic Ruler', correctCategory: categories[1], emoji: '📏' },
    { id: '3', text: 'Copper Wire', correctCategory: categories[0], emoji: '🔌' },
    { id: '4', text: 'Rubber Eraser', correctCategory: categories[1], emoji: '🧼' }
  ];

  // State: placed items map { itemId: categoryName }
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const handlePlace = (item: any, catName: string) => {
    setPlaced(prev => ({ ...prev, [item.id]: catName }));
    setSelectedItem(null);
  };

  const reset = () => {
    setPlaced({});
    setSelectedItem(null);
  };

  const allPlaced = defaultItems.every((item: any) => placed[item.id]);

  return (
    <div className="space-y-4">
      {/* Unsorted Items Deck */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>Tap an item, then tap a category to sort it:</span>
          <button
            onClick={reset}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {defaultItems.map((item: any) => {
            const isPlaced = Boolean(placed[item.id]);
            const isSelected = selectedItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => !isPlaced && setSelectedItem(item)}
                disabled={isPlaced}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlaced
                    ? 'opacity-30 bg-slate-800 text-slate-500 line-through'
                    : isSelected
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-bold scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat, idx) => {
          const itemsInCat = defaultItems.filter((i: any) => placed[i.id] === cat);
          return (
            <div
              key={idx}
              onClick={() => selectedItem && handlePlace(selectedItem, cat)}
              className={`p-3.5 rounded-xl border transition-all ${
                selectedItem
                  ? 'bg-slate-800/80 border-amber-500/80 ring-2 ring-amber-400/30 cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="text-xs font-bold text-amber-300 mb-2 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {itemsInCat.length} items
                </span>
              </div>
              <div className="min-h-[55px] flex flex-wrap gap-1.5 items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                {itemsInCat.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">
                    {selectedItem ? 'Tap here to place item' : 'Bucket empty'}
                  </span>
                ) : (
                  itemsInCat.map((item: any) => {
                    const isCorrect = item.correctCategory === cat;
                    return (
                      <span
                        key={item.id}
                        className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                          isCorrect
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-700'
                        }`}
                      >
                        {item.emoji} {item.text}
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allPlaced && (
        <div className="p-2.5 bg-emerald-900/30 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All items sorted! Check the checkmarks to see your accuracy!</span>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 5. PIE WIDGET: Fractions, Ratios, Balances
// ----------------------------------------------------
const PieWidget: React.FC<{ parameters: any }> = ({ parameters }) => {
  const slices = parameters.slices || [
    { label: 'Component A', value: 50, color: '#38bdf8' },
    { label: 'Component B', value: 50, color: '#ec4899' }
  ];

  const [ratio, setRatio] = useState<number>(50);

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="#1e293b" />
          {/* First slice */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={slices[0].color || '#38bdf8'}
            strokeWidth="20"
            strokeDasharray={`${(ratio / 100) * 251.2} 251.2`}
          />
          {/* Second slice */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={slices[1]?.color || '#ec4899'}
            strokeWidth="20"
            strokeDasharray={`${((100 - ratio) / 100) * 251.2} 251.2`}
            strokeDashoffset={`-${(ratio / 100) * 251.2}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-slate-100 font-mono">
          <span>{ratio}%</span>
          <span className="text-[10px] text-slate-400">/ {100 - ratio}%</span>
        </div>
      </div>

      <div className="w-full bg-slate-800/60 p-3 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
          <span className="text-cyan-400 font-medium">{slices[0].label}: {ratio}%</span>
          <span className="text-pink-400 font-medium">{slices[1]?.label}: {100 - ratio}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="99"
          value={ratio}
          onChange={(e) => setRatio(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. SVG ILLUSTRATION CANVAS: When widget is 'none' or 'both'
// ----------------------------------------------------
const IllustrationCanvas: React.FC<{ prompt: string; emoji: string }> = ({ prompt, emoji }) => {
  return (
    <div className="relative h-44 sm:h-52 w-full rounded-xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl" />

      {/* Floating Character Icon */}
      <div className="text-6xl sm:text-7xl mb-3 filter drop-shadow-xl animate-pulse select-none">
        {emoji || '🌟'}
      </div>

      {/* Story Artistic Prompt Description */}
      <p className="text-xs sm:text-sm text-slate-300 max-w-md line-clamp-3 italic font-medium">
        "{prompt || 'An exciting educational moment comes to life in the story.'}"
      </p>
    </div>
  );
};

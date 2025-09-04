"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartData {
  label: string;
  value: number;
  date: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface ChartProps {
  data: ChartData[] | LineChartData[] | TimeSeriesData[];
  type: 'bar' | 'line' | 'pie' | 'area' | 'timeseries';
  title?: string;
  height?: number;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showTimeframeControls?: boolean;
  currentTimeframe?: '24h' | '7d' | '30d' | '90d' | 'all';
  onTimeframeChange?: (timeframe: '24h' | '7d' | '30d' | '90d' | 'all') => void;
  dataType?: 'users' | 'listings'; // For tooltip text
}

export function Chart({ data, type, title, height = 300, className, xAxisLabel, yAxisLabel, showTimeframeControls = false, currentTimeframe = '7d', onTimeframeChange, dataType = 'users' }: ChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg", className)} style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-neutral-600 dark:text-neutral-400">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (type === 'bar') {
    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
        {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>}
        <div className="space-y-3" style={{ height: height - 60 }}>
          {(data as ChartData[]).map((item, index) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-20 text-sm text-neutral-600 dark:text-neutral-400 truncate">
                {item.label}
              </div>
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 relative">
                <div
                  className="h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || colors[index % colors.length]
                  }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-neutral-900 dark:text-white text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const lineData = data as LineChartData[];
    const svgWidth = 400;
    const svgHeight = height - 60;
    const padding = 40;
    const chartWidth = svgWidth - (padding * 2);
    const chartHeight = svgHeight - (padding * 2);

    // Calculate points for the line
    const points = lineData.map((item, index) => {
      const x = padding + (index / (lineData.length - 1)) * chartWidth;
      const y = padding + chartHeight - (item.value / maxValue) * chartHeight;
      return { x, y, value: item.value, label: item.label, date: item.date };
    });

    // Create path for the line
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    // Create area path
    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
        {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>}
        <div className="relative">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={padding + chartWidth}
                y2={padding + ratio * chartHeight}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
            ))}
            
            {/* Area */}
            <path
              d={areaPathData}
              fill="url(#gradient)"
              opacity={0.3}
            />
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            
            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#3B82F6"
                className="hover:r-6 transition-all cursor-pointer"
              />
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-600 dark:text-neutral-400">
            {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
              <span key={index} className="transform -translate-y-1">
                {Math.round(value)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const pieData = data as ChartData[];
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const segments = pieData.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      return {
        pathData,
        color: item.color || colors[index % colors.length],
        percentage: (percentage * 100).toFixed(1),
        label: item.label,
        value: item.value
      };
    });

    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
        {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>}
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <svg width={200} height={200} className="w-48 h-48">
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.pathData}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">
                  {segment.label}
                </span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {segment.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'area') {
    const areaData = data as LineChartData[];
    const svgWidth = 400;
    const svgHeight = height - 60;
    const padding = 40;
    const chartWidth = svgWidth - (padding * 2);
    const chartHeight = svgHeight - (padding * 2);

    const points = areaData.map((item, index) => {
      const x = padding + (index / (areaData.length - 1)) * chartWidth;
      const y = padding + chartHeight - (item.value / maxValue) * chartHeight;
      return { x, y, value: item.value, label: item.label, date: item.date };
    });

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
        {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>}
        <div className="relative">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={padding + chartWidth}
                y2={padding + ratio * chartHeight}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
            ))}
            
            {/* Area */}
            <path
              d={areaPathData}
              fill="url(#areaGradient)"
            />
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="#10B981"
              strokeWidth={2}
            />
            
            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={3}
                fill="#10B981"
                className="hover:r-5 transition-all cursor-pointer"
              />
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-600 dark:text-neutral-400">
            {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
              <span key={index} className="transform -translate-y-1">
                {Math.round(value)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'timeseries') {
    const timeData = data as TimeSeriesData[];
    
    
    // Validate data
    if (!timeData || timeData.length === 0) {
      return (
        <div className={cn("flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg", className)} style={{ height }}>
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-neutral-600 dark:text-neutral-400">No data available</p>
          </div>
        </div>
      );
    }

    // Validate that all data points have valid values
    const validData = timeData.filter(d => 
      d && 
      typeof d.value === 'number' && 
      !isNaN(d.value) && 
      isFinite(d.value) &&
      d.date
    );

    if (validData.length === 0) {
      return (
        <div className={cn("flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg", className)} style={{ height }}>
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-neutral-600 dark:text-neutral-400">Invalid data</p>
          </div>
        </div>
      );
    }

    const svgWidth = 500;
    const svgHeight = height - 80; // More space for axes and labels
    const padding = { top: 20, right: 40, bottom: 60, left: 60 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    // Calculate scales with better handling for small ranges
    const maxValue = Math.max(...validData.map(d => d.value));
    const minValue = Math.min(...validData.map(d => d.value));
    const valueRange = maxValue - minValue;
    
    // If the range is very small (like 1-2 users), add some padding to make it visible
    const paddedMinValue = valueRange < 5 ? Math.max(0, minValue - Math.max(1, valueRange * 0.1)) : minValue;
    const paddedMaxValue = valueRange < 5 ? maxValue + Math.max(1, valueRange * 0.1) : maxValue;
    const paddedRange = paddedMaxValue - paddedMinValue;
    
    // Create points for the line with proper date-based X positioning
    const points = validData.map((item, index) => {
      let x;
      
      if (validData.length === 1) {
        x = padding.left + chartWidth / 2; // Center single point
      } else {
        // Calculate X position based on actual dates
        const firstDate = new Date(validData[0].date);
        const lastDate = new Date(validData[validData.length - 1].date);
        const currentDate = new Date(item.date);
        
        const totalTimeSpan = lastDate.getTime() - firstDate.getTime();
        const currentTimeOffset = currentDate.getTime() - firstDate.getTime();
        
        // Handle edge case where all dates are the same
        if (totalTimeSpan === 0) {
          x = padding.left + (index / (validData.length - 1)) * chartWidth;
        } else {
          const timeRatio = currentTimeOffset / totalTimeSpan;
          x = padding.left + timeRatio * chartWidth;
        }
      }
      
      const y = paddedRange === 0 
        ? padding.top + chartHeight / 2  // Center if no range
        : padding.top + chartHeight - ((item.value - paddedMinValue) / paddedRange) * chartHeight;
      
      return { x, y, value: item.value, date: item.date };
    });


    // Create path for the line
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    // Create area path
    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Generate Y-axis labels using padded values
    const yAxisLabels = [];
    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
      const value = paddedMinValue + (paddedRange * i / numYLabels);
      yAxisLabels.push({
        value: Math.round(value),
        y: padding.top + chartHeight - (i / numYLabels) * chartHeight
      });
    }

    // Generate X-axis labels with proper date-based positioning
    const xAxisLabels = [];
    
    if (validData.length > 0) {
      // Always include first and last points
      xAxisLabels.push({
        date: validData[0].date,
        x: points[0].x
      });
      
      // Add intermediate points if there are enough data points
      if (validData.length > 2) {
        const step = Math.max(1, Math.floor(validData.length / 6));
        for (let i = step; i < validData.length - 1; i += step) {
          xAxisLabels.push({
            date: validData[i].date,
            x: points[i].x
          });
        }
      }
      
      // Always include the last point if it's different from the first
      if (validData.length > 1 && validData[validData.length - 1].date !== validData[0].date) {
        xAxisLabels.push({
          date: validData[validData.length - 1].date,
          x: points[points.length - 1].x
        });
      }
    }

    return (
      <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>}
          {showTimeframeControls && onTimeframeChange && (
            <div className="flex gap-1">
              {(['24h', '7d', '30d', '90d', 'all'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => onTimeframeChange(timeframe)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    currentTimeframe === timeframe
                      ? "bg-blue-500 text-white"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  )}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Grid lines */}
            {yAxisLabels.map((label, index) => (
              <line
                key={index}
                x1={padding.left}
                y1={label.y}
                x2={padding.left + chartWidth}
                y2={label.y}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-700"
              />
            ))}
            
            {/* Y-axis line */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeWidth={2}
              className="text-neutral-400 dark:text-neutral-500"
            />
            
            {/* X-axis line */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeWidth={2}
              className="text-neutral-400 dark:text-neutral-500"
            />
            
            {/* Area */}
            <path
              d={areaPathData}
              fill="url(#timeseriesGradient)"
              opacity={0.3}
            />
            
            {/* Line with hover area */}
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={3}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                // Find the closest point to the mouse
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Find closest point
                let closestPoint = points[0];
                let minDistance = Math.sqrt(Math.pow(mouseX - points[0].x, 2) + Math.pow(mouseY - points[0].y, 2));
                
                for (let i = 1; i < points.length; i++) {
                  const distance = Math.sqrt(Math.pow(mouseX - points[i].x, 2) + Math.pow(mouseY - points[i].y, 2));
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = points[i];
                  }
                }
                
                setTooltip({
                  x: e.clientX,
                  y: e.clientY - 10,
                  value: closestPoint.value,
                  date: closestPoint.date
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
            
            {/* Invisible hover points for better interaction */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={8}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY - 10,
                    value: point.value,
                    date: point.date
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
            
            {/* Y-axis labels */}
            {yAxisLabels.map((label, index) => (
              <text
                key={index}
                x={padding.left - 10}
                y={label.y + 4}
                textAnchor="end"
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              >
                {label.value}
              </text>
            ))}
            
            {/* X-axis labels */}
            {xAxisLabels.map((label, index) => (
              <text
                key={index}
                x={label.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-neutral-600 dark:fill-neutral-400"
              >
                {new Date(label.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            ))}
            
            {/* Y-axis label */}
            {yAxisLabel && (
              <text
                x={15}
                y={padding.top + chartHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
                className="text-sm fill-neutral-700 dark:fill-neutral-300 font-medium"
              >
                {yAxisLabel}
              </text>
            )}
            
            {/* X-axis label */}
            {xAxisLabel && (
              <text
                x={padding.left + chartWidth / 2}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-sm fill-neutral-700 dark:fill-neutral-300 font-medium"
              >
                {xAxisLabel}
              </text>
            )}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="timeseriesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed bg-neutral-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-50 shadow-lg"
              style={{
                left: tooltip.x + 10,
                top: tooltip.y - 40,
              }}
            >
              <div className="font-medium">{tooltip.value} {dataType}</div>
              <div className="text-neutral-300">
                {new Date(tooltip.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalUsers: number;
  totalListings: number;
  activeUsers: number;
  newListings: number;
  totalMessages: number;
  totalOffers: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    overview: {
      totalUsers: number;
      totalListings: number;
      activeUsers24h: number;
      newListings24h: number;
      totalMessages: number;
      totalOffers: number;
    };
    userGrowth?: Array<{date: string, users: number}>;
    listingGrowth?: Array<{date: string, listings: number}>;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalListings: 0,
    activeUsers: 0,
    newListings: 0,
    totalMessages: 0,
    totalOffers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }

      const result = await response.json() as ApiResponse;
      if (result.success && result.data) {
        const overview = result.data.overview;
        setData({
          totalUsers: overview.totalUsers || 0,
          totalListings: overview.totalListings || 0,
          activeUsers: overview.activeUsers24h || 0,
          newListings: overview.newListings24h || 0,
          totalMessages: overview.totalMessages || 0,
          totalOffers: overview.totalOffers || 0
        });
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadAnalytics}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      name: 'Total Listings',
      value: data.totalListings.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'green'
    },
    {
      name: 'Active Users (7d)',
      value: data.activeUsers.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'yellow'
    },
    {
      name: 'New Listings (7d)',
      value: data.newListings.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'purple'
    },
    {
      name: 'Total Messages',
      value: data.totalMessages.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'indigo'
    },
    {
      name: 'Total Offers',
      value: data.totalOffers.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      purple: 'bg-purple-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      pink: 'bg-pink-500 text-white'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of platform metrics and user activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="mt-8 space-y-6">
          {/* Growth Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
                <p className="text-sm text-gray-500 mt-1">Cumulative user registrations over time</p>
              </div>
              <div className="p-6 h-80">
                <UserGrowthChart />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Listing Growth</h3>
                <p className="text-sm text-gray-500 mt-1">Cumulative listings created over time</p>
              </div>
              <div className="p-6 h-80">
                <ListingGrowthChart />
              </div>
            </div>
          </div>

          {/* Activity Analysis Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
                <p className="text-sm text-gray-500 mt-1">Activity breakdown by type</p>
              </div>
              <div className="p-6 h-64">
                <PlatformDistributionChart data={data} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Last 7 days activity comparison</p>
              </div>
              <div className="p-6 h-64">
                <RecentActivityChart data={data} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">User Engagement</h3>
                <p className="text-sm text-gray-500 mt-1">Active vs total users</p>
              </div>
              <div className="p-6 h-64">
                <UserEngagementChart data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Growth Chart Component
function UserGrowthChart() {
  const [chartData, setChartData] = useState<Array<{date: string, users: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserGrowthData();
  }, []);

  const fetchUserGrowthData = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json() as ApiResponse;
      if (result.success && result.data.userGrowth) {
        setChartData(result.data.userGrowth);
      }
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ChartSkeleton />;
  }

  if (chartData.length === 0) {
    return <NoDataMessage />;
  }

  return <GrowthLineChart data={chartData} color="#3B82F6" title="Users" />;
}

// Listing Growth Chart Component
function ListingGrowthChart() {
  const [chartData, setChartData] = useState<Array<{date: string, listings: number}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingGrowthData();
  }, []);

  const fetchListingGrowthData = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json() as ApiResponse;
      if (result.success && result.data.listingGrowth) {
        setChartData(result.data.listingGrowth);
      }
    } catch (error) {
      console.error('Error fetching listing growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ChartSkeleton />;
  }

  if (chartData.length === 0) {
    return <NoDataMessage />;
  }

  return <GrowthLineChart data={chartData} color="#10B981" title="Listings" />;
}

// Platform Distribution Chart (Donut Chart)
function PlatformDistributionChart({ data }: { data: AnalyticsData }) {
  const distributionData = [
    { name: 'Users', value: data.totalUsers, color: '#3B82F6' },
    { name: 'Listings', value: data.totalListings, color: '#10B981' },
    { name: 'Messages', value: data.totalMessages, color: '#F59E0B' },
    { name: 'Offers', value: data.totalOffers, color: '#8B5CF6' }
  ].filter(item => item.value > 0);

  const total = distributionData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <NoDataMessage />;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="relative w-full h-full max-w-xs">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {distributionData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = distributionData.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
            const endAngle = startAngle + (percentage * 3.6);
            
            const radius = 70;
            const centerX = 100;
            const centerY = 100;
            const innerRadius = 50;
            
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const x1Inner = centerX + innerRadius * Math.cos(startAngleRad);
            const y1Inner = centerY + innerRadius * Math.sin(startAngleRad);
            const x2Inner = centerX + innerRadius * Math.cos(endAngleRad);
            const y2Inner = centerY + innerRadius * Math.sin(endAngleRad);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const outerPath = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${x2Inner} ${y2Inner}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={item.name}
                d={outerPath}
                fill={item.color}
                opacity={0.9}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="ml-4 space-y-3 flex-1">
        {distributionData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{((item.value / total) * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Activity Chart (Horizontal Bar Chart)
function RecentActivityChart({ data }: { data: AnalyticsData }) {
  const activityData = [
    { name: 'Active Users (24h)', value: data.activeUsers, color: '#3B82F6', icon: '👥' },
    { name: 'New Listings (7d)', value: data.newListings, color: '#10B981', icon: '📝' },
    { name: 'Total Messages', value: data.totalMessages, color: '#F59E0B', icon: '💬' },
    { name: 'Total Offers', value: data.totalOffers, color: '#8B5CF6', icon: '🤝' }
  ].filter(item => item.value > 0);

  const maxValue = Math.max(...activityData.map(item => item.value));

  if (maxValue === 0) {
    return <NoDataMessage />;
  }

  return (
    <div className="h-full space-y-4">
      {activityData.map((item, index) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// User Engagement Chart (Gauge Chart)
function UserEngagementChart({ data }: { data: AnalyticsData }) {
  const engagementRate = data.totalUsers > 0 ? (data.activeUsers / data.totalUsers) * 100 : 0;
  const engagementPercentage = Math.round(engagementRate);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${engagementPercentage * 5.02} 502`}
            strokeDashoffset="125.5"
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900">{engagementPercentage}%</div>
          <div className="text-sm text-gray-500">Engagement</div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">{data.activeUsers.toLocaleString()}</span> active users
        </div>
        <div className="text-xs text-gray-500">
          out of {data.totalUsers.toLocaleString()} total
        </div>
      </div>
    </div>
  );
}

// Growth Line Chart Component
function GrowthLineChart({ data, color, title }: { 
  data: Array<{date: string, users?: number, listings?: number}>, 
  color: string, 
  title: string 
}) {
  const maxValue = Math.max(...data.map(d => d.users || d.listings || 0));
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 100;
  const padding = 15;

  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = padding + height - padding * 2 - ((point.users || point.listings || 0) - minValue) / range * (height - padding * 2);
    return { x, y, value: point.users || point.listings || 0, date: point.date };
  });

  // Create smooth curve path
  const pathData = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    
    const prevPoint = points[index - 1];
    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
    const cp1y = prevPoint.y;
    const cp2x = point.x - (point.x - prevPoint.x) / 3;
    const cp2y = point.y;
    
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }).join(' ');

  // Create area path
  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding + height - padding * 2} L ${points[0].x} ${padding + height - padding * 2} Z`;

  return (
    <div className="h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - padding * 2)}
            x2={width - padding}
            y2={padding + ratio * (height - padding * 2)}
            stroke="#F3F4F6"
            strokeWidth={0.5}
          />
        ))}
        
        {/* Area */}
        <path
          d={areaPathData}
          fill={color}
          opacity={0.1}
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={2}
            fill={color}
          />
        ))}
        
        {/* Y-axis labels */}
        {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
          <text
            key={index}
            x={padding - 8}
            y={padding + (index / 4) * (height - padding * 2) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
            fontSize="10"
          >
            {Math.round(value).toLocaleString()}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Utility Components
function ChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading chart...</div>
    </div>
  );
}

function NoDataMessage() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-sm">No data available</div>
      </div>
    </div>
  );
}



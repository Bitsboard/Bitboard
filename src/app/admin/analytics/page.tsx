'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    userLocations?: Array<{location: string, userCount: number, lat: number, lng: number}>;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
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
        {/* Back to Dashboard Button */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>

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

  return <CumulativeLineChart data={chartData} color="#3B82F6" title="Users" />;
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

  return <CumulativeLineChart data={chartData} color="#10B981" title="Listings" />;
}


// Cumulative Line Chart Component
function CumulativeLineChart({ data, color, title }: { 
  data: Array<{date: string, users?: number, listings?: number}>, 
  color: string, 
  title: string 
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, value: number, date: string} | null>(null);

  if (data.length === 0) {
    return <NoDataMessage />;
  }

  // Make it cumulative
  let cumulative = 0;
  const cumulativeData = data.map(point => {
    cumulative += point.users || point.listings || 0;
    return { ...point, cumulative };
  });

  const maxValue = Math.max(...cumulativeData.map(d => d.cumulative));
  const minValue = 0;
  const range = maxValue - minValue || 1;

  // Calculate time-based x positions
  const dates = cumulativeData.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const timeRange = maxDate - minDate || 1;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Only show tooltip if mouse is within chart area
    if (mouseX < 40 || mouseX > 380 || mouseY < 20 || mouseY > 180) {
      setHoveredPoint(null);
      return;
    }
    
    // Find the closest point based on x-position only
    let closestPoint = null;
    let minDistance = Infinity;
    
    cumulativeData.forEach((point, index) => {
      const dateTime = new Date(point.date).getTime();
      const x = 40 + ((dateTime - minDate) / timeRange) * 340;
      const distance = Math.abs(x - mouseX);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = {
          x: mouseX + 16, // Offset from cursor
          y: mouseY - 16, // Offset from cursor
          value: point.cumulative,
          date: point.date
        };
      }
    });
    
    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Create smooth path
  const pathData = cumulativeData.map((point, index) => {
    const dateTime = new Date(point.date).getTime();
    const x = 40 + ((dateTime - minDate) / timeRange) * 340;
    const y = 20 + 160 - ((point.cumulative - minValue) / range) * 160;
    
    if (index === 0) return `M ${x} ${y}`;
    
    const prevPoint = cumulativeData[index - 1];
    const prevDateTime = new Date(prevPoint.date).getTime();
    const prevX = 40 + ((prevDateTime - minDate) / timeRange) * 340;
    const prevY = 20 + 160 - ((prevPoint.cumulative - minValue) / range) * 160;
    
    // Create smooth curve
    const cp1x = prevX + (x - prevX) / 3;
    const cp1y = prevY;
    const cp2x = x - (x - prevX) / 3;
    const cp2y = y;
    
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
  }).join(' ');

  return (
    <div className="h-full w-full p-4 relative">
      <svg 
        viewBox="0 0 400 200" 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="40"
            y1={20 + ratio * 160}
            x2="380"
            y2={20 + ratio * 160}
            stroke="#F3F4F6"
            strokeWidth={1}
          />
        ))}
        
        {/* Smooth line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        
        {/* Y-axis labels */}
        {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
          <text
            key={index}
            x="35"
            y={20 + (index / 4) * 160 + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
            fontSize="12"
          >
            {Math.round(value).toLocaleString()}
          </text>
        ))}
        
        {/* X-axis labels (dates) */}
        {(() => {
          const numLabels = Math.min(5, cumulativeData.length);
          const step = Math.max(1, Math.floor(cumulativeData.length / (numLabels - 1)));
          return cumulativeData
            .filter((_, index) => index % step === 0 || index === cumulativeData.length - 1)
            .map((point, index) => {
              const dateTime = new Date(point.date).getTime();
              const x = 40 + ((dateTime - minDate) / timeRange) * 340;
              const date = new Date(point.date);
              return (
                <text
                  key={index}
                  x={x}
                  y="195"
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                  fontSize="10"
                >
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            });
        })()}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl pointer-events-none z-10 border border-gray-700"
          style={{
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold text-white">{hoveredPoint.value.toLocaleString()}</div>
          <div className="text-gray-300 text-xs">{new Date(hoveredPoint.date).toLocaleDateString()}</div>
        </div>
      )}
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



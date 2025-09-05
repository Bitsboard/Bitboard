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
    userLocations?: Array<{location: string, userCount: number, lat: number, lng: number}>;
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
                <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
                <p className="text-sm text-gray-500 mt-1">Platform activity breakdown</p>
              </div>
              <div className="p-6 h-64">
                <SimpleActivityChart data={data} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
                <p className="text-sm text-gray-500 mt-1">Important platform statistics</p>
              </div>
              <div className="p-6 h-64">
                <SimpleMetricsChart data={data} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Platform Stats</h3>
                <p className="text-sm text-gray-500 mt-1">Quick statistics overview</p>
              </div>
              <div className="p-6 h-64">
                <SimpleStatsChart data={data} />
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

  return <SimpleBarChart data={chartData} color="#3B82F6" title="Users" />;
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

  return <SimpleBarChart data={chartData} color="#10B981" title="Listings" />;
}

// Simple Activity Chart
function SimpleActivityChart({ data }: { data: AnalyticsData }) {
  const activityData = [
    { name: 'Users', value: data.totalUsers, color: '#3B82F6' },
    { name: 'Listings', value: data.totalListings, color: '#10B981' },
    { name: 'Messages', value: data.totalMessages, color: '#F59E0B' },
    { name: 'Offers', value: data.totalOffers, color: '#8B5CF6' }
  ];

  const maxValue = Math.max(...activityData.map(item => item.value));

  return (
    <div className="h-full space-y-3">
      {activityData.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full"
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

// Simple Metrics Chart
function SimpleMetricsChart({ data }: { data: AnalyticsData }) {
  const metrics = [
    { label: 'Active Users', value: data.activeUsers, color: 'text-blue-600' },
    { label: 'New Listings', value: data.newListings, color: 'text-green-600' },
    { label: 'Total Messages', value: data.totalMessages, color: 'text-yellow-600' },
    { label: 'Total Offers', value: data.totalOffers, color: 'text-purple-600' }
  ];

  return (
    <div className="h-full grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          <div className={`text-2xl font-bold ${metric.color}`}>
            {metric.value.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple Stats Chart
function SimpleStatsChart({ data }: { data: AnalyticsData }) {
  const stats = [
    { label: 'Total Users', value: data.totalUsers },
    { label: 'Total Listings', value: data.totalListings },
    { label: 'Active Users (24h)', value: data.activeUsers },
    { label: 'New Listings (7d)', value: data.newListings }
  ];

  return (
    <div className="h-full space-y-4">
      {stats.map((stat, index) => (
        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
          <span className="text-sm text-gray-600">{stat.label}</span>
          <span className="text-lg font-semibold text-gray-900">{stat.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data, color, title }: { 
  data: Array<{date: string, users?: number, listings?: number}>, 
  color: string, 
  title: string 
}) {
  if (data.length === 0) {
    return <NoDataMessage />;
  }

  const maxValue = Math.max(...data.map(d => d.users || d.listings || 0));
  const values = data.map(d => d.users || d.listings || 0);

  return (
    <div className="h-full w-full flex items-end justify-between px-2 py-4">
      {values.map((value, index) => {
        const height = (value / maxValue) * 100;
        return (
          <div key={index} className="flex flex-col items-center flex-1 mx-1">
            <div
              className="w-full rounded-t"
              style={{ 
                height: `${height}%`,
                backgroundColor: color,
                minHeight: value > 0 ? '4px' : '0px'
              }}
            ></div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {value.toLocaleString()}
            </div>
          </div>
        );
      })}
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



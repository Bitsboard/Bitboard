"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chart } from "@/components/Chart";
import { WorldMap } from "@/components/WorldMap";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalChats: number;
    totalMessages: number;
    totalOffers: number;
    activeUsers24h: number;
    newUsers24h: number;
    newListings24h: number;
    newChats24h: number;
    userTrend7d: number;
    listingTrend7d: number;
    chatTrend7d: number;
  };
  userGrowth: Array<{
    date: string;
    users: number;
    newUsers: number;
  }>;
  listingGrowth: Array<{
    date: string;
    listings: number;
    newListings: number;
  }>;
  listingStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  locationStats: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  userLocations: Array<{
    location: string;
    userCount: number;
    lat: number;
    lng: number;
  }>;
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
    apiCalls24h: number;
  };
  security: {
    blockedIPs: number;
    failedLogins: number;
    suspiciousActivity: number;
    rateLimitHits: number;
  };
  topUsers: Array<{
    username: string;
    listings: number;
    chats: number;
    reputation: number;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'performance' | 'security' | 'locations'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const result = await response.json() as { success: boolean; data?: AnalyticsData; error?: string };
      
      if (result.success && result.data) {
        setAnalyticsData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const StatCard = ({ title, value, change, changeType, icon, trend }: {
    title: string;
    value: number;
    change?: number;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    trend?: number;
  }) => (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
            {formatNumber(value)}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                'text-neutral-600 dark:text-neutral-400'
              }`}>
                {changeType === 'positive' ? '+' : ''}{change} in last 24h
              </span>
              {trend !== undefined && (
                <span className={`ml-3 text-sm font-medium ${
                  trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {trend >= 0 ? '+' : ''}{trend}% 7d
                </span>
              )}
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );

  const WorldMap = ({ locations }: { locations: Array<{ location: string; userCount: number; lat: number; lng: number }> }) => (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">User Distribution</h3>
      <div className="relative h-64 bg-neutral-50 dark:bg-neutral-700 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🌍</div>
            <p className="text-neutral-600 dark:text-neutral-400">World Map</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
              {locations.length} locations with {locations.reduce((sum, loc) => sum + loc.userCount, 0)} users
            </p>
          </div>
        </div>
        {/* Map dots would be rendered here in a real implementation */}
        {locations.slice(0, 10).map((loc, index) => (
          <div
            key={loc.location}
            className="absolute w-3 h-3 bg-blue-500 rounded-full opacity-70"
            style={{
              left: `${50 + (loc.lng / 180) * 40}%`,
              top: `${50 - (loc.lat / 90) * 40}%`,
              transform: 'translate(-50%, -50%)'
            }}
            title={`${loc.location}: ${loc.userCount} users`}
          />
        ))}
      </div>
    </div>
  );

  const InteractiveTable = ({ data, columns, title }: {
    data: any[];
    columns: Array<{ key: string; label: string; sortable?: boolean }>;
    title: string;
  }) => {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const sortedData = React.useMemo(() => {
      if (!sortKey) return data;
      return [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }, [data, sortKey, sortDirection]);

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortDirection('desc');
      }
    };

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left py-3 px-4 font-medium text-neutral-600 dark:text-neutral-400 ${
                      column.sortable ? 'cursor-pointer hover:text-neutral-900 dark:hover:text-white' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortKey === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr key={index} className="border-b border-neutral-100 dark:border-neutral-700">
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 px-4 text-neutral-900 dark:text-white">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchAnalyticsData}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            >
              ← Back to dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Comprehensive insights into your platform performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'Users' },
              { id: 'listings', label: 'Listings' },
              { id: 'performance', label: 'Performance' },
              { id: 'security', label: 'Security' },
              { id: 'locations', label: 'Locations' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={analyticsData.overview.totalUsers}
                change={analyticsData.overview.newUsers24h}
                changeType="positive"
                trend={analyticsData.overview.userTrend7d}
                icon={
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Total Listings"
                value={analyticsData.overview.totalListings}
                change={analyticsData.overview.newListings24h}
                changeType="positive"
                trend={analyticsData.overview.listingTrend7d}
                icon={
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
              <StatCard
                title="Active Chats"
                value={analyticsData.overview.totalChats}
                change={analyticsData.overview.newChats24h}
                changeType="positive"
                trend={analyticsData.overview.chatTrend7d}
                icon={
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
              <StatCard
                title="Active Users (24h)"
                value={analyticsData.overview.activeUsers24h}
                changeType="neutral"
                icon={
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Chart
                data={analyticsData.userGrowth.map(day => ({
                  date: day.date,
                  value: day.users
                }))}
                type="timeseries"
                title="Cumulative Users Over Time"
                height={400}
                xAxisLabel="Date"
                yAxisLabel="Total Users"
                showTimeframeControls={true}
                currentTimeframe={timeRange}
                onTimeframeChange={setTimeRange}
              />
              <Chart
                data={analyticsData.listingGrowth.map(day => ({
                  date: day.date,
                  value: day.listings
                }))}
                type="timeseries"
                title="Cumulative Listings Over Time"
                height={400}
                xAxisLabel="Date"
                yAxisLabel="Total Listings"
                showTimeframeControls={true}
                currentTimeframe={timeRange}
                onTimeframeChange={setTimeRange}
              />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <InteractiveTable
              data={analyticsData.topUsers}
              columns={[
                { key: 'username', label: 'Username', sortable: true },
                { key: 'listings', label: 'Listings', sortable: true },
                { key: 'chats', label: 'Chats', sortable: true },
                { key: 'reputation', label: 'Reputation', sortable: true }
              ]}
              title="Top Users by Activity"
            />
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Chart
                data={analyticsData.listingStats.map((stat, index) => ({
                  label: stat.category,
                  value: stat.count,
                  color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]
                }))}
                type="pie"
                title="Listings by Category"
                height={400}
              />
              <Chart
                data={analyticsData.locationStats.slice(0, 8).map((stat, index) => ({
                  label: stat.location,
                  value: stat.count,
                  color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]
                }))}
                type="bar"
                title="Popular Locations"
                height={400}
              />
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Avg Response Time"
                value={analyticsData.performance.avgResponseTime}
                changeType="neutral"
                icon={<span className="text-blue-600 dark:text-blue-400 font-bold">ms</span>}
              />
              <StatCard
                title="Error Rate"
                value={analyticsData.performance.errorRate}
                changeType="neutral"
                icon={<span className="text-red-600 dark:text-red-400 font-bold">%</span>}
              />
              <StatCard
                title="Uptime"
                value={analyticsData.performance.uptime}
                changeType="positive"
                icon={<span className="text-green-600 dark:text-green-400 font-bold">%</span>}
              />
              <StatCard
                title="API Calls (24h)"
                value={analyticsData.performance.apiCalls24h}
                changeType="neutral"
                icon={<span className="text-purple-600 dark:text-purple-400 font-bold">#</span>}
              />
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Blocked IPs"
                value={analyticsData.security.blockedIPs}
                changeType="neutral"
                icon={<span className="text-red-600 dark:text-red-400 font-bold">🚫</span>}
              />
              <StatCard
                title="Failed Logins"
                value={analyticsData.security.failedLogins}
                changeType="negative"
                icon={<span className="text-orange-600 dark:text-orange-400 font-bold">🔒</span>}
              />
              <StatCard
                title="Suspicious Activity"
                value={analyticsData.security.suspiciousActivity}
                changeType="negative"
                icon={<span className="text-yellow-600 dark:text-yellow-400 font-bold">⚠️</span>}
              />
              <StatCard
                title="Rate Limit Hits"
                value={analyticsData.security.rateLimitHits}
                changeType="neutral"
                icon={<span className="text-blue-600 dark:text-blue-400 font-bold">⏱️</span>}
              />
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-8">
            <WorldMap data={analyticsData.userLocations} />
            <InteractiveTable
              data={analyticsData.userLocations}
              columns={[
                { key: 'location', label: 'Location', sortable: true },
                { key: 'userCount', label: 'Users', sortable: true }
              ]}
              title="User Locations"
            />
          </div>
        )}
      </div>
    </div>
  );
}
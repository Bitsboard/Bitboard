"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chart } from "@/components/Chart";

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
  };
  userGrowth: Array<{
    date: string;
    users: number;
    newUsers: number;
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
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
  topUsers: Array<{
    username: string;
    listings: number;
    chats: number;
    reputation: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'performance' | 'security'>('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'timeseries'>('timeseries');
  
  const router = useRouter();

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadAnalytics();
    } else {
      router.push('/admin');
    }
  }, [router, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; data?: AnalyticsData };
        if (data.success && data.data) {
          setAnalyticsData(data.data);
        } else {
          setError('Failed to load analytics data');
        }
      } else {
        setError(`Failed to load analytics: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Analytics & Monitoring
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as typeof chartType)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
            >
              <option value="timeseries">Time Series Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'users', 'listings', 'performance', 'security'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading analytics...</p>
          </div>
        ) : analyticsData ? (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Users</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {formatNumber(analyticsData.overview.totalUsers)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    +{analyticsData.overview.newUsers24h} in last 24h
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Listings</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {formatNumber(analyticsData.overview.totalListings)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    +{analyticsData.overview.newListings24h} in last 24h
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Chats</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {formatNumber(analyticsData.overview.totalChats)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    +{analyticsData.overview.newChats24h} in last 24h
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Users (24h)</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {formatNumber(analyticsData.overview.activeUsers24h)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    Currently online
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top Users</h3>
                  <div className="space-y-3">
                    {analyticsData.topUsers.map((user, index) => (
                      <div key={user.username} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{user.username}</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {user.listings} listings • {user.chats} chats
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900 dark:text-white">+{user.reputation}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">reputation</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Chart
                  data={analyticsData.userGrowth.map(day => ({
                    date: day.date,
                    value: day.users
                  }))}
                  type="timeseries"
                  title="User Growth Over Time"
                  height={350}
                  xAxisLabel="Date"
                  yAxisLabel="Total Users"
                />
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Chart
                    data={analyticsData.listingStats.map((stat, index) => ({
                      label: stat.category,
                      value: stat.count,
                      color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]
                    }))}
                    type="pie"
                    title="Listings by Category"
                    height={350}
                  />

                  <Chart
                    data={analyticsData.locationStats.slice(0, 8).map((stat, index) => ({
                      label: stat.location,
                      value: stat.count,
                      color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]
                    }))}
                    type="bar"
                    title="Popular Locations"
                    height={350}
                  />
                </div>
                
                {/* Listings Growth Chart */}
                <Chart
                  data={analyticsData.userGrowth.map(day => ({
                    date: day.date,
                    value: Math.floor(day.users * 0.3) // Approximate listings based on user growth
                  }))}
                  type="timeseries"
                  title="Listings Growth Over Time"
                  height={350}
                  xAxisLabel="Date"
                  yAxisLabel="Total Listings"
                />
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Avg Response Time</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {analyticsData.performance.avgResponseTime}ms
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Error Rate</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {formatPercentage(analyticsData.performance.errorRate)}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Uptime</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {formatPercentage(analyticsData.performance.uptime)}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">API Calls (24h)</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {formatNumber(analyticsData.performance.apiCalls24h)}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Chart
                    data={[
                      { label: 'Response Time', value: analyticsData.performance.avgResponseTime, color: '#3B82F6' },
                      { label: 'Error Rate', value: analyticsData.performance.errorRate * 100, color: '#EF4444' },
                      { label: 'Uptime', value: analyticsData.performance.uptime, color: '#10B981' }
                    ]}
                    type="bar"
                    title="Performance Metrics"
                    height={300}
                  />

                  <Chart
                    data={[
                      { label: 'API Calls', value: analyticsData.performance.apiCalls24h, color: '#8B5CF6' },
                      { label: 'Successful', value: analyticsData.performance.apiCalls24h * (1 - analyticsData.performance.errorRate / 100), color: '#10B981' },
                      { label: 'Failed', value: analyticsData.performance.apiCalls24h * (analyticsData.performance.errorRate / 100), color: '#EF4444' }
                    ]}
                    type="pie"
                    title="API Call Distribution"
                    height={300}
                  />
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Blocked IPs</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {analyticsData.security.blockedIPs}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Failed Logins</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {analyticsData.security.failedLogins}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Suspicious Activity</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {analyticsData.security.suspiciousActivity}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Rate Limit Hits</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {analyticsData.security.rateLimitHits}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Chart */}
                <Chart
                  data={[
                    { label: 'Blocked IPs', value: analyticsData.security.blockedIPs, color: '#EF4444' },
                    { label: 'Failed Logins', value: analyticsData.security.failedLogins, color: '#F59E0B' },
                    { label: 'Suspicious Activity', value: analyticsData.security.suspiciousActivity, color: '#F97316' },
                    { label: 'Rate Limit Hits', value: analyticsData.security.rateLimitHits, color: '#8B5CF6' }
                  ]}
                  type="bar"
                  title="Security Events Overview"
                  height={300}
                />
              </div>
            )}

            {/* Popular Searches */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Popular Searches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyticsData.popularSearches.map((search, index) => (
                  <div key={search.query} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white flex-1 mx-2">
                      {search.query}
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {search.count} searches
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No Analytics Data</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Analytics data will appear here once the system starts collecting metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

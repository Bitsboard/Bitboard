"use client";

import React, { useEffect, useState } from "react";
import Chart from "@/components/Chart";

type ChartData = {
  date: string;
  value: number;
  label: string;
};

type StatsData = {
  totalUsers: number;
  totalListings: number;
  activeUsers: number;
  newListings: number;
};

export default function AnalyticsPage() {
  const [userChartData, setUserChartData] = useState<ChartData[]>([]);
  const [listingChartData, setListingChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalListings: 0,
    activeUsers: 0,
    newListings: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [loading, setLoading] = useState(true);

  const timeframes = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "all", label: "All Time" }
  ];

  const loadChartData = async (type: 'users' | 'listings', timeframe: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/chart?type=${type}&timeframe=${timeframe}`);
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error(`Failed to load ${type} chart data:`, error);
      return [];
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics/stats');
      const result = await response.json();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [userData, listingData] = await Promise.all([
        loadChartData('users', selectedTimeframe),
        loadChartData('listings', selectedTimeframe)
      ]);

      setUserChartData(userData.map((item: any) => ({
        date: item.date,
        value: item.value || 0,
        label: `Users: ${item.value || 0}`
      })));

      setListingChartData(listingData.map((item: any) => ({
        date: item.date,
        value: item.value || 0,
        label: `Listings: ${item.value || 0}`
      })));

      await loadStats();
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor your platform's performance and growth</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg shadow-sm border">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe.value}
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedTimeframe === timeframe.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalListings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newListings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <div className="text-sm text-gray-500">
                {selectedTimeframe === '7d' ? 'Last 7 days' : 
                 selectedTimeframe === '30d' ? 'Last 30 days' :
                 selectedTimeframe === '90d' ? 'Last 90 days' : 'All time'}
              </div>
            </div>
            <div className="h-64">
              <Chart
                data={userChartData}
                type="timeseries"
                dataType="users"
                height={250}
              />
            </div>
          </div>

          {/* Listing Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Listing Growth</h3>
              <div className="text-sm text-gray-500">
                {selectedTimeframe === '7d' ? 'Last 7 days' : 
                 selectedTimeframe === '30d' ? 'Last 30 days' :
                 selectedTimeframe === '90d' ? 'Last 90 days' : 'All time'}
              </div>
            </div>
            <div className="h-64">
              <Chart
                data={listingChartData}
                type="timeseries"
                dataType="listings"
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">System Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uptime</span>
                <span className="text-gray-900 font-medium">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="text-gray-900 font-medium">120ms</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-gray-600">New user registered</span>
                <span className="ml-auto text-gray-400">2m ago</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-gray-600">New listing created</span>
                <span className="ml-auto text-gray-400">5m ago</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span className="text-gray-600">User logged in</span>
                <span className="ml-auto text-gray-400">8m ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Export Data
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Generate Report
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
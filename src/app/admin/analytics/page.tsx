"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chart } from "@/components/Chart";
import WorldMap from "@/components/WorldMap";

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
    uptime: number;
    errorRate: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        const result = await response.json() as { data?: AnalyticsData };
        if (result.data) {
          setAnalyticsData(result.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to load analytics</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, trend, icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    icon?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn(
              "flex items-center mt-2 text-sm",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
            )}>
              <span className="mr-1">{trend > 0 ? "↗" : trend < 0 ? "↘" : "→"}</span>
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-3xl text-gray-400">{icon}</div>
        )}
      </div>
    </div>
  );

  const ChartCard = ({ title, children, className }: {
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200 p-6", className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time insights and performance metrics</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analyticsData.overview.totalUsers.toLocaleString()}
            subtitle={`${analyticsData.overview.activeUsers24h} active today`}
            trend={analyticsData.overview.userTrend7d}
            icon="👥"
          />
          <StatCard
            title="Total Listings"
            value={analyticsData.overview.totalListings.toLocaleString()}
            subtitle={`${analyticsData.overview.newListings24h} new today`}
            trend={analyticsData.overview.listingTrend7d}
            icon="📦"
          />
          <StatCard
            title="Total Chats"
            value={analyticsData.overview.totalChats.toLocaleString()}
            subtitle={`${analyticsData.overview.newChats24h} new today`}
            trend={analyticsData.overview.chatTrend7d}
            icon="💬"
          />
          <StatCard
            title="Total Messages"
            value={analyticsData.overview.totalMessages.toLocaleString()}
            subtitle={`${analyticsData.overview.totalOffers} offers sent`}
            icon="📨"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <ChartCard title="User Growth">
            <Chart
              data={analyticsData.userGrowth}
              dataKey="users"
              dataType="users"
              height={300}
            />
          </ChartCard>

          {/* Listing Growth Chart */}
          <ChartCard title="Listing Growth">
            <Chart
              data={analyticsData.listingGrowth}
              dataKey="listings"
              dataType="listings"
              height={300}
            />
          </ChartCard>
        </div>

        {/* World Map */}
        <div className="mb-8">
          <ChartCard title="Global Listings Distribution" className="p-0">
            <div className="p-6">
              <WorldMap />
            </div>
          </ChartCard>
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <ChartCard title="Listings by Category">
            <div className="space-y-3">
              {analyticsData.listingStats.slice(0, 5).map((stat, index) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{stat.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {stat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Top Locations */}
          <ChartCard title="Top Locations">
            <div className="space-y-3">
              {analyticsData.locationStats.slice(0, 5).map((stat, index) => (
                <div key={stat.location} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{stat.location}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {stat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Performance Metrics */}
          <ChartCard title="System Performance">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
                <span className="text-lg font-semibold text-gray-900">
                  {analyticsData.performance.avgResponseTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Uptime</span>
                <span className="text-lg font-semibold text-green-600">
                  {analyticsData.performance.uptime}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Error Rate</span>
                <span className="text-lg font-semibold text-red-600">
                  {analyticsData.performance.errorRate}%
                </span>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
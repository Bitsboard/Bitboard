'use client';

import { useState, useEffect } from 'react';

interface StatsData {
  totalUsers: number;
  totalListings: number;
  activeUsers: number;
  newListings: number;
  totalRevenue: number;
  avgListingPrice: number;
}

interface ChartData {
  date: string;
  value: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalListings: 0,
    activeUsers: 0,
    newListings: 0,
    totalRevenue: 0,
    avgListingPrice: 0
  });
  const [userData, setUserData] = useState<ChartData[]>([]);
  const [listingData, setListingData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  // Load all data from database
  const loadAllData = async () => {
    setLoading(true);
    try {
      const db = await fetch('/api/admin/db-query').then(r => r.json());
      
      if (db.success) {
        const data = db.data;
        
        // Calculate stats from real data
        const totalUsers = data.users?.length || 0;
        const totalListings = data.listings?.length || 0;
        
        // Active users (users who created listings in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsers = data.listings?.filter((listing: any) => 
          new Date(listing.created_at) > sevenDaysAgo
        ).map((listing: any) => listing.seller_id).filter((v: any, i: any, a: any) => a.indexOf(v) === i).length || 0;
        
        // New listings in last 7 days
        const newListings = data.listings?.filter((listing: any) => 
          new Date(listing.created_at) > sevenDaysAgo
        ).length || 0;
        
        // Calculate revenue and average price
        const totalRevenue = data.listings?.reduce((sum: number, listing: any) => 
          sum + (listing.price_sats || 0), 0) || 0;
        const avgListingPrice = totalListings > 0 ? Math.round(totalRevenue / totalListings) : 0;
        
        setStats({
          totalUsers,
          totalListings,
          activeUsers,
          newListings,
          totalRevenue,
          avgListingPrice
        });
        
        // Generate chart data
        generateChartData(data, timeframe);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from real database data
  const generateChartData = (data: any, timeframe: string) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Generate user growth data
    const userGrowth: ChartData[] = [];
    const listingGrowth: ChartData[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Count users created up to this date
      const usersUpToDate = data.users?.filter((user: any) => 
        new Date(user.created_at) <= currentDate
      ).length || 0;
      
      // Count listings created up to this date
      const listingsUpToDate = data.listings?.filter((listing: any) => 
        new Date(listing.created_at) <= currentDate
      ).length || 0;
      
      userGrowth.push({ date: dateStr, value: usersUpToDate });
      listingGrowth.push({ date: dateStr, value: listingsUpToDate });
    }
    
    setUserData(userGrowth);
    setListingData(listingGrowth);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  useEffect(() => {
    loadAllData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalListings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users (7d)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New Listings (7d)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newListings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue (sats)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Listing Price</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avgListingPrice.toLocaleString()} sats</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <div className="flex space-x-2">
                {['7d', '30d', '90d', 'all'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimeframeChange(period)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      timeframe === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'all' ? 'All Time' : period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <SimpleChart data={userData} title="Users" color="blue" />
            </div>
          </div>

          {/* Listing Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Listing Growth</h3>
              <div className="flex space-x-2">
                {['7d', '30d', '90d', 'all'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimeframeChange(period)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      timeframe === period
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'all' ? 'All Time' : period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <SimpleChart data={listingData} title="Listings" color="green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple chart component
function SimpleChart({ data, title, color }: { data: ChartData[], title: string, color: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end space-x-1">
        {data.map((point, index) => {
          const height = ((point.value - minValue) / range) * 100;
          return (
            <div
              key={index}
              className={`flex-1 ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-500'} rounded-t`}
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${point.date}: ${point.value} ${title}`}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-600 text-center">
        {data.length > 0 && `${data[data.length - 1].value} total ${title}`}
      </div>
    </div>
  );
}

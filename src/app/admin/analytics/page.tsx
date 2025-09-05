'use client';

import { useState, useEffect } from 'react';

interface ChartData {
  date: string;
  value: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeUsers: 0,
    newListings: 0
  });
  const [userChartData, setUserChartData] = useState<ChartData[]>([]);
  const [listingChartData, setListingChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('🔍 Loading stats...');
      
      // Get total users count
      const usersResponse = await fetch('/api/admin/users/list');
      const usersData = await usersResponse.json() as { users?: any[]; total?: number };
      console.log('🔍 Users response:', usersData);
      const totalUsers = usersData.total || 0;

      // Get total listings count
      const listingsResponse = await fetch('/api/admin/listings/list');
      const listingsData = await listingsResponse.json() as { listings?: any[]; total?: number };
      console.log('🔍 Listings response:', listingsData);
      const totalListings = listingsData.total || 0;

      // Get ALL listings for calculations - fetch in batches to get everything
      let allListings: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMoreListings = true;
      
      while (hasMoreListings) {
        const listingsResponse = await fetch(`/api/admin/listings/list?limit=${limit}&offset=${offset}`);
        const listingsData = await listingsResponse.json() as { listings?: any[] };
        const listings = listingsData.listings || [];
        
        if (listings.length === 0) {
          hasMoreListings = false;
        } else {
          allListings = [...allListings, ...listings];
          offset += limit;
          
          // Stop if we've fetched all available records
          if (listings.length < limit) {
            hasMoreListings = false;
          }
        }
      }
      
      console.log('🔍 Total listings fetched:', allListings.length);

      // Get ALL users for active calculation - fetch in batches to get everything
      let allUsers: any[] = [];
      offset = 0;
      hasMoreListings = true;
      
      while (hasMoreListings) {
        const usersResponse = await fetch(`/api/admin/users/list?limit=${limit}&offset=${offset}`);
        const usersData = await usersResponse.json() as { users?: any[] };
        const users = usersData.users || [];
        
        if (users.length === 0) {
          hasMoreListings = false;
        } else {
          allUsers = [...allUsers, ...users];
          offset += limit;
          
          // Stop if we've fetched all available records
          if (users.length < limit) {
            hasMoreListings = false;
          }
        }
      }
      
      console.log('🔍 Total users fetched:', allUsers.length);

      // Calculate active users (last 7 days) - users with last_active in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();
      
      const activeUsers = allUsers.filter((user: any) => {
        const lastActive = user.lastActivityAt || user.last_active || 0;
        return lastActive > sevenDaysAgoTimestamp;
      }).length || 0;

      // Calculate new listings (last 7 days)
      const newListings = allListings.filter((listing: any) => 
        new Date(listing.createdAt) > sevenDaysAgo
      ).length || 0;

      setStats({
        totalUsers,
        totalListings,
        activeUsers,
        newListings
      });

      // Generate chart data
      generateChartData(allUsers, allListings);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (users: any[], listings: any[]) => {
    console.log('📊 Generating chart data...');
    console.log('📊 Users count:', users.length);
    console.log('📊 Listings count:', listings.length);
    
    // Sort users by creation date - FIX: Convert Unix timestamps (seconds) to milliseconds
    const sortedUsers = users
      .map(user => {
        const createdAt = user.createdAt || user.created_at;
        // Convert Unix timestamp (seconds) to milliseconds
        const timestampMs = typeof createdAt === 'number' ? createdAt * 1000 : createdAt;
        return {
          ...user,
          createdAt: new Date(timestampMs)
        };
      })
      .filter(user => {
        const isValid = !isNaN(user.createdAt.getTime());
        return isValid;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Sort listings by creation date - FIX: Convert Unix timestamps (seconds) to milliseconds
    const sortedListings = listings
      .map(listing => {
        const createdAt = listing.createdAt;
        // Convert Unix timestamp (seconds) to milliseconds
        const timestampMs = typeof createdAt === 'number' ? createdAt * 1000 : createdAt;
        return {
          ...listing,
          createdAt: new Date(timestampMs)
        };
      })
      .filter(listing => {
        const isValid = !isNaN(listing.createdAt.getTime());
        return isValid;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    console.log('📊 Sorted users:', sortedUsers.length);
    console.log('📊 Sorted listings:', sortedListings.length);
    
    if (sortedUsers.length === 0 && sortedListings.length === 0) {
      console.log('📊 No data available for charts');
      return;
    }
    
    // Get date range
    const allDates = [
      ...sortedUsers.map(u => u.createdAt),
      ...sortedListings.map(l => l.createdAt)
    ];
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    console.log('📊 Date range:', minDate.toISOString(), 'to', maxDate.toISOString());
    
    // Generate user chart data - CUMULATIVE TOTALS
    const userChartData: ChartData[] = [];
    let userIndex = 0;
    let cumulativeUsers = 0;
    
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Add all users created on or before this date
      while (userIndex < sortedUsers.length && 
             sortedUsers[userIndex].createdAt <= currentDate) {
        cumulativeUsers++;
        userIndex++;
      }
      
      userChartData.push({
        date: dateStr,
        value: cumulativeUsers
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('📊 User chart data points:', userChartData.length);
    console.log('📊 Final user count:', cumulativeUsers);
    
    // Generate listing chart data - CUMULATIVE TOTALS
    const listingChartData: ChartData[] = [];
    let listingIndex = 0;
    let cumulativeListings = 0;
    
    const currentDate2 = new Date(minDate);
    while (currentDate2 <= maxDate) {
      const dateStr = currentDate2.toISOString().split('T')[0];
      
      // Add all listings created on or before this date
      while (listingIndex < sortedListings.length && 
             sortedListings[listingIndex].createdAt <= currentDate2) {
        cumulativeListings++;
        listingIndex++;
      }
      
      listingChartData.push({
        date: dateStr,
        value: cumulativeListings
      });
      
      currentDate2.setDate(currentDate2.getDate() + 1);
    }
    
    console.log('📊 Listing chart data points:', listingChartData.length);
    console.log('📊 Final listing count:', cumulativeListings);
    
    setUserChartData(userChartData);
    setListingChartData(listingChartData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <div className="h-64">
              <SmoothLineChart data={userChartData} color="blue" />
            </div>
          </div>

          {/* Listing Growth Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Growth</h3>
            <div className="h-64">
              <SmoothLineChart data={listingChartData} color="green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smooth line chart component
function SmoothLineChart({ data, color }: { data: ChartData[], color: string }) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = 0; // Always start from 0 for cumulative charts
  const range = maxValue - minValue || 1;
  
  console.log('📊 Chart scaling - maxValue:', maxValue, 'minValue:', minValue, 'range:', range);

  const colorClasses = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    purple: 'stroke-purple-500'
  };

  const fillClasses = {
    blue: 'fill-blue-500',
    green: 'fill-green-500',
    red: 'fill-red-500',
    purple: 'fill-purple-500'
  };

  // Make chart fill the full container
  const width = 100; // Use percentage
  const height = 100; // Use percentage
  const padding = 8; // Reduced padding for more chart space
  const chartWidth = 100 - (padding * 2);
  const chartHeight = 100 - (padding * 2);

  // Generate smooth path
  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / Math.max(1, range)) * chartHeight;
    return { x, y, value: point.value, date: point.date };
  });
  
  console.log('📊 Chart points:', points.length, 'points');
  console.log('📊 First point:', points[0]);
  console.log('📊 Last point:', points[points.length - 1]);

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
  
  console.log('📊 Path data:', pathData);

  // Create area path
  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Find the closest point
    let closestPoint = null;
    let minDistance = Infinity;
    
    points.forEach(point => {
      const distance = Math.sqrt(Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2));
      if (distance < minDistance && distance < 5) { // 5% threshold
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="h-full flex flex-col relative">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * chartHeight}
            x2={padding + chartWidth}
            y2={padding + ratio * chartHeight}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-gray-200"
          />
        ))}
        
        {/* Area */}
        <path
          d={areaPathData}
          className={`${fillClasses[color as keyof typeof fillClasses]} opacity-20`}
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          strokeWidth={1.5}
          className={colorClasses[color as keyof typeof colorClasses]}
        />
        
        {/* Hover indicator */}
        {hoveredPoint && (
          <g>
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={2}
              className={`${fillClasses[color as keyof typeof fillClasses]}`}
            />
            <line
              x1={hoveredPoint.x}
              y1={padding}
              x2={hoveredPoint.x}
              y2={padding + chartHeight}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-gray-300"
            />
          </g>
        )}
        
        {/* Y-axis labels */}
        {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
          <text
            key={index}
            x={padding - 2}
            y={padding + (index / 4) * chartHeight + 1}
            textAnchor="end"
            className="text-xs fill-gray-600"
            fontSize="3"
          >
            {Math.round(value).toLocaleString()}
          </text>
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
          style={{
            left: `${hoveredPoint.x}%`,
            top: `${hoveredPoint.y - 8}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold">{hoveredPoint.value.toLocaleString()}</div>
          <div className="text-gray-300">{new Date(hoveredPoint.date).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'blocked_ip' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: number;
}

interface SecurityMetrics {
  blockedIPs: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitHits: number;
  last24h: SecurityEvent[];
}

export default function AdminSecurityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityData, setSecurityData] = useState<{
    metrics: SecurityMetrics;
    recentEvents: SecurityEvent[];
    blockedIPs: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'blocked-ips'>('overview');
  const [blockIPInput, setBlockIPInput] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadSecurityData();
    } else {
      router.push('/admin');
    }
  }, [router]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/security');
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; data?: any };
        if (data.success && data.data) {
          setSecurityData(data.data);
        } else {
          setError('Failed to load security data');
        }
      } else {
        setError(`Failed to load security data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      setError('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!blockIPInput.trim()) return;

    try {
      const response = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block-ip',
          ip: blockIPInput.trim(),
          reason: blockReason.trim() || 'Manually blocked by admin'
        })
      });

      if (response.ok) {
        setBlockIPInput('');
        setBlockReason('');
        loadSecurityData(); // Refresh data
      } else {
        setError('Failed to block IP address');
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
      setError('Failed to block IP address');
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unblock-ip',
          ip
        })
      });

      if (response.ok) {
        loadSecurityData(); // Refresh data
      } else {
        setError('Failed to unblock IP address');
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
      setError('Failed to unblock IP address');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'failed_login': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'suspicious_activity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'rate_limit_exceeded': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'blocked_ip': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin_action': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

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
              Security Management
            </h1>
          </div>
          
          <button
            onClick={loadSecurityData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
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
          {(['overview', 'events', 'blocked-ips'] as const).map((tab) => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading security data...</p>
          </div>
        ) : securityData ? (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Blocked IPs</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {securityData.metrics.blockedIPs}
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
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Failed Logins (24h)</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {securityData.metrics.failedLogins}
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
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Suspicious Activity (24h)</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {securityData.metrics.suspiciousActivity}
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
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Rate Limit Hits (24h)</p>
                      <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {securityData.metrics.rateLimitHits}
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
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Security Events</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">IP Address</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {securityData.recentEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                            {formatTimestamp(event.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", getEventTypeColor(event.type))}>
                              {event.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", getSeverityColor(event.severity))}>
                              {event.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-neutral-900 dark:text-white">
                            {event.ip}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                            {JSON.stringify(event.details, null, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Blocked IPs Tab */}
            {activeTab === 'blocked-ips' && (
              <div className="space-y-6">
                {/* Block IP Form */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Block IP Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        IP Address
                      </label>
                      <input
                        type="text"
                        value={blockIPInput}
                        onChange={(e) => setBlockIPInput(e.target.value)}
                        placeholder="192.168.1.1"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Reason (optional)
                      </label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Suspicious activity"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleBlockIP}
                        disabled={!blockIPInput.trim()}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Block IP
                      </button>
                    </div>
                  </div>
                </div>

                {/* Blocked IPs List */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Blocked IP Addresses</h3>
                  </div>
                  <div className="p-6">
                    {securityData.blockedIPs.length === 0 ? (
                      <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
                        No IP addresses are currently blocked.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {securityData.blockedIPs.map((ip) => (
                          <div key={ip} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <span className="font-mono text-sm text-neutral-900 dark:text-white">{ip}</span>
                            <button
                              onClick={() => handleUnblockIP(ip)}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No Security Data</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Security monitoring data will appear here once the system starts collecting events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

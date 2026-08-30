import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  Database,
  Zap,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock data for the dashboard
const mockData = {
  monthlyUsers: [
    { month: 'Jan', users: 120, bookings: 45 },
    { month: 'Feb', users: 150, bookings: 52 },
    { month: 'Mar', users: 180, bookings: 68 },
    { month: 'Apr', users: 220, bookings: 75 },
    { month: 'May', users: 280, bookings: 92 },
    { month: 'Jun', users: 320, bookings: 110 },
  ],
  revenueData: [
    { month: 'Jan', revenue: 2500 },
    { month: 'Feb', revenue: 3200 },
    { month: 'Mar', revenue: 4100 },
    { month: 'Apr', revenue: 3800 },
    { month: 'May', revenue: 5200 },
    { month: 'Jun', revenue: 6100 },
  ],
  categoryData: [
    { name: 'Fiction', value: 35, color: '#3b82f6' },
    { name: 'Non-Fiction', value: 25, color: '#10b981' },
    { name: 'Science', value: 20, color: '#f59e0b' },
    { name: 'History', value: 15, color: '#ef4444' },
    { name: 'Others', value: 5, color: '#8b5cf6' },
  ],
  dailyActivity: [
    { day: 'Mon', active: 45 },
    { day: 'Tue', active: 52 },
    { day: 'Wed', active: 48 },
    { day: 'Thu', active: 61 },
    { day: 'Fri', active: 55 },
    { day: 'Sat', active: 67 },
    { day: 'Sun', active: 43 },
  ]
};

const Adminstatistics = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Statistics Analysis Dashboard</h1>
              <p className="text-slate-400">Comprehensive overview of your platform's performance</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <Clock size={16} />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-white">1,247</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-white">442</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  +8.2% from last month
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <BookOpen size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-white">$24,900</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp size={12} className="mr-1" />
                  +15.3% from last month
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <DollarSign size={24} className="text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Growth Rate</p>
                <p className="text-3xl font-bold text-white">+12.5%</p>
                <p className="text-xs text-blue-400 mt-1 flex items-center">
                  <Activity size={12} className="mr-1" />
                  Above target
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Monthly Users and Bookings */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Monthly Users & Bookings</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Users</span>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-xs text-slate-400">Bookings</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mockData.monthlyUsers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" name="Users" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookings" fill="#10b981" name="Bookings" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Revenue Trend</h2>
              <div className="flex items-center space-x-2">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-xs text-slate-400">Monthly Revenue</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={mockData.revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Book Category Distribution</h2>
              <Award size={20} className="text-yellow-400" />
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={mockData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#1e293b"
                  strokeWidth={2}
                >
                  {mockData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Activity */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Daily Active Users</h2>
              <Activity size={20} className="text-blue-400" />
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={mockData.dailyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e293b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top Performing Categories</h3>
              <Award size={18} className="text-yellow-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300 font-medium">Fiction</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="text-blue-400 font-semibold text-sm">35%</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300 font-medium">Non-Fiction</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">25%</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300 font-medium">Science</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-yellow-400 font-semibold text-sm">20%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <Clock size={18} className="text-blue-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">New user registration</p>
                  <p className="text-xs text-slate-500">2 minutes ago</p>
                </div>
                <CheckCircle size={16} className="text-green-400" />
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">Booking completed</p>
                  <p className="text-xs text-slate-500">5 minutes ago</p>
                </div>
                <CheckCircle size={16} className="text-blue-400" />
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">Payment processed</p>
                  <p className="text-xs text-slate-500">8 minutes ago</p>
                </div>
                <CheckCircle size={16} className="text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">System Health</h3>
              <Server size={18} className="text-green-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Server size={16} className="text-slate-400" />
                  <span className="text-slate-300">Server Status</span>
                </div>
                <span className="text-green-400 font-semibold flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database size={16} className="text-slate-400" />
                  <span className="text-slate-300">Database</span>
                </div>
                <span className="text-green-400 font-semibold flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-slate-400" />
                  <span className="text-slate-300">API Response</span>
                </div>
                <span className="text-green-400 font-semibold flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Fast
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adminstatistics;

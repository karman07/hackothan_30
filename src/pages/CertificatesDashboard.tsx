import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Download, 
  TrendingUp, 
  Award, 
  Calendar,
  Building,
  GraduationCap,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { API_URL } from "@/services/api";

const API_BASE = API_URL;
const COLORS = {
  primary: "#6366f1",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  chartColors: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
};

/* ---------- Types ---------- */
type KeyDetails = {
  certificate_type?: string;
  name?: string;
  father_name?: string;
  course?: string;
  college?: string;
  duration?: string;
  marks_obtained?: string;
  total_marks?: string;
  division?: string;
  completion_month?: string;
  completion_year?: string;
  registration_no?: string;
  cs_no?: string;
  date_of_issue?: string;
  place_of_issue?: string;
  issuing_authority?: string;
  exists_in_db?: boolean;
  [k: string]: any;
};

type CallRecord = {
  _id: string;
  timestamp: string;
  candidate_name?: string;
  institute?: string;
  course?: string;
  signature_similarity_score?: number;
  signature_match?: boolean;
  is_legitimate?: boolean;
  key_details: KeyDetails;
  authenticity_check?: string;
};

type ApiResponse = {
  data: CallRecord[];
  total?: number;
};

/* ---------- Helpers ---------- */
function groupBy<T>(items: T[], keyFn: (item: T) => string | undefined) {
  const map = new Map<string, number>();
  items.forEach((it) => {
    const k = keyFn(it) ?? "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function exportToExcel(data: CallRecord[], filename: string = "certificate_data.xlsx") {
  // Convert data to CSV format for Excel compatibility
  const headers = [
    "Name", "Course", "College", "Completion Year", "Registration No", 
    "CS No", "Is Legitimate", "Timestamp", "Signature Score", "Division"
  ];
  
  const csvData = data.map(record => [
    record.key_details?.name || record.candidate_name || '',
    record.key_details?.course || record.course || '',
    record.key_details?.college || '',
    record.key_details?.completion_year || '',
    record.key_details?.registration_no || '',
    record.key_details?.cs_no || '',
    record.is_legitimate ? 'Yes' : 'No',
    new Date(record.timestamp).toLocaleDateString(),
    record.signature_similarity_score || '',
    record.key_details?.division || ''
  ]);
  
  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.replace('.xlsx', '.csv'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ---------- Custom Components ---------- */
const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = "indigo" }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-${color}-500 relative overflow-hidden`}
  >
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-20 -mr-10 -mt-10"></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="flex items-center mt-4">
        {trend > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(trend)}%
        </span>
      </div>
    )}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ---------- Main Component ---------- */
export default function CertificatesDashboard(): JSX.Element {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // UI state
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<"all" | string>("all");
  const [legitFilter, setLegitFilter] = useState<"all" | "legit" | "not">("all");
  const [chartMode, setChartMode] = useState<"overview" | "trends" | "comparison">("overview");
  const [compareBy, setCompareBy] = useState<"completion_year" | "course" | "college">("completion_year");
  const [onlyUseLegitForCharts, setOnlyUseLegitForCharts] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  /* ---------- Fetch ---------- */
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/calls`);
      const json = (await res.json()) as ApiResponse;
      setRecords(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchInitialData() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/calls`);
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setRecords(json.data ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch calls:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInitialData();
    return () => { cancelled = true; };
  }, []);

  /* ---------- Derived Data ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const kd = r.key_details ?? ({} as KeyDetails);
      if (yearFilter !== "all" && (kd.completion_year ?? "Unknown") !== yearFilter) return false;
      if (legitFilter === "legit" && !r.is_legitimate) return false;
      if (legitFilter === "not" && r.is_legitimate) return false;
      if (!q) return true;
      const searchText = [
        kd.name, kd.college, kd.course, kd.registration_no, kd.cs_no, r.candidate_name
      ].filter(Boolean).join(" ").toLowerCase();
      return searchText.includes(q);
    });
  }, [records, query, yearFilter, legitFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const legitimate = records.filter(r => r.is_legitimate).length;
    const suspicious = total - legitimate;
    const recentWeek = records.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      total,
      legitimate,
      suspicious,
      recentWeek,
      legitimacyRate: total > 0 ? Math.round((legitimate / total) * 100) : 0,
      avgSignatureScore: records.reduce((acc, r) => 
        acc + (r.signature_similarity_score || 0), 0) / (total || 1)
    };
  }, [records]);

  const chartData = useMemo(() => {
    const pieData = [
      { name: "Legitimate", value: stats.legitimate, color: COLORS.success },
      { name: "Suspicious", value: stats.suspicious, color: COLORS.danger }
    ];

    const setToUse = onlyUseLegitForCharts ? records.filter(r => r.is_legitimate) : records;
    const comparisonData = groupBy(setToUse, (r) => {
      if (compareBy === "completion_year") return r.key_details.completion_year;
      if (compareBy === "course") return r.key_details.course ?? r.course;
      return r.key_details.college;
    }).slice(0, 10);

    // Time series data
    const timeData = records.reduce((acc, record) => {
      const date = new Date(record.timestamp).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.legitimate += record.is_legitimate ? 1 : 0;
        existing.suspicious += record.is_legitimate ? 0 : 1;
        existing.total += 1;
      } else {
        acc.push({
          date,
          legitimate: record.is_legitimate ? 1 : 0,
          suspicious: record.is_legitimate ? 0 : 1,
          total: 1
        });
      }
      return acc;
    }, [] as any[]).slice(-30);

    return { pieData, comparisonData, timeData };
  }, [records, compareBy, onlyUseLegitForCharts, stats]);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    records.forEach(r => {
      const year = r.key_details?.completion_year ?? "Unknown";
      yearSet.add(year);
    });
    return ["all", ...Array.from(yearSet).filter(y => y !== "Unknown").sort((a, b) => b.localeCompare(a))];
  }, [records]);

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                    Certificate Verification Hub
                  </h1>
                  <p className="text-gray-600 mt-2">Advanced analytics and verification dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchData}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => exportToExcel(filtered)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            title="Total Certificates"
            value={stats.total.toLocaleString()}
            subtitle="Processed"
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            title="Legitimate"
            value={stats.legitimate.toLocaleString()}
            subtitle={`${stats.legitimacyRate}% Success Rate`}
            trend={5}
            color="green"
          />
          <StatCard
            icon={XCircle}
            title="Suspicious"
            value={stats.suspicious.toLocaleString()}
            subtitle="Flagged for Review"
            trend={-2}
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            title="This Week"
            value={stats.recentWeek.toLocaleString()}
            subtitle="Recent Activity"
            color="purple"
          />
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Certificates</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
                  placeholder="Search by name, course, college, registration..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value as any)}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "all" ? "All Years" : y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  value={legitFilter}
                  onChange={(e) => setLegitFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="legit">Legitimate</option>
                  <option value="not">Suspicious</option>
                </select>
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2 rounded-lg transition-all ${viewMode === "cards" 
                    ? "bg-white shadow-sm text-indigo-600" 
                    : "text-gray-600 hover:text-gray-900"}`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-lg transition-all ${viewMode === "table" 
                    ? "bg-white shadow-sm text-indigo-600" 
                    : "text-gray-600 hover:text-gray-900"}`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Chart Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Chart Controls
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setChartMode("overview")}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    chartMode === "overview" 
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200" 
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <PieChartIcon className="h-4 w-4" />
                  Overview
                </button>
                <button
                  onClick={() => setChartMode("trends")}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    chartMode === "trends" 
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200" 
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Trends
                </button>
                <button
                  onClick={() => setChartMode("comparison")}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    chartMode === "comparison" 
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200" 
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Comparison
                </button>
              </div>

              {chartMode === "comparison" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compare by</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-0"
                    value={compareBy}
                    onChange={(e) => setCompareBy(e.target.value as any)}
                  >
                    <option value="completion_year">Completion Year</option>
                    <option value="course">Course</option>
                    <option value="college">College</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUseLegitForCharts}
                  onChange={(e) => setOnlyUseLegitForCharts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">Only legitimate records</span>
              </label>
            </div>
          </motion.div>

          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {chartMode} Analytics
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "overview" ? (
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      labelLine={false}
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                ) : chartMode === "trends" ? (
                  <AreaChart data={chartData.timeData}>
                    <defs>
                      <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="legitimate"
                      stackId="1"
                      stroke={COLORS.success}
                      fillOpacity={1}
                      fill="url(#colorLegit)"
                      name="Legitimate"
                    />
                    <Area
                      type="monotone"
                      dataKey="suspicious"
                      stackId="1"
                      stroke={COLORS.danger}
                      fillOpacity={1}
                      fill="url(#colorSuspicious)"
                      name="Suspicious"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData.comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      name="Count"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.comparisonData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Records Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Certificate Records ({filtered.length.toLocaleString()})
              </h3>
              <div className="text-sm text-gray-500">
                Showing {filtered.length} of {records.length} records
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading certificates...</span>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No certificates found matching your criteria</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filtered.map((record, index) => {
                    const kd = record.key_details ?? ({} as KeyDetails);
                    return (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                      >
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-3xl opacity-50"></div>
                        
                        {/* Status badge */}
                        <div className="absolute top-4 right-4">
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            record.is_legitimate
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {record.is_legitimate ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {record.is_legitimate ? "Verified" : "Flagged"}
                          </div>
                        </div>

                        <div className="relative">
                          {/* Name and basic info */}
                          <div className="mb-4">
                            <h4 className="text-lg font-bold text-gray-900 mb-1 pr-20">
                              {kd.name || record.candidate_name || "Unknown"}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>{kd.course || record.course || "Unknown Course"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building className="h-4 w-4" />
                              <span>{kd.college || "Unknown Institution"}</span>
                            </div>
                          </div>

                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                            {kd.completion_year && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{kd.completion_year}</span>
                              </div>
                            )}
                            {kd.division && (
                              <div className="bg-gray-50 px-2 py-1 rounded-md">
                                <span className="text-gray-600">{kd.division} Division</span>
                              </div>
                            )}
                            {kd.registration_no && (
                              <div className="col-span-2 bg-blue-50 px-2 py-1 rounded-md">
                                <span className="text-blue-700 font-mono text-xs">
                                  Reg: {kd.registration_no}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Signature score */}
                          {record.signature_similarity_score !== undefined && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Signature Match</span>
                                <span>{Math.round(record.signature_similarity_score * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    record.signature_similarity_score > 0.8
                                      ? "bg-green-500"
                                      : record.signature_similarity_score > 0.6
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${record.signature_similarity_score * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                            <span>Verified: {new Date(record.timestamp).toLocaleDateString()}</span>
                            {kd.exists_in_db && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                In Database
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signature Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {filtered.map((record, index) => {
                        const kd = record.key_details ?? ({} as KeyDetails);
                        return (
                          <motion.tr
                            key={record._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {kd.name || record.candidate_name || "Unknown"}
                                  </div>
                                  {kd.registration_no && (
                                    <div className="text-xs text-gray-500 font-mono">
                                      {kd.registration_no}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {kd.course || record.course || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {kd.college || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {kd.completion_year || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.is_legitimate
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {record.is_legitimate ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {record.is_legitimate ? "Verified" : "Flagged"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.signature_similarity_score !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        record.signature_similarity_score > 0.8
                                          ? "bg-green-500"
                                          : record.signature_similarity_score > 0.6
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${record.signature_similarity_score * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium">
                                    {Math.round(record.signature_similarity_score * 100)}%
                                  </span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.timestamp).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <p>© 2025 Certificate Verification Hub. Advanced analytics for educational verification.</p>
        </motion.div>
      </div>
    </div>
  );
}
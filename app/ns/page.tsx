"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { opsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  Database,
  Server,
  Users,
  Cpu,
  RefreshCw,
  Lock,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Terminal,
  ChevronRight,
  ChevronDown,
  Filter,
  Copy,
  Check,
  Zap,
  Radio,
  Sparkles,
  ArrowUpRight,
  Bell,
  User,
  ShieldAlert
} from "lucide-react";

// ==========================================
// SUB-COMPONENTS ARCHITECTURE
// ==========================================

// 1. HEADER COMPONENT
function TelemetryHeader({ telemetry, system, onOpenProfile }: AnyValue) {
  const router = useRouter();

  return (
    <header className="w-full min-w-0 bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-[#00FF88]/5 to-transparent pointer-events-none" />

      {/* DESKTOP HEADER LAYOUT (Single Row) */}
      <div className="hidden md:flex items-center justify-between gap-4 w-full min-w-0 font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#00FF88] animate-ping absolute" />
            <div className="w-3 h-3 rounded-full bg-[#00FF88] relative" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white truncate">
            SRM NEXUS TELEMETRY
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shrink-0">
            /ns v3.0
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
          <span>Req: <code className="text-emerald-400 font-bold">{telemetry?.requestId ? `${telemetry.requestId.slice(0, 10)}...` : "OK"}</code></span>
          <span>•</span>
          <span>Node: <code className="text-cyan-400 font-bold">{system?.nodeVersion || "v24.14.1"}</code></span>
          <span>•</span>
          <span>Env: <span className="text-[#00FF88] font-bold capitalize">{system?.environment || "Production"}</span></span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/notifications")}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenProfile}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            title="Profile Options"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE HEADER LAYOUT (3 Structured Rows) */}
      <div className="flex flex-col gap-3 md:hidden w-full min-w-0 font-mono">
        {/* Row 1: Logo & Version */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 truncate">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88] relative" />
            </div>
            <h1 className="text-base font-black tracking-tight text-white truncate">
              SRM NEXUS TELEMETRY
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 shrink-0">
            /ns v3.0
          </span>
        </div>

        {/* Row 2: Environment & Metadata */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-b border-white/5 py-1.5 w-full min-w-0">
          <span>Env: <span className="text-[#00FF88] font-bold uppercase">{system?.environment || "Production"}</span></span>
          <span>Node: <code className="text-cyan-400 font-bold">{system?.nodeVersion || "v24.14.1"}</code></span>
          <span className="truncate max-w-[110px]">Req: <code className="text-emerald-400">{telemetry?.requestId ? `${telemetry.requestId.slice(0, 6)}...` : "OK"}</code></span>
        </div>

        {/* Row 3: Action Icons Bar */}
        <div className="flex items-center justify-between w-full min-w-0 pt-0.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">OPERATOR BAR</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/notifications")}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenProfile}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// 2. STATUS BAR COMPONENT
function TelemetryStatusBar({ autoRefresh, setAutoRefresh, refreshing, onRefresh }: AnyValue) {
  return (
    <div className="w-full min-w-0">
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4 w-full font-mono text-xs">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
            autoRefresh
              ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/10 font-bold"
              : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
          <span>Live Feed {autoRefresh ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all disabled:opacity-50 font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00FF88] ${refreshing ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Mobile Layout (Full Width Stack) */}
      <div className="flex flex-col gap-2 sm:hidden w-full font-mono text-xs">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
            autoRefresh
              ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/10 font-bold"
              : "bg-white/5 text-gray-400 border-white/10"
          }`}
        >
          <Radio className={`w-4 h-4 ${autoRefresh ? "animate-pulse" : ""}`} />
          <span>Live Feed {autoRefresh ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#00FF88] ${refreshing ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
        </button>
      </div>
    </div>
  );
}

// 3. NAVIGATION TABS COMPONENT
function TelemetryNavigation({ activeTab, setActiveTab, logCount }: AnyValue) {
  return (
    <nav className="w-full min-w-0 border-b border-white/10 pb-3 flex items-center justify-between font-mono">
      <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-[#00FF88]/20 to-teal-500/20 text-[#00FF88] border border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/10"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all ${
            activeTab === "logs"
              ? "bg-gradient-to-r from-[#00FF88]/20 to-teal-500/20 text-[#00FF88] border border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/10"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Terminal className="w-4 h-4 shrink-0" />
          <span>Real-time Logs</span>
          {logCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#00FF88]/20 text-[#00FF88] font-mono">
              {logCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[#00FF88]" />
        <span>Ring Buffer Engine</span>
      </div>
    </nav>
  );
}

// 4. METRIC CARDS GRID COMPONENT
function TelemetryMetricsGrid({ mongo, redis, metrics, system, heapPercentage }: AnyValue) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5 w-full min-w-0">
      
      {/* MongoDB Atlas Card */}
      <div className="w-full min-w-0 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl hover:border-emerald-500/30 transition-all relative overflow-hidden flex flex-col justify-between group shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3 w-full min-w-0">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-2 font-bold truncate">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" /> MongoDB Atlas
          </span>
          {mongo?.status === "healthy" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#00FF88] bg-[#00FF88]/10 px-2.5 py-0.5 rounded-full border border-[#00FF88]/20 shrink-0 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 shrink-0 font-bold">
              <XCircle className="w-3 h-3" /> Error
            </span>
          )}
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono capitalize tracking-tight text-white mb-2 truncate">
          {mongo?.status || "Unknown"}
        </div>
        <div className="w-full min-w-0 flex items-center justify-between text-xs text-gray-400 font-mono mt-2 pt-3 border-t border-white/5">
          <span className="truncate">Ping Latency</span>
          <span className="text-[#00FF88] font-bold bg-[#00FF88]/10 px-2.5 py-0.5 rounded-md border border-[#00FF88]/20 shrink-0 whitespace-nowrap">
            {mongo?.latencyMs >= 0 ? `${mongo.latencyMs} ms` : "N/A"}
          </span>
        </div>
      </div>

      {/* Upstash Redis Card */}
      <div className="w-full min-w-0 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl hover:border-cyan-500/30 transition-all relative overflow-hidden flex flex-col justify-between group shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3 w-full min-w-0">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-2 font-bold truncate">
            <Server className="w-4 h-4 text-cyan-400 shrink-0" /> Upstash Redis
          </span>
          {redis?.status === "healthy" ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 shrink-0 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0 font-bold">
              <AlertTriangle className="w-3 h-3" /> Standby
            </span>
          )}
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono capitalize tracking-tight text-white mb-2 truncate">
          {redis?.status || "Disabled"}
        </div>
        <div className="w-full min-w-0 flex items-center justify-between text-xs text-gray-400 font-mono mt-2 pt-3 border-t border-white/5">
          <span className="truncate">Response Time</span>
          <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20 shrink-0 whitespace-nowrap">
            {redis?.latencyMs >= 0 ? `${redis.latencyMs} ms` : "0 ms"}
          </span>
        </div>
      </div>

      {/* Active User Sessions Card */}
      <div className="w-full min-w-0 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl hover:border-purple-500/30 transition-all relative overflow-hidden flex flex-col justify-between group shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3 w-full min-w-0">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-2 font-bold truncate">
            <Users className="w-4 h-4 text-purple-400 shrink-0" /> User Sessions
          </span>
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white mb-2 truncate">
          {metrics?.activeSessions ?? 0}
        </div>
        <div className="w-full min-w-0 flex items-center justify-between text-xs text-gray-400 font-mono mt-2 pt-3 border-t border-white/5">
          <span className="truncate">Total Registered</span>
          <span className="text-purple-400 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20 shrink-0 whitespace-nowrap">
            {metrics?.totalRegisteredUsers ?? 0}
          </span>
        </div>
      </div>

      {/* Memory Heap Card */}
      <div className="w-full min-w-0 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl hover:border-amber-500/30 transition-all relative overflow-hidden flex flex-col justify-between group shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-3 w-full min-w-0">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-2 font-bold truncate">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" /> RAM Heap
          </span>
          <span className="text-[11px] font-mono text-amber-400 font-bold shrink-0">
            {heapPercentage}% Used
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white mb-1 truncate">
          {system?.memory?.heapUsedMB ?? 0} <span className="text-xs font-normal text-gray-400">MB</span>
        </div>
        
        {/* Heap Usage Progress Bar */}
        <div className="w-full bg-white/10 h-1.5 sm:h-2 rounded-full overflow-hidden mt-3 mb-1">
          <div 
            className="bg-gradient-to-r from-amber-500 via-emerald-400 to-[#00FF88] h-full rounded-full transition-all duration-500"
            style={{ width: `${heapPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// 5. RUNTIME METADATA CARD COMPONENT
function TelemetryRuntimeCard({ system, build }: AnyValue) {
  return (
    <div className="w-full min-w-0 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl space-y-3 sm:space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 w-full min-w-0">
        <h3 className="text-xs font-bold font-mono text-gray-300 uppercase tracking-wider flex items-center gap-2 truncate">
          <Clock className="w-4 h-4 text-[#00FF88] shrink-0" /> Runtime Metadata
        </h3>
        <span className="text-[10px] font-mono text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-full border border-[#00FF88]/20 shrink-0 font-bold">
          Live Status
        </span>
      </div>

      <div className="space-y-2.5 text-xs font-mono w-full min-w-0">
        <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
          <span className="text-gray-400 truncate">Server Uptime</span>
          <span className="text-white font-bold shrink-0 whitespace-nowrap">
            {system?.uptimeSeconds
              ? `${Math.floor(system.uptimeSeconds / 3600)}h ${Math.floor(
                  (system.uptimeSeconds % 3600) / 60
                )}m ${system.uptimeSeconds % 60}s`
              : "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
          <span className="text-gray-400 truncate">Node Engine</span>
          <span className="text-cyan-400 font-bold shrink-0 whitespace-nowrap">{system?.nodeVersion || "v24.14.1"}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
          <span className="text-gray-400 truncate">Process PID</span>
          <span className="text-purple-400 font-bold shrink-0 whitespace-nowrap">{system?.processId || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
          <span className="text-gray-400 truncate">RSS Memory</span>
          <span className="text-amber-400 font-bold shrink-0 whitespace-nowrap">{system?.memory?.rssMB || 0} MB</span>
        </div>
        <div className="flex items-center justify-between py-2 gap-2 w-full min-w-0">
          <span className="text-gray-400 truncate">App Version</span>
          <span className="text-[#00FF88] font-black shrink-0 whitespace-nowrap">{build?.version || "3.0.0"}</span>
        </div>
      </div>
    </div>
  );
}

// 6. SECURITY CARD COMPONENT (Row-by-Row Structured Layout)
function TelemetrySecurityCard() {
  return (
    <div className="w-full min-w-0 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl space-y-4 flex flex-col justify-between shadow-xl">
      <div className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 w-full min-w-0">
          <h3 className="text-xs font-bold font-mono text-gray-300 uppercase tracking-wider flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" /> Security Verification
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 shrink-0 font-bold">
            Enforced
          </span>
        </div>

        {/* Structured Itemized Rows */}
        <div className="space-y-2.5 text-xs font-mono w-full min-w-0">
          <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
            <span className="text-gray-400 truncate">Telemetry Policy</span>
            <span className="text-[#00FF88] font-bold bg-[#00FF88]/10 px-2.5 py-0.5 rounded-md border border-[#00FF88]/20 shrink-0 whitespace-nowrap flex items-center gap-1">
              <Check className="w-3 h-3" /> Active
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
            <span className="text-gray-400 truncate">Route Scope</span>
            <code className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10 shrink-0 whitespace-nowrap">
              /api/v1/ops/*
            </code>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5 gap-2 w-full min-w-0">
            <span className="text-gray-400 truncate">Primary Owner Handle</span>
            <span className="text-cyan-400 font-bold shrink-0 whitespace-nowrap">
              ns4770@srmist.edu.in
            </span>
          </div>

          <div className="flex items-center justify-between py-2 gap-2 w-full min-w-0">
            <span className="text-gray-400 truncate">Security Audit Status</span>
            <span className="text-[#00FF88] font-bold shrink-0 whitespace-nowrap flex items-center gap-1">
              0 Vulnerabilities <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// MAIN OPERATIONS PAGE CONTAINER
// ==========================================
export default function OperationsPage() {
  const { ready } = useAuth();
  const router = useRouter();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  // Telemetry & Access States
  const [telemetry, setTelemetry] = useState<AnyValue>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Logs Explorer States
  const [logs, setLogs] = useState<AnyValue[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [expandedLogIndices, setExpandedLogIndices] = useState<{ [key: number]: boolean }>({});

  const fetchOpsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await opsAPI.getOverview();
      if (data?.success) {
        setTelemetry(data);
        setAccessDenied(false);
      } else {
        setAccessDenied(true);
      }
    } catch (err: AnyValue) {
      if (err?.response?.status === 403) {
        setAccessDenied(true);
      } else {
        console.error("Ops telemetry fetch error:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await opsAPI.getLogs({
        level: logLevelFilter,
        q: logSearchQuery,
        limit: 150,
      });
      if (res?.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error("Logs fetch error:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [logLevelFilter, logSearchQuery]);

  useEffect(() => {
    if (!ready) return;
    fetchOpsData();
  }, [ready, fetchOpsData]);

  // Auto-refresh interval (every 8 seconds when active & enabled)
  useEffect(() => {
    if (!autoRefresh || accessDenied || loading) return;
    const interval = setInterval(() => {
      fetchOpsData(true);
      if (activeTab === "logs") fetchLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, accessDenied, loading, fetchOpsData, fetchLogs, activeTab]);

  useEffect(() => {
    if (activeTab === "logs" && !accessDenied) {
      fetchLogs();
    }
  }, [activeTab, logLevelFilter, fetchLogs, accessDenied]);

  const toggleExpandLog = (idx: number) => {
    setExpandedLogIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyLog = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-full min-h-screen bg-[#06080F] text-white flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-[#06080F] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#00FF88]/20 to-cyan-500/20 border border-[#00FF88]/30 flex items-center justify-center mb-6 backdrop-blur-xl animate-pulse">
            <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-[#00FF88] animate-spin" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-widest uppercase mb-1">Connecting Telemetry Stream</h2>
          <p className="text-xs text-emerald-400/70">Initializing /ns secure operations handshake...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="w-full max-w-full min-h-screen bg-[#06080F] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-black to-[#06080F] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md bg-white/[0.02] border border-red-500/20 p-6 sm:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest font-bold">
            Access Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-2 tracking-tight">403 Forbidden</h1>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Access to the Telemetry & Operations Center (<code className="text-[#00FF88]">/ns</code>) is strictly restricted to authorized system operators (<code className="text-white">ns4770@srmist.edu.in</code>).
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mongo = telemetry?.mongo || {};
  const redis = telemetry?.redis || {};
  const system = telemetry?.system || {};
  const metrics = telemetry?.metrics || {};
  const build = telemetry?.build || {};

  // Log counts by level
  const logCounts = {
    ALL: logs.length,
    INFO: logs.filter((l) => l.level === "INFO").length,
    WARN: logs.filter((l) => l.level === "WARN").length,
    ERROR: logs.filter((l) => l.level === "ERROR").length,
  };

  const heapPercentage = system?.memory?.heapTotalMB
    ? Math.min(100, Math.round((system.memory.heapUsedMB / system.memory.heapTotalMB) * 100))
    : 0;

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#06080F] text-white pt-24 sm:pt-8 pb-16 px-3 sm:px-4 lg:px-6 font-sans relative selection:bg-[#00FF88]/30 selection:text-[#00FF88]">
      {/* Background Ambient Glow */}
      <div className="fixed -top-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 relative z-10 min-w-0">
        
        {/* 1. STICKY HEADER */}
        <TelemetryHeader 
          telemetry={telemetry} 
          system={system} 
          onOpenProfile={() => router.push("/settings")} 
        />

        {/* 2. STATUS BAR */}
        <TelemetryStatusBar 
          autoRefresh={autoRefresh} 
          setAutoRefresh={setAutoRefresh} 
          refreshing={refreshing} 
          onRefresh={() => {
            fetchOpsData();
            if (activeTab === "logs") fetchLogs();
          }} 
        />

        {/* 3. NAVIGATION TABS */}
        <TelemetryNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          logCount={logs.length} 
        />

        {/* 4. METRICS GRID & DIAGNOSTICS */}
        {activeTab === "overview" && (
          <div className="w-full min-w-0 space-y-4 sm:space-y-6">
            <TelemetryMetricsGrid 
              mongo={mongo} 
              redis={redis} 
              metrics={metrics} 
              system={system} 
              heapPercentage={heapPercentage} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0">
              <TelemetryRuntimeCard system={system} build={build} />
              <TelemetrySecurityCard />
            </div>
          </div>
        )}

        {/* 5. LOGS EXPLORER */}
        {activeTab === "logs" && (
          <div className="w-full min-w-0 space-y-4">
            
            {/* Search & Level Controls */}
            <div className="w-full min-w-0 p-4 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl flex flex-col md:flex-row items-center gap-3 sm:gap-4">
              
              {/* Input Search */}
              <div className="relative flex-1 w-full min-w-0">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword, user, endpoint, or error..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  className="w-full min-w-0 pl-10 pr-4 py-2.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/50 focus:bg-black/40 transition-all"
                />
              </div>

              {/* Level Filter Badges */}
              <div className="grid grid-cols-4 sm:flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl sm:rounded-2xl border border-white/10 font-mono text-xs w-full md:w-auto text-center shrink-0">
                {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => {
                  const count = logCounts[lvl];
                  return (
                    <button
                      key={lvl}
                      onClick={() => setLogLevelFilter(lvl)}
                      className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        logLevelFilter === lvl
                          ? "bg-gradient-to-r from-[#00FF88]/20 to-teal-500/20 text-[#00FF88] border border-[#00FF88]/40 shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>{lvl}</span>
                      <span className="text-[9px] sm:text-[10px] opacity-70 bg-white/10 px-1 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Execute Button */}
              <button
                onClick={fetchLogs}
                className="px-5 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#00FF88] to-teal-400 hover:from-[#00FF88]/90 hover:to-teal-300 text-black font-extrabold text-xs font-mono transition-all w-full md:w-auto shadow-lg shadow-[#00FF88]/20 shrink-0"
              >
                Execute Query
              </button>
            </div>

            {/* Log Ring Buffer Container */}
            <div className="w-full min-w-0 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl font-mono text-xs space-y-2 max-h-[600px] sm:max-h-[680px] overflow-y-auto custom-scrollbar">
              {logsLoading ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 font-mono">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#00FF88]" />
                  <span>Querying high-frequency log buffer...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center text-gray-500 font-mono flex flex-col items-center justify-center gap-2">
                  <Terminal className="w-8 h-8 text-gray-600 mb-1" />
                  <span>No log entries match your filter rules.</span>
                </div>
              ) : (
                logs.map((logItem, idx) => {
                  const isError = logItem.level === "ERROR";
                  const isWarn = logItem.level === "WARN";
                  const isExpanded = !!expandedLogIndices[idx];

                  return (
                    <div
                      key={idx}
                      className={`w-full min-w-0 p-3 rounded-xl sm:rounded-2xl border transition-all overflow-hidden ${
                        isError
                          ? "bg-red-500/5 border-red-500/25 hover:border-red-500/40"
                          : isWarn
                          ? "bg-amber-500/5 border-amber-500/25 hover:border-amber-500/40"
                          : "bg-white/[0.015] border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div
                        onClick={() => toggleExpandLog(idx)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none w-full min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                          {logItem.data ? (
                            isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )
                          ) : (
                            <div className="w-3.5 shrink-0" />
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold tracking-wider shrink-0 ${
                              isError
                                ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                                : isWarn
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                            }`}
                          >
                            {logItem.level}
                          </span>

                          <span className="text-gray-200 font-mono text-[11px] sm:text-xs truncate min-w-0">
                            {logItem.message}
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 mt-1 sm:mt-0 pt-1 sm:pt-0 border-t border-white/5 sm:border-t-0 w-full sm:w-auto">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(logItem.timestamp).toLocaleTimeString()}
                          </span>

                          {logItem.data && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLog(JSON.stringify(logItem.data, null, 2), idx);
                              }}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1 text-[10px]"
                              title="Copy structured payload"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3 h-3 text-[#00FF88]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Data Payload */}
                      {isExpanded && logItem.data && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/5 pl-2 sm:pl-6 w-full min-w-0 overflow-x-auto">
                          <div className="flex items-center justify-between mb-1 text-[10px] text-gray-400">
                            <span className="font-bold text-[#00FF88]">STRUCTURED PAYLOAD:</span>
                            <span>JSON</span>
                          </div>
                          <pre className="text-[10px] sm:text-[11px] text-emerald-300 bg-black/60 p-2.5 sm:p-3.5 rounded-xl border border-white/10 font-mono leading-relaxed overflow-x-auto break-words">
                            {JSON.stringify(logItem.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

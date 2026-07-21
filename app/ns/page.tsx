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
} from "lucide-react";

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

  // Logs Explorer States
  const [logs, setLogs] = useState<AnyValue[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [expandedLogIndices, setExpandedLogIndices] = useState<{ [key: number]: boolean }>({});

  const fetchOpsData = useCallback(async () => {
    setRefreshing(true);
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

  useEffect(() => {
    if (activeTab === "logs" && !accessDenied) {
      fetchLogs();
    }
  }, [activeTab, logLevelFilter, fetchLogs, accessDenied]);

  const toggleExpandLog = (idx: number) => {
    setExpandedLogIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center p-6 font-mono">
        <RefreshCw className="w-8 h-8 text-[#00FF88] animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading Operations Telemetry...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">403 Forbidden</h1>
        <p className="text-gray-400 max-w-md mb-6 text-sm">
          Access to the Operations Center (<code className="text-[#00FF88]">/ns</code>) is restricted to the authorized primary system operator account.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const mongo = telemetry?.mongo || {};
  const redis = telemetry?.redis || {};
  const system = telemetry?.system || {};
  const metrics = telemetry?.metrics || {};
  const build = telemetry?.build || {};

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#00FF88] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-mono">
                SRM NEXUS OPERATIONS CENTER
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                /ns
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Request ID: {telemetry?.requestId || "N/A"} • Environment: {system?.environment || "development"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchOpsData();
                if (activeTab === "logs") fetchLogs();
              }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === "logs"
                ? "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Terminal className="w-4 h-4" /> Logs Explorer
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Primary Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MongoDB Health */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" /> MongoDB Atlas
                  </span>
                  {mongo?.status === "healthy" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-xl font-bold font-mono capitalize">{mongo?.status || "Unknown"}</div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  Latency: {mongo?.latencyMs >= 0 ? `${mongo.latencyMs}ms` : "N/A"}
                </p>
              </div>

              {/* Redis Cache */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" /> Upstash Redis
                  </span>
                  {redis?.status === "healthy" ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="text-xl font-bold font-mono capitalize">{redis?.status || "Disabled"}</div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  Status: {redis?.statusText || "N/A"} {redis?.latencyMs >= 0 ? `(${redis.latencyMs}ms)` : ""}
                </p>
              </div>

              {/* Active Sessions */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Active Sessions
                  </span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold font-mono">{metrics?.activeSessions ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  Registered Users: {metrics?.totalRegisteredUsers ?? 0}
                </p>
              </div>

              {/* Node Heap Usage */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" /> RAM Heap Usage
                  </span>
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold font-mono">{system?.memory?.heapUsedMB ?? 0} MB</div>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  Total Heap: {system?.memory?.heapTotalMB ?? 0} MB (RSS: {system?.memory?.rssMB ?? 0} MB)
                </p>
              </div>
            </div>

            {/* Runtime Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold font-mono text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00FF88]" /> Process Runtime Metadata
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">System Uptime</span>
                    <span>
                      {system?.uptimeSeconds
                        ? `${Math.floor(system.uptimeSeconds / 3600)}h ${Math.floor(
                            (system.uptimeSeconds % 3600) / 60
                          )}m ${system.uptimeSeconds % 60}s`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Node Runtime Version</span>
                    <span>{system?.nodeVersion || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Process PID</span>
                    <span>{system?.processId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">Application Version</span>
                    <span className="text-[#00FF88]">{build?.version || "3.0.0"}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold font-mono text-gray-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Owner Access Controls
                </h3>
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs font-mono space-y-2">
                  <p className="text-cyan-300 font-semibold">Backend Authorization Status: VERIFIED</p>
                  <p className="text-gray-400">
                    All telemetry routes under <code className="text-white">/api/v1/ops/*</code> enforce backend verification against authorized owner handles (<code className="text-[#00FF88]">ns4770@srmist.edu.in</code>).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGS EXPLORER */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Search & Filter Control Bar */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search logs by request ID, user, path, or error..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/50"
                />
              </div>

              {/* Level Filter Pills */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 font-mono text-xs w-full sm:w-auto justify-center">
                <Filter className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1 hidden sm:inline" />
                {["ALL", "INFO", "WARN", "ERROR"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      logLevelFilter === lvl
                        ? "bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchLogs}
                className="px-4 py-2 rounded-xl bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 hover:bg-[#00FF88]/20 text-xs font-mono font-semibold transition-all w-full sm:w-auto"
              >
                Search
              </button>
            </div>

            {/* Logs List Container */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl font-mono text-xs space-y-2 max-h-[650px] overflow-y-auto">
              {logsLoading ? (
                <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00FF88]" /> Querying log ring buffer...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No matching log entries found in ring buffer.
                </div>
              ) : (
                logs.map((logItem, idx) => {
                  const isError = logItem.level === "ERROR";
                  const isWarn = logItem.level === "WARN";
                  const isExpanded = !!expandedLogIndices[idx];

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isError
                          ? "bg-red-500/5 border-red-500/20"
                          : isWarn
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-white/[0.01] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div
                        onClick={() => toggleExpandLog(idx)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {logItem.data ? (
                            isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )
                          ) : (
                            <div className="w-3.5 shrink-0" />
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isError
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : isWarn
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            }`}
                          >
                            {logItem.level}
                          </span>

                          <span className="text-gray-200 truncate">{logItem.message}</span>
                        </div>

                        <span className="text-[10px] text-gray-500 shrink-0">
                          {new Date(logItem.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Expandable Structured Payload */}
                      {isExpanded && logItem.data && (
                        <div className="mt-3 pt-2 border-t border-white/5 pl-6 overflow-x-auto">
                          <pre className="text-[11px] text-gray-300 bg-black/40 p-3 rounded-lg border border-white/5 font-mono leading-relaxed">
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

"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import Toast from "@/components/Toast";
import {
  Users, UserPlus, Sparkles, Clock, Calendar, Check, X, Shield, Lock,
  ChevronRight, RefreshCw, Trash2, BookOpen, AlertCircle, Search, Flame, ArrowRight,
  TrendingUp, CheckCircle2, UserCheck, Eye, EyeOff, Share2, Copy, MapPin
} from "lucide-react";

interface Friend {
  id: string;
  name: string;
  maskedRegNo: string;
  department: string;
  avatar?: string;
  grantedToFriend: {
    timetable: boolean;
    attendance: boolean;
    marks: boolean;
    profile: boolean;
  };
  receivedFromFriend: {
    timetable: boolean;
    attendance: boolean;
    marks: boolean;
    profile: boolean;
  };
  since?: string;
}

interface FriendRequest {
  id: string;
  studentId: string;
  name: string;
  maskedRegNo: string;
  department: string;
  note?: string;
  createdAt: string;
}

interface SearchStudent {
  id: string;
  name: string;
  maskedRegNo: string;
  department: string;
  relationship: "self" | "friend" | "pending_sent" | "pending_received" | "none";
}

export default function FriendsSyncPage() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((state) => state.profile);
  const theme = useThemeStore((state) => state.theme);
  const [activeTab, setActiveTab] = useState<"friends" | "freetime" | "schedule" | "attendance">("freetime");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);

  // Free Time Planner State
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedDayOrder, setSelectedDayOrder] = useState<number>(1);
  const [minDuration, setMinDuration] = useState<number>(45);

  // Single Friend Inspector State (for Schedule & Attendance tabs)
  const [inspectedFriendId, setInspectedFriendId] = useState<string>("");

  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 1. Fetch Friends
  const { data: friendsData, isLoading: isFriendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ["friends-list"],
    queryFn: () => friendsAPI.getFriends(),
    staleTime: 30000,
  });

  const friends: Friend[] = useMemo(() => friendsData?.friends || [], [friendsData]);

  // Set default inspected friend & default selection for free time
  useEffect(() => {
    if (friends.length > 0) {
      if (!inspectedFriendId) {
        setInspectedFriendId(friends[0].id);
      }
      if (selectedFriendIds.length === 0) {
        setSelectedFriendIds([friends[0].id]);
      }
    }
  }, [friends, inspectedFriendId, selectedFriendIds]);

  // 2. Fetch Requests
  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => friendsAPI.getRequests(),
    staleTime: 15000,
  });

  const incomingRequests: FriendRequest[] = useMemo(() => requestsData?.incoming || [], [requestsData]);
  const outgoingRequests: FriendRequest[] = useMemo(() => requestsData?.outgoing || [], [requestsData]);

  // 3. Search Query
  const { data: searchResultsData, isFetching: isSearching } = useQuery({
    queryKey: ["search-students", searchDebounced],
    queryFn: () => friendsAPI.search(searchDebounced),
    enabled: searchDebounced.length >= 2,
    staleTime: 20000,
  });

  const searchResults: SearchStudent[] = useMemo(() => searchResultsData?.results || [], [searchResultsData]);

  // 4. Resolve Today's Day Order
  const { data: dayOrderData } = useQuery({
    queryKey: ["current-day-order"],
    queryFn: () => friendsAPI.getDayOrder(),
    staleTime: 60000 * 30,
  });

  useEffect(() => {
    if (dayOrderData?.dayOrderInfo?.dayOrder) {
      setSelectedDayOrder(dayOrderData.dayOrderInfo.dayOrder);
    }
  }, [dayOrderData]);

  // 5. Free Time Engine Calculation Query
  const { data: freeTimeData, isFetching: isFreeTimeLoading, refetch: refetchFreeTime } = useQuery({
    queryKey: ["friends-free-time", selectedFriendIds, selectedDayOrder, minDuration],
    queryFn: () => friendsAPI.findCommonFreeSlots(selectedFriendIds, selectedDayOrder, minDuration),
    enabled: selectedFriendIds.length > 0,
    staleTime: 30000,
  });

  // 6. Schedule & Course Comparison Query
  const { data: compareData, isFetching: isCompareLoading } = useQuery({
    queryKey: ["friend-comparison", inspectedFriendId],
    queryFn: () => friendsAPI.compare(inspectedFriendId),
    enabled: Boolean(inspectedFriendId),
    staleTime: 30000,
  });

  // 7. Friend Timetable Query
  const { data: friendTimetableData } = useQuery({
    queryKey: ["friend-timetable", inspectedFriendId, selectedDayOrder],
    queryFn: () => friendsAPI.getFriendTimetable(inspectedFriendId, selectedDayOrder),
    enabled: Boolean(inspectedFriendId),
    staleTime: 30000,
  });

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: (targetIdentifier: string) => friendsAPI.sendRequest(targetIdentifier),
    onSuccess: (res) => {
      showToast("Request Sent", res.message || "Friend request sent successfully!", "success");
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
      queryClient.invalidateQueries({ queryKey: ["friends-list"] });
    },
    onError: (err: AnyValue) => {
      showToast("Request Failed", err?.response?.data?.error || "Could not send friend request.", "error");
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsAPI.acceptRequest(requestId),
    onSuccess: () => {
      showToast("Connected!", "Friend request accepted. Timetables are now synced!", "success");
      queryClient.invalidateQueries({ queryKey: ["friends-list"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (err: AnyValue) => {
      showToast("Error", err?.response?.data?.error || "Could not accept request.", "error");
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsAPI.rejectRequest(requestId),
    onSuccess: () => {
      showToast("Request Declined", "Friend request has been removed.", "info");
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsAPI.cancelRequest(requestId),
    onSuccess: () => {
      showToast("Request Cancelled", "Outgoing request cancelled.", "info");
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => friendsAPI.removeFriend(friendId),
    onSuccess: () => {
      showToast("Friend Removed", "Peer connection and shared permissions severed.", "info");
      queryClient.invalidateQueries({ queryKey: ["friends-list"] });
      queryClient.invalidateQueries({ queryKey: ["friends-free-time"] });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ friendId, permissions }: { friendId: string; permissions: AnyValue }) =>
      friendsAPI.updatePermissions(friendId, permissions),
    onSuccess: () => {
      showToast("Permissions Saved", "Privacy controls updated for this friend.", "success");
      queryClient.invalidateQueries({ queryKey: ["friends-list"] });
    },
  });

  const toggleFriendSelection = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
  };

  // Sub-tab state for schedule inspector
  const [scheduleSubTab, setScheduleSubTab] = useState<"daily" | "common">("daily");

  const inspectedFriend = useMemo(() => {
    return friends.find((f) => f.id === inspectedFriendId) || friends[0];
  }, [friends, inspectedFriendId]);

  const hasTimetablePermission = useMemo(() => {
    if (!inspectedFriend) return false;
    return inspectedFriend.receivedFromFriend?.timetable !== false && friendTimetableData?.success !== false;
  }, [inspectedFriend, friendTimetableData]);

  const handleShareFriendSchedule = async (friend: Friend | undefined, schedule: AnyValue) => {
    if (!friend) return;
    const dayText = `Day Order ${selectedDayOrder}`;
    const periods = schedule?.periods || [];
    const classes = periods.filter((p: AnyValue) => !p.isFree);
    const freeCount = schedule?.totalFreePeriods ?? periods.filter((p: AnyValue) => p.isFree).length;
    
    let classListText = "";
    if (classes.length > 0) {
      classListText = classes.map((p: AnyValue) => `  • P${p.period} (${p.startTime}-${p.endTime}): ${p.course?.courseTitle || p.course?.courseCode} (Room ${p.course?.roomNo || "TBA"}, Slot ${p.course?.slot || "—"})`).join("\n");
    } else {
      classListText = "  • No classes scheduled (Free Day! 🎉)";
    }

    const summary = `📅 *SRM Nexus Schedule Sync*\n👤 *${friend.name}*'s Schedule for *${dayText}*\n\n${classListText}\n\n⚡ *${freeCount} Free Period(s)*\n✨ Synced via SRM Nexus`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Schedule for ${friend.name} (${dayText})`,
          text: summary,
        });
        return;
      } catch (_) {}
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
      showToast("Copied to Clipboard", "Friend schedule details copied! Ready to share.", "success");
    }
  };

  const handleShareFreeSlot = async (slot: AnyValue, dayOrder: number) => {
    const text = `⚡ *Free Time Together on SRM Nexus!*\n📆 Day Order ${dayOrder}\n⏰ *${slot.startTime} – ${slot.endTime}* (${slot.durationMinutes} mins free)\n👥 Periods P${slot.startPeriod} to P${slot.endPeriod} are open for all of us.\nLet's meet up! 🚀`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Free Time Together", text });
        return;
      } catch (_) {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast("Copied to Clipboard", "Free window copied! Ready to send on WhatsApp.", "success");
    }
  };

  const dayResult = freeTimeData?.days?.[0];
  const commonIntervals = dayResult?.intervals || [];
  const periodMatrix = dayResult?.periodMatrix || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-36 max-w-6xl mx-auto overflow-x-hidden w-full">
      {toast && <Toast title={toast.title} body={toast.body} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 sm:px-6 md:px-8 pt-20 sm:pt-6 mb-6">
        {/* Title row & Subtitle — right-padded on mobile so it never collides with floating status bar buttons */}
        <div className="pr-24 sm:pr-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Friends Sync
            </h1>
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.35)]">
              PRO
            </span>
          </div>

          {/* Subtitle — cleanly wrapped within available width */}
          <p className="text-xs sm:text-sm text-white/50 mt-1.5 font-medium leading-relaxed">
            Zero-friction peer discovery, permissioned timetable sync &amp; instant common free time planner.
          </p>
        </div>


        {/* Status pills */}
        <div className="flex items-center gap-2 mt-3">
          <div className="bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-white/80">
            <Users size={14} className="text-purple-400" />
            <span>{friends.length} {friends.length === 1 ? "Friend" : "Friends"}</span>
          </div>
          {incomingRequests.length > 0 && (
            <button
              onClick={() => setActiveTab("friends")}
              className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black animate-pulse"
            >
              <AlertCircle size={13} />
              <span>{incomingRequests.length} Pending</span>
            </button>
          )}
        </div>

        {/* ─── Tab Navigation Bar ─ full bleed scroll, outside any pr-20 scope ─── */}
        <div className="mt-5 -mx-4 sm:mx-0">
          <div className="overflow-x-auto no-scrollbar scrollbar-none border-b border-white/10">
            <div className="flex items-center gap-2 min-w-max px-4 sm:px-0 pb-2">
              <button
                onClick={() => setActiveTab("freetime")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "freetime"
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Flame size={15} className={activeTab === "freetime" ? "text-amber-400" : "text-white/40"} />
                ⚡ Free Time Together
              </button>

              <button
                onClick={() => setActiveTab("schedule")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "schedule"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calendar size={15} className={activeTab === "schedule" ? "text-purple-400" : "text-white/40"} />
                📅 Shared Schedule
              </button>

              <button
                onClick={() => setActiveTab("attendance")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "attendance"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <TrendingUp size={15} className={activeTab === "attendance" ? "text-emerald-400" : "text-white/40"} />
                📊 Attendance Radar
              </button>

              <button
                onClick={() => setActiveTab("friends")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "friends"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Users size={15} className={activeTab === "friends" ? "text-blue-400" : "text-white/40"} />
                👥 Friends &amp; Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── TAB 1: FREE TIME TOGETHER (FLAGSHIP CONSTRAINT ENGINE) ───────────── */}
      {activeTab === "freetime" && (
        <section className="space-y-6 px-4 sm:px-6 md:px-8">
          {friends.length === 0 ? (
            <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl my-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center mb-4 text-purple-300 shadow-inner">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">No Friends Connected Yet</h3>
                <p className="text-xs text-white/55 mt-2 mb-6 leading-relaxed">
                  Add your classmates by Registration Number or NetID to discover when you are free together!
                </p>
                <button
                  onClick={() => setActiveTab("friends")}
                  className="inline-flex items-center justify-center gap-2 w-fit min-w-[160px] max-w-[200px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>Add First Friend</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Controls Bar */}
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Select Friends */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2.5">
                      Select Friends to Sync With
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {friends.map((f) => {
                        const isSelected = selectedFriendIds.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => toggleFriendSelection(f.id)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/10"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${
                                isSelected ? "bg-amber-400 text-black" : "bg-white/20 text-white"
                              }`}
                            >
                              {f.name.slice(0, 1)}
                            </span>
                            <span>{f.name}</span>
                            {isSelected && <Check size={13} className="text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Order & Duration Selectors */}
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">
                        Day Order
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDayOrder(d)}
                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                              selectedDayOrder === d
                                ? "bg-amber-400 text-black shadow-md"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            D{d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5">
                        Min Slot
                      </label>
                      <select
                        value={minDuration}
                        onChange={(e) => setMinDuration(Number(e.target.value))}
                        className="bg-black/60 border border-white/10 text-xs font-bold text-white rounded-2xl px-3 py-2 outline-none h-10"
                      >
                        <option value={45}>50 mins (1 Period)</option>
                        <option value={90}>1h 40m (2 Periods)</option>
                        <option value={130}>2h 30m+ (Half Day)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Windows Result Banner */}
              {isFreeTimeLoading ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center">
                  <RefreshCw size={24} className="animate-spin text-amber-400 mx-auto mb-3" />
                  <p className="text-xs text-white/60 font-bold uppercase tracking-wider">
                    Intersecting Timetables & Solving Constraint Matrix...
                  </p>
                </div>
              ) : commonIntervals.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Flame size={16} /> Mutually Free Time Slots (Day Order {selectedDayOrder})
                    </h2>
                    <span className="text-xs text-white/40 font-bold">
                      {commonIntervals.length} slot{commonIntervals.length > 1 ? "s" : ""} found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commonIntervals.map((slot: AnyValue, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 rounded-3xl p-5 shadow-[0_8px_30px_rgba(245,158,11,0.08)] relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                            🔥 Everyone Free
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white/80 tabular-nums">
                              {slot.durationMinutes} Minutes
                            </span>
                            <button
                              onClick={() => handleShareFreeSlot(slot, selectedDayOrder)}
                              className="bg-amber-400 hover:bg-amber-300 text-black p-1.5 rounded-xl transition-all shadow-md flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                              title="Share this free window"
                            >
                              <Share2 size={12} />
                              <span className="hidden sm:inline">Share</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-2xl font-black tracking-tight text-white mb-1 tabular-nums">
                          {slot.startTime} ── {slot.endTime}
                        </div>

                        <p className="text-xs text-white/60 font-medium">
                          Periods {slot.startPeriod} to {slot.endPeriod} • All {slot.freeStudentCount} students have no classes scheduled.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-center">
                  <AlertCircle size={32} className="mx-auto text-amber-400/60 mb-2" />
                  <h4 className="text-sm font-black text-white">No Common Free Windows</h4>
                  <p className="text-xs text-white/50 mt-1">
                    No simultaneous free slots matching the {minDuration}-minute criteria were found on Day Order {selectedDayOrder}.
                  </p>
                </div>
              )}

              {/* Full Period Breakdown Matrix */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                  Day Order {selectedDayOrder} Schedule Breakdown
                </h3>

                <div className="space-y-2">
                  {periodMatrix.map((p: AnyValue) => (
                    <div
                      key={p.period}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        p.isAllFree
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                          : "bg-white/[0.02] border-white/5 text-white/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black tabular-nums">
                          P{p.period}
                        </span>
                        <div>
                          <div className="text-xs font-bold tabular-nums">
                            {p.startTime} – {p.endTime}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {p.isAllFree ? "✓ FREE TOGETHER" : `${p.freeCount}/${p.totalCount} Free`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {p.statuses.map((st: AnyValue) => (
                          <div
                            key={st.userId}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border ${
                              st.isFree
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                : "bg-red-500/15 border-red-500/30 text-red-300"
                            }`}
                          >
                            <span>{st.name}</span>
                            <span>{st.isFree ? "Free" : `Class: ${st.courseTitle?.slice(0, 14) || "Busy"}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ─── TAB 2: SHARED SCHEDULE & TIMETABLE COMPARISON ────────────────────── */}
      {activeTab === "schedule" && (
        <section className="space-y-6 px-4 sm:px-6 md:px-8">
          {friends.length === 0 ? (
            <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl my-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-4 text-purple-300 shadow-inner">
                  <Calendar size={32} />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">No Friends Connected</h3>
                <p className="text-xs text-white/55 mt-2 mb-6 leading-relaxed">
                  Connect with a classmate to view their daily timetable and compare registered subjects.
                </p>
                <button
                  onClick={() => setActiveTab("friends")}
                  className="inline-flex items-center justify-center gap-2 w-fit min-w-[160px] max-w-[200px] bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>Add Friend</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Friend Selector Bar */}
              <div className="w-full overflow-x-auto no-scrollbar scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2 min-w-max">
                  {friends.map((f) => {
                    const isSelected = inspectedFriendId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setInspectedFriendId(f.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                          isSelected
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-lg"
                            : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-400/30 text-purple-200 flex items-center justify-center text-[10px] font-black">
                          {f.name.slice(0, 1)}
                        </span>
                        <span>{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Friend Context & Day Order Controls Header */}
              {inspectedFriend && (
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black text-base flex items-center justify-center shadow-lg">
                        {inspectedFriend.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{inspectedFriend.name}</h3>
                          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-lg text-white/60 font-bold">
                            {inspectedFriend.maskedRegNo}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{inspectedFriend.department || "SRM Student"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleShareFriendSchedule(inspectedFriend, friendTimetableData?.schedule)}
                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-md"
                        title="Share schedule comparison on WhatsApp"
                      >
                        <Share2 size={14} />
                        <span>Share Schedule</span>
                      </button>
                    </div>
                  </div>

                  {/* Day Order Switcher & View Mode Toggle */}
                  <div className="mt-6 pt-5 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Sub-view toggle */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-2xl">
                      <button
                        onClick={() => setScheduleSubTab("daily")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          scheduleSubTab === "daily"
                            ? "bg-purple-500 text-white shadow-md font-black"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <Calendar size={13} />
                        <span>Day Order {selectedDayOrder}</span>
                      </button>

                      <button
                        onClick={() => setScheduleSubTab("common")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          scheduleSubTab === "common"
                            ? "bg-purple-500 text-white shadow-md font-black"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <BookOpen size={13} />
                        <span>Common Subjects ({compareData?.comparison?.timetableComparison?.totalCommonCourses || 0})</span>
                      </button>
                    </div>

                    {/* Day Order 1 - 5 Switcher */}
                    {scheduleSubTab === "daily" && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/40 mr-1 hidden sm:inline">
                          Day Order:
                        </span>
                        <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-2xl">
                          {[1, 2, 3, 4, 5].map((d) => {
                            const isToday = dayOrderData?.dayOrderInfo?.dayOrder === d;
                            return (
                              <button
                                key={d}
                                onClick={() => setSelectedDayOrder(d)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all relative ${
                                  selectedDayOrder === d
                                    ? "bg-purple-500 text-white shadow-md"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                D{d}
                                {isToday && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-black" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 1: DAILY SCHEDULE TIMELINE */}
              {scheduleSubTab === "daily" && (
                <>
                  {!hasTimetablePermission ? (
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center max-w-md mx-auto">
                      <Lock size={36} className="mx-auto text-amber-400/70 mb-3" />
                      <h3 className="text-base font-black text-white">Timetable is Private</h3>
                      <p className="text-xs text-white/50 mt-1 mb-4">
                        {inspectedFriend?.name || "This student"} has chosen not to share their timetable. They can toggle permission on at any time.
                      </p>
                      <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                        Protected by Nexus Zero-Trust Permission Layer
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                            Classes on D{selectedDayOrder}
                          </span>
                          <div className="text-2xl font-black text-purple-300 tabular-nums">
                            {friendTimetableData?.schedule?.totalClassPeriods ?? friendTimetableData?.schedule?.periods?.filter((p: AnyValue) => !p.isFree).length ?? 0}
                          </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                            Free Periods
                          </span>
                          <div className="text-2xl font-black text-amber-300 tabular-nums">
                            {friendTimetableData?.schedule?.totalFreePeriods ?? friendTimetableData?.schedule?.periods?.filter((p: AnyValue) => p.isFree).length ?? 0}
                          </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                            Shared In Syllabus
                          </span>
                          <div className="text-2xl font-black text-emerald-300 tabular-nums">
                            {compareData?.comparison?.timetableComparison?.totalCommonCourses || 0}
                          </div>
                        </div>
                      </div>

                      {/* Period By Period List */}
                      <div className="space-y-2.5">
                        {friendTimetableData?.schedule?.periods?.map((p: AnyValue) => {
                          const isFree = p.isFree || !p.course;
                          const course = p.course;
                          const isLab = (course?.slot || "").toUpperCase().startsWith("P") || 
                                        (course?.slot || "").toUpperCase().startsWith("L") || 
                                        (course?.courseType || "").toLowerCase().includes("lab") || 
                                        (course?.courseType || "").toLowerCase().includes("practical");

                          const isCommon = compareData?.comparison?.timetableComparison?.commonCourses?.some(
                            (c: AnyValue) => c.courseCode?.toLowerCase() === course?.courseCode?.toLowerCase()
                          );

                          return (
                            <div
                              key={p.period}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isFree
                                  ? "bg-white/[0.015] border-white/5 opacity-75"
                                  : isLab
                                  ? "bg-pink-500/[0.04] border-pink-500/20 shadow-sm"
                                  : "bg-white/[0.03] border-white/10 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black tabular-nums shrink-0 ${
                                  isFree ? "bg-white/5 text-white/40" : isLab ? "bg-pink-500/20 text-pink-300" : "bg-purple-500/20 text-purple-300"
                                }`}>
                                  P{p.period}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white/60 tabular-nums">
                                      {p.startTime} – {p.endTime}
                                    </span>
                                    {isLab && (
                                      <span className="bg-pink-500/20 text-pink-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                        LAB
                                      </span>
                                    )}
                                    {isCommon && (
                                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                        ✨ Common
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-0.5">
                                    {isFree ? (
                                      <span className="text-white/40 font-medium">Free Period ☕</span>
                                    ) : (
                                      course?.courseTitle || course?.courseCode
                                    )}
                                  </h4>
                                </div>
                              </div>

                              {!isFree && (
                                <div className="flex items-center gap-2 flex-wrap sm:justify-end text-xs shrink-0">
                                  <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-white/70 font-mono text-[11px] font-bold">
                                    {course?.courseCode}
                                  </span>
                                  <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-white/70 text-[11px] font-bold flex items-center gap-1">
                                    <MapPin size={11} className="text-purple-400" /> Room {course?.roomNo || "TBA"}
                                  </span>
                                  <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                                    Slot {course?.slot || "—"}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* VIEW 2: REGISTERED COMMON SUBJECTS */}
              {scheduleSubTab === "common" && (
                <>
                  {isCompareLoading ? (
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center">
                      <RefreshCw size={24} className="animate-spin text-purple-400 mx-auto mb-3" />
                      <p className="text-xs text-white/60 font-bold uppercase tracking-wider">Comparing Course Registrations...</p>
                    </div>
                  ) : compareData?.comparison?.timetableComparison ? (
                    <div className="space-y-4">
                      {/* Common Course Cards */}
                      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                          Registered Common Subjects ({compareData.comparison.timetableComparison.commonCourses.length})
                        </h3>

                        {compareData.comparison.timetableComparison.commonCourses.length === 0 ? (
                          <p className="text-xs text-white/50">No overlapping courses found in your registered semester syllabus.</p>
                        ) : (
                          <div className="space-y-3">
                            {compareData.comparison.timetableComparison.commonCourses.map((cc: AnyValue, idx: number) => (
                              <div
                                key={idx}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-purple-300 font-mono">{cc.courseCode}</span>
                                    {cc.isSameSlot && (
                                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                        Same Slot ({cc.mySlot})
                                      </span>
                                    )}
                                    {cc.isSameRoom && (
                                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                        Same Room ({cc.myRoom})
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1">{cc.courseTitle}</h4>
                                </div>

                                <div className="flex items-center gap-4 text-xs shrink-0">
                                  <div className="text-right">
                                    <div className="text-[10px] text-white/40 font-bold uppercase">Your Slot</div>
                                    <div className="font-mono font-bold text-white">{cc.mySlot || "—"}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-white/40 font-bold uppercase">Friend&apos;s Slot</div>
                                    <div className="font-mono font-bold text-purple-300">{cc.friendSlot || "—"}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* ─── TAB 3: ATTENDANCE RADAR (PERMISSIONED) ────────────────────────────── */}
      {activeTab === "attendance" && (
        <section className="space-y-6 px-4 sm:px-6 md:px-8">
          {friends.length === 0 ? (
            <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl my-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center mb-4 text-emerald-300 shadow-inner">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">No Friends Connected</h3>
                <p className="text-xs text-white/55 mt-2 mb-6 leading-relaxed">
                  Add friends to safely compare course attendance margins and safe bunk cushions.
                </p>
                <button
                  onClick={() => setActiveTab("friends")}
                  className="inline-flex items-center justify-center gap-2 w-fit min-w-[160px] max-w-[200px] bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>Add Friend</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Friend Selector */}
              <div className="w-full overflow-x-auto no-scrollbar scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2 min-w-max">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setInspectedFriendId(f.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        inspectedFriendId === f.id
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-lg"
                          : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-400/30 text-emerald-200 flex items-center justify-center text-[10px] font-black">
                        {f.name.slice(0, 1)}
                      </span>
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Result / Lock Guard */}
              {compareData?.comparison?.attendanceComparison?.isLocked ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center max-w-md mx-auto">
                  <Lock size={36} className="mx-auto text-amber-400/70 mb-3" />
                  <h3 className="text-base font-black text-white">Attendance is Private</h3>
                  <p className="text-xs text-white/50 mt-1 mb-4">
                    This student has chosen not to share their attendance records with peers.
                  </p>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                    Enforced by Nexus Zero-Trust Permission Layer
                  </div>
                </div>
              ) : compareData?.comparison?.attendanceComparison ? (
                <div className="space-y-6">
                  {/* Comparison Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                        Your Overall Attendance
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                        {compareData.comparison.attendanceComparison.myOverallPercentage}%
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                        Friend&apos;s Overall Attendance
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                        {compareData.comparison.attendanceComparison.friendOverallPercentage}%
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">
                        Overall Margin Delta
                      </span>
                      <div
                        className={`text-2xl sm:text-3xl font-black tabular-nums ${
                          (compareData.comparison.attendanceComparison.overallDelta || 0) >= 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {(compareData.comparison.attendanceComparison.overallDelta || 0) >= 0 ? "+" : ""}
                        {compareData.comparison.attendanceComparison.overallDelta}%
                      </div>
                    </div>
                  </div>

                  {/* Subject By Subject Matrix */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                      Subject Attendance Comparison
                    </h3>

                    <div className="space-y-3">
                      {compareData.comparison.attendanceComparison.subjects?.map((sub: AnyValue, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <span className="text-[10px] font-black text-emerald-400 font-mono">{sub.courseCode}</span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{sub.courseTitle}</h4>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-right">
                              <div className="text-[10px] text-white/40 font-bold uppercase">You</div>
                              <div className="text-xs font-black text-white tabular-nums">{sub.myPercentage}%</div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] text-white/40 font-bold uppercase">Friend</div>
                              <div className="text-xs font-black text-emerald-300 tabular-nums">{sub.friendPercentage}%</div>
                            </div>

                            <div
                              className={`text-xs font-black px-2.5 py-1 rounded-xl border tabular-nums ${
                                sub.delta >= 0
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                  : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              }`}
                            >
                              {sub.delta >= 0 ? `+${sub.delta}%` : `${sub.delta}%`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      )}

      {/* ─── TAB 4: FRIENDS & REQUESTS HUB ────────────────────────────────────── */}
      {activeTab === "friends" && (
        <section className="space-y-8 px-4 sm:px-6 md:px-8">
          {/* Discovery & Search Input */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">
              Discover Peers by Registration Number / Email
            </h3>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="e.g. RA2411003011076 or netid@srmist.edu.in..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-amber-400/50 transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {isSearching ? (
              <div className="mt-4 text-center py-4 text-xs text-white/40 font-bold">Searching student database...</div>
            ) : searchResults.length > 0 ? (
              <div className="mt-4 space-y-2">
                {searchResults.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{st.name}</span>
                        <span className="text-xs font-mono text-white/40">{st.maskedRegNo}</span>
                      </div>
                      <p className="text-[10px] text-white/50">{st.department}</p>
                    </div>

                    <div>
                      {st.relationship === "friend" ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Check size={14} /> Connected
                        </span>
                      ) : st.relationship === "pending_sent" ? (
                        <span className="text-xs font-bold text-amber-400">Request Pending</span>
                      ) : st.relationship === "self" ? (
                        <span className="text-xs font-bold text-white/40">You</span>
                      ) : (
                        <button
                          onClick={() => sendRequestMutation.mutate(st.id)}
                          disabled={sendRequestMutation.isPending}
                          className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md"
                        >
                          + Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchDebounced.length >= 2 ? (
              <div className="mt-4 text-center py-4 text-xs text-white/40">No student found matching query.</div>
            ) : null}
          </div>

          {/* Pending Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 mb-4 flex items-center gap-2">
                <AlertCircle size={15} /> Incoming Friend Requests ({incomingRequests.length})
              </h3>

              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{req.name}</span>
                        <span className="text-xs font-mono text-white/40">{req.maskedRegNo}</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">{req.department}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptRequestMutation.mutate(req.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => rejectRequestMutation.mutate(req.id)}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friend List & Privacy Control Matrix */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
              Your Connected Friends ({friends.length})
            </h3>

            {friends.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">
                You haven&apos;t added any friends yet. Use the search bar above to connect!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 text-white font-black text-sm flex items-center justify-center">
                          {friend.name.slice(0, 1)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{friend.name}</h4>
                          <p className="text-[10px] font-mono text-white/50">{friend.maskedRegNo}</p>
                          <p className="text-[10px] text-white/40">{friend.department}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFriendMutation.mutate(friend.id)}
                        className="text-white/30 hover:text-red-400 p-1.5 transition-colors"
                        title="Remove Friend"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Privacy Toggles */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-2">
                        Allowed to see your:
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() =>
                            updatePermissionsMutation.mutate({
                              friendId: friend.id,
                              permissions: { timetable: !friend.grantedToFriend?.timetable },
                            })
                          }
                          className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                            friend.grantedToFriend?.timetable
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                              : "bg-white/5 border-white/5 text-white/30"
                          }`}
                        >
                          Timetable {friend.grantedToFriend?.timetable ? "✓" : "✗"}
                        </button>

                        <button
                          onClick={() =>
                            updatePermissionsMutation.mutate({
                              friendId: friend.id,
                              permissions: { attendance: !friend.grantedToFriend?.attendance },
                            })
                          }
                          className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                            friend.grantedToFriend?.attendance
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : "bg-white/5 border-white/5 text-white/30"
                          }`}
                        >
                          Attendance {friend.grantedToFriend?.attendance ? "✓" : "✗"}
                        </button>

                        <button
                          onClick={() =>
                            updatePermissionsMutation.mutate({
                              friendId: friend.id,
                              permissions: { marks: !friend.grantedToFriend?.marks },
                            })
                          }
                          className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                            friend.grantedToFriend?.marks
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-white/5 border-white/5 text-white/30"
                          }`}
                        >
                          Marks {friend.grantedToFriend?.marks ? "✓" : "✗"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

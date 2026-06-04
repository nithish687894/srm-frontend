"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { chatAPI } from "@/lib/api";
import { MessageSquare, Users, Sparkles, Send, Keyboard, ArrowLeft, Loader2, HelpCircle, Lock, Smile, Mic } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface Message {
  _id: string;
  room: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderDept: string;
  content: string;
  createdAt: string;
  isAudio?: boolean;
  audioDuration?: string;
}

const MOCK_VOICE_NOTE_CREATED_AT = "2026-01-01T00:00:00.000Z";

export default function ChatPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { profile, email } = useAuthStore();

  // Cohort metadata
  const [cohorts, setCohorts] = useState<{
    classRoom: string;
    department: string;
    classSlug: string;
    deptSlug: string;
    userId?: string;
  } | null>(null);

  // UI state
  const [activeRoom, setActiveRoom] = useState<string>("global:doubts");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [presenceCount, setPresenceCount] = useState<number>(1);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 1. Fetch user cohort room metadata
  useEffect(() => {
    if (!ready) return;

    chatAPI.getCohorts()
      .then((res) => {
        if (res.success) {
          setCohorts(res);
        }
      })
      .catch((err) => console.error("Failed to load room cohorts", err));
  }, [ready]);

  // 2. Room listener and Socket handlers
  useEffect(() => {
    if (!socket || !connected || !cohorts) return;

    // Join the current room
    socket.emit("join_room", activeRoom);

    // Load room message history
    setTimeout(() => setIsLoadingHistory(true), 0);
    chatAPI.getHistory(activeRoom)
      .then((res) => {
        if (res.success) {
          setMessages(res.messages);
        }
      })
      .catch((err) => console.error("Failed to load chat history", err))
      .finally(() => {
        setTimeout(() => setIsLoadingHistory(false), 0);
        scrollToBottom();
      });

    // Setup socket listeners
    socket.on("new_message", (message: Message) => {
      if (message.room === activeRoom) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    socket.on("presence_count", (data: { room: string; count: number }) => {
      if (data.room === activeRoom) {
        setPresenceCount(data.count);
      }
    });

    socket.on("user_typing", (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUser(data.userName);
      } else {
        setTypingUser(null);
      }
    });

    return () => {
      socket.emit("leave_room", activeRoom);
      socket.off("new_message");
      socket.off("presence_count");
      socket.off("user_typing");
    };
  }, [socket, connected, activeRoom, cohorts]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Handlers
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !connected) return;

    socket.emit("send_message", {
      room: activeRoom,
      content: inputText.trim(),
    });

    setInputText("");
    
    // Stop typing immediately on send
    if (isTyping) {
      setIsTyping(false);
      socket.emit("typing", { room: activeRoom, isTyping: false });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!socket || !connected) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { room: activeRoom, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { room: activeRoom, isTyping: false });
    }, 2000);
  };

  if (!ready || !cohorts) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white/50 gap-4">
        <Loader2 className="animate-spin text-[#00d4ff]" size={40} />
        <p className="text-xs uppercase tracking-widest font-black">Initializing Cohort Encryption...</p>
      </div>
    );
  }

  const hasDept = cohorts.deptSlug && cohorts.deptSlug !== "n-a";
  const hasClass = cohorts.classSlug && cohorts.classSlug !== "n-a";

  const roomOptions = [
    { 
      id: "global:doubts", 
      label: "Doubt Hub", 
      desc: "Campus-wide peer doubt board", 
      icon: HelpCircle, 
      color: "#bf00ff",
      locked: false 
    },
    { 
      id: hasDept ? `dept:${cohorts.deptSlug}` : "dept-locked", 
      label: "Department Lounge", 
      desc: hasDept ? (cohorts.department || "Academic Branch Lounge") : "Lock • Connect SRM NetID", 
      icon: Users, 
      color: "#00d4ff",
      locked: !hasDept 
    },
    { 
      id: hasClass ? `class:${cohorts.classSlug}` : "class-locked", 
      label: hasClass ? `Classroom ${cohorts.classRoom}` : "Classroom Chat", 
      desc: hasClass ? `Section Room (${cohorts.classRoom})` : "Lock • Connect SRM NetID", 
      icon: MessageSquare, 
      color: "#00ff88",
      locked: !hasClass 
    },
  ];
  const activeRoomDetails = roomOptions.find(r => r.id === activeRoom);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#16100d] via-[#090706] to-[#030202] text-white flex">
      {/* Sidebar Navigation */}

      <main className="flex-1 flex flex-col md:pl-[310px] pb-[128px] md:pb-6 pt-16 md:pt-24 px-4 max-w-7xl mx-auto w-full h-[100dvh] overflow-hidden">
        
        {/* TOP Glassmorphic Header */}
        <header className="shrink-0 flex items-center justify-between p-3.5 md:p-4 mb-3 md:mb-4 rounded-[24px] md:rounded-[28px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-2xl gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button 
              onClick={() => router.push("/dashboard")}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 hover:bg-white/10 transition-all text-white/70 hover:text-white shrink-0"
              title="Go back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 leading-none text-white truncate">
                <span className="text-[#00d4ff] shrink-0 font-bold">#</span>
                <span className="truncate">{activeRoomDetails?.label || "Cohort Chat Hub"}</span>
                <Sparkles size={13} className="text-[#00d4ff] animate-pulse shrink-0" />
              </h1>
              <p className="text-[9px] md:text-[10px] text-white/40 mt-1 font-medium truncate" title={activeRoomDetails?.desc}>
                {activeRoomDetails?.desc || "Verified Academic Micro-Communities"}
              </p>
            </div>
          </div>

          {/* Room active stats & encryption */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-black text-white/70 uppercase tracking-widest tabular-nums">
                {presenceCount} Online
              </span>
            </div>

            <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/[0.02] border border-white/5 flex items-center gap-1.5 text-white/30 text-[8px] md:text-[9px] font-bold uppercase tracking-wider">
              {connected ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="hidden xs:inline text-cyan-400">Synced</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-red-400">Syncing</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Inner layout split (Left: Rooms drawer, Right: Chat panel) */}
        <div className="flex-1 flex flex-row gap-2.5 md:gap-4 min-h-0 overflow-hidden mb-2 relative">
          
          {/* Discord-style Vertical Left Sidebar Switcher */}
          <section 
            className="shrink-0 w-[60px] lg:w-[280px] flex flex-col gap-3 overflow-y-auto pb-4 scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {roomOptions.map((room) => {
              const isActive = activeRoom === room.id;
              const RoomIcon = room.icon;

              return (
                <button
                  key={room.id}
                  onClick={() => {
                    if (room.locked) {
                      setShowLockModal(true);
                    } else {
                      setActiveRoom(room.id);
                    }
                  }}
                  className={`relative flex items-center justify-center lg:justify-start gap-3 p-0 lg:p-3.5 rounded-[20px] lg:rounded-[22px] text-left transition-all active:scale-[0.98] shrink-0 w-[52px] h-[52px] lg:w-full lg:h-auto border group ${
                    room.locked 
                      ? "bg-white/[0.005] border-white/5 opacity-60 hover:opacity-85" 
                      : isActive
                        ? "bg-white/[0.08] border-white/15 text-white"
                        : "bg-white/[0.01] border-white/5 text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }`}
                  style={{
                    boxShadow: !room.locked && isActive ? `0 4px 20px ${room.color}15, inset 0 0 12px ${room.color}10` : "none"
                  }}
                  title={room.label}
                >
                  {/* Discord-style left-active indicator pill */}
                  <div 
                    className={`absolute left-0 w-1 rounded-r-full transition-all duration-300 ${
                      isActive 
                        ? "h-8 bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" 
                        : "h-2 bg-white/20 opacity-0 group-hover:opacity-100 group-hover:h-4"
                    }`} 
                  />

                  {/* Icon container */}
                  <div 
                    className="w-9 h-9 lg:w-10 lg:h-10 rounded-[16px] lg:rounded-xl flex items-center justify-center shrink-0 relative transition-all duration-300 group-hover:rounded-xl"
                    style={{
                      background: !room.locked && isActive ? `${room.color}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${!room.locked && isActive ? `${room.color}35` : "rgba(255,255,255,0.05)"}`
                    }}
                  >
                    <RoomIcon size={16} className="lg:size-[18px]" style={{ color: !room.locked && isActive ? room.color : "currentColor" }} />
                    {room.locked && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-red-500/80 border border-white/20 flex items-center justify-center text-white shadow-md">
                        <Lock size={7} className="lg:size-[8px]" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Room labels (hidden on mobile, visible on desktop/large screens) */}
                  <div className="hidden lg:block min-w-0 flex-1">
                    <h4 className="text-[11px] font-black uppercase tracking-wider leading-tight whitespace-normal break-words">
                      {room.label}
                    </h4>
                    <p className="text-[9px] text-white/30 mt-1 leading-snug whitespace-normal break-words">
                      {room.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>

          {/* CHAT BOARD PANEL */}
          <section className="flex-1 flex flex-col rounded-[24px] md:rounded-[32px] bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl shadow-2xl relative min-h-0 overflow-hidden">
            
            {/* Messages Body */}
            <div 
              className="flex-1 overflow-y-auto p-4 md:p-6 relative scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {isLoadingHistory ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-2">
                  <Loader2 className="animate-spin text-[#00d4ff]" size={28} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Decrypting Logs...</span>
                </div>
              ) : messages.length === 0 ? (
                /* Premium Glassmorphic Empty State */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] mb-4 shadow-[0_0_20px_rgba(0,212,255,0.1)] animate-pulse">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-white mb-2">
                    Welcome to the {activeRoomDetails?.label || "Cohort Room"}
                  </h3>
                  <p className="text-[10px] text-white/40 mb-6 leading-relaxed">
                    This is the beginning of the #{activeRoomDetails?.label || "Cohort Room"} community lounge. {activeRoomDetails?.desc}
                  </p>
                  
                  {/* Quick starters / hints */}
                  <div className="w-full grid grid-cols-1 gap-2.5 text-left">
                    <div 
                      onClick={() => setInputText("Hello cohort! Let's collaborate here.")}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer group"
                    >
                      <p className="text-[10px] font-bold text-white/80 group-hover:text-[#00d4ff] transition-colors">👋 Say hello to your cohort</p>
                      <p className="text-[9px] text-white/40 mt-0.5">Introduce yourself and start the discussion.</p>
                    </div>
                    <div 
                      onClick={() => setInputText("Can someone help me understand this topic?")}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer group"
                    >
                      <p className="text-[10px] font-bold text-white/80 group-hover:text-[#00d4ff] transition-colors">💡 Ask an academic doubt</p>
                      <p className="text-[9px] text-white/40 mt-0.5">Post a study question for instant peer assistance.</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bottom-aligned message list */
                <div className="min-h-full flex flex-col justify-end space-y-1 pb-[120px] md:pb-4">
                  {(() => {
                    const listToRender = [...messages];
                    if (activeRoom === "global:doubts" && !listToRender.some(m => m._id === "mock-voice-note")) {
                      listToRender.unshift({
                        _id: "mock-voice-note",
                        room: "global:doubts",
                        senderId: "peer-jone",
                        senderName: "Jones",
                        senderInitials: "JO",
                        senderDept: "Computer Science",
                        content: "[Voice Note]",
                        createdAt: MOCK_VOICE_NOTE_CREATED_AT,
                        isAudio: true,
                        audioDuration: "0:35"
                      } as AnyValue);
                    }
                    return listToRender.map((msg, index) => {
                      const isMe = msg.senderId === email || msg.senderId === cohorts?.userId || msg.senderId === profile?.["Registration Number"] || msg.senderId === profile?.RegNo;
                      
                      // Fallbacks for data safety
                      const senderName = msg.senderName || "Academic Peer";
                      const senderInitials = msg.senderInitials || senderName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AP";
                      const senderDept = msg.senderDept || "SRM Student";

                      // Grouping logic (WhatsApp / Google Chat style)
                      const prevMsg = index > 0 ? listToRender[index - 1] : null;
                      const isGrouped = prevMsg && 
                                        prevMsg.senderId === msg.senderId && 
                                        (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000); // 2 minutes threshold

                      return (
                        <div 
                          key={msg._id} 
                          className={`flex gap-2.5 items-start max-w-[90%] md:max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"} ${isGrouped ? "mt-0.5" : "mt-3.5"}`}
                        >
                          {/* Sender Avatar Initials (Only for others) */}
                          {!isMe && (
                            !isGrouped ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d4ff]/15 to-[#bf00ff]/15 border border-white/10 flex items-center justify-center text-[9px] font-black text-[#00d4ff] shrink-0 mt-0.5 shadow-md">
                                {senderInitials}
                              </div>
                            ) : (
                              <div className="w-8 shrink-0" /> // Spacer block to align bubbles perfectly
                            )
                          )}

                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                            {/* Sender details */}
                            {!isMe && !isGrouped && (
                              <div className="flex items-center gap-1.5 pl-1 mb-1 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                                <span className="text-white/80 font-black">{senderName}</span>
                                <span className="text-white/20">•</span>
                                <span className="text-[8px] text-[#00d4ff]">{senderDept.split(" ")[0]}</span>
                              </div>
                            )}

                            {/* Bubble */}
                            {msg.isAudio ? (
                              <div 
                                className={`px-4 py-3 rounded-[20px] backdrop-blur-md flex items-center gap-3 w-[260px] xs:w-[280px] sm:w-[320px] border transition-all ${
                                  isMe 
                                    ? "bg-white/[0.04] border-white/10 text-white/90 shadow-md"
                                    : "bg-[#1c223c]/70 border-blue-500/15 text-[#dfc3a7] shadow-[0_4px_16px_rgba(28,34,60,0.2)]"
                                }`}
                              >
                                {/* Play/Pause Button */}
                                <button
                                  type="button"
                                  onClick={() => setPlayingAudioId(playingAudioId === msg._id ? null : msg._id)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white hover:bg-white/20 active:scale-90 transition-all shrink-0 shadow-sm"
                                >
                                  {playingAudioId === msg._id ? (
                                    /* Pause icon */
                                    <div className="flex gap-1">
                                      <div className="w-1 h-3.5 bg-[#00d4ff] rounded-full animate-pulse" />
                                      <div className="w-1 h-3.5 bg-[#00d4ff] rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                                    </div>
                                  ) : (
                                    /* Play triangle icon */
                                    <svg className="w-3.5 h-3.5 fill-current text-white translate-x-0.5" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  )}
                                </button>

                                {/* Waveform & Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 h-6">
                                    {/* Waveform bars */}
                                    {[4, 12, 8, 15, 6, 18, 10, 14, 8, 5, 11, 16, 7, 12, 15, 9, 13, 5, 10, 4].map((height, i) => (
                                      <div 
                                        key={i} 
                                        className="w-[2.5px] rounded-full transition-all duration-300"
                                        style={{ 
                                          height: `${height}px`,
                                          backgroundColor: playingAudioId === msg._id
                                            ? i % 3 === 0 
                                              ? "#00d4ff" 
                                              : i % 3 === 1 
                                                ? "#bf00ff" 
                                                : "#00ff88"
                                            : "rgba(255,255,255,0.2)",
                                          opacity: playingAudioId === msg._id ? 1 : 0.6,
                                          transform: playingAudioId === msg._id ? "scaleY(1.1)" : "scaleY(1)",
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between mt-1 px-0.5">
                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none">Voice Note</span>
                                    <span className="text-[8px] font-black text-[#00d4ff] tracking-wider leading-none tabular-nums">{playingAudioId === msg._id ? "0:12 / 0:35" : msg.audioDuration || "0:35"}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className={`px-4 py-3 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap ${
                                  isMe 
                                    ? `bg-white/[0.04] border border-white/10 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${isGrouped ? "rounded-[20px]" : "rounded-[20px] rounded-tr-[4px]"}` 
                                    : `bg-[#1c223c]/70 border border-blue-500/15 text-[#dfc3a7] shadow-[0_4px_16px_rgba(28,34,60,0.2)] ${isGrouped ? "rounded-[20px]" : "rounded-[20px] rounded-tl-[4px]"}`
                                }`}
                              >
                                {msg.content}
                              </div>
                            )}

                            {/* Unambiguous attributed timestamp */}
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1 pr-1 pl-1 tabular-nums">
                              {isMe ? "You" : senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* LIVE Typing indicator overlay */}
            {typingUser && (
              <div className="px-6 py-2 bg-[#00d4ff]/5 border-t border-[#00d4ff]/10 flex items-center gap-2 text-[9px] font-black tracking-wider uppercase text-[#00d4ff] animate-pulse">
                <Keyboard size={12} className="animate-bounce" />
                <span>{typingUser} is composing a query...</span>
              </div>
            )}

            {/* Chat Input Area - Floating Pill on Mobile, Integrated on Desktop */}
            <form 
              onSubmit={handleSendMessage}
              className="shrink-0 absolute bottom-[104px] left-4 right-4 md:static md:w-full md:mt-auto md:p-3.5 bg-black/40 border-t border-white/[0.08] backdrop-blur-md flex items-center gap-2 md:gap-2.5 z-40 rounded-[28px] md:rounded-none p-2"
            >
              {/* Plus Circle Button */}
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-white shrink-0"
              >
                <span className="text-xl font-light leading-none">+</span>
              </button>

              {/* Input field wrapper capsule */}
              <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-full px-4 py-2.5 flex items-center gap-2 focus-within:border-[#00d4ff]/40 focus-within:ring-2 focus-within:ring-[#00d4ff]/10 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={connected ? "Type a message..." : "Syncing connection..."}
                  disabled={!connected}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-white/35 focus:outline-none focus:ring-0 p-0 font-semibold disabled:opacity-50"
                />
                
                {/* Smiley face button */}
                <button
                  type="button"
                  className="text-white/40 hover:text-white shrink-0 transition-colors"
                >
                  <Smile size={16} />
                </button>
              </div>

              {/* Action Button (Send paper plane or Mic) */}
              <button
                type={inputText.trim() ? "submit" : "button"}
                disabled={!connected || (!!inputText.trim() && !inputText.trim())}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  inputText.trim()
                    ? "bg-gradient-to-tr from-[#00d4ff] to-[#00b2fe] hover:scale-105 active:scale-95 text-black shadow-[0_0_15px_rgba(0,212,255,0.25)] hover:shadow-[0_0_20px_rgba(0,212,255,0.45)]"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/50"
                }`}
              >
                {inputText.trim() ? (
                  <Send size={14} strokeWidth={3} className="translate-x-[-0.5px]" />
                ) : (
                  <Mic size={15} strokeWidth={2.5} />
                )}
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Premium Glassmorphic Lock Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 md:p-8 rounded-[32px] bg-gradient-to-b from-[#121324] to-[#0c0d17] border border-white/10 shadow-2xl text-center flex flex-col items-center gap-4">
            
            {/* Pulsing Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
              <Lock size={28} strokeWidth={2.5} />
            </div>

            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Unlock Verified Cohort Chat
            </h3>

            <p className="text-[11px] text-white/60 leading-relaxed max-w-xs">
              Connecting your official SRM Academic Account unlocks dedicated real-time encrypted micro-communities for your specific classroom section and department lounge.
            </p>

            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00d4ff] to-[#00b2fe] hover:scale-[1.02] active:scale-[0.98] transition-all text-black font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(0,212,255,0.25)]"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowLockModal(false)}
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all text-white/70 hover:text-white font-bold uppercase tracking-wider text-xs"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

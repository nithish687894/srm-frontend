"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { motion, AnimatePresence } from "framer-motion";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIPage() {
  const { theme } = useThemeStore();
  const { academicData, setAcademicData: setGlobalData } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "AI INITIALIZED. ASK ME ABOUT ATTENDANCE, MARKS, OR TIMETABLE." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localAcademicData, setLocalAcademicData] = useState<any>(academicData);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) { router.push("/"); return; }
    Promise.all([
      dataAPI.getAll(),
      dataAPI.getMyTimetable(),
      dataAPI.getCalendar()
    ]).then(([allData, myTT, calData]) => {
      const calendarRows = calData?.data || [];
      const todayIso = new Date().toISOString().split('T')[0];
      const todayEvent = calendarRows.find((c: any) => todayIso && c.date === todayIso);
      const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const tomorrowEvent = calendarRows.find((c: any) => tomorrowIso && c.date === tomorrowIso);

      let calendarStr = "";
      if (todayEvent) calendarStr += `Today (${todayIso}): Day Order ${todayEvent.dayOrder || "N/A"} - ${todayEvent.event || "No event"}\n`;
      if (tomorrowEvent) calendarStr += `Tomorrow (${tomorrowIso}): Day Order ${tomorrowEvent.dayOrder || "N/A"} - ${tomorrowEvent.event || "No event"}`;

      const courses = myTT?.data?.courses || myTT?.data || myTT || [];
      const merged = { ...allData, timetable: courses, calendarStr };
      setLocalAcademicData(merged);
      setGlobalData(merged);
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    
    const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);
    
    try {
      const historyLog = updatedMessages.slice(-11, -1);
      const res = await dataAPI.aiChat(userMsg, historyLog, localAcademicData);
      
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
      if (res.remaining !== undefined) setRemaining(res.remaining);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "CONNECTION FAILED.";
      setMessages(prev => [...prev, { role: "assistant", content: `ERROR: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const ACCENT = '#FF75C3';

  return (
    <div className="page-root" style={{ height: "100vh", background: '#050508' }}>
      <Sidebar />
      <main className="page-main" style={{ height: "100vh", display: "flex", flexDirection: "column", position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>Powered by Groq Llama-3.3</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.02em" }}>AI Assistant</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontWeight: "bold" }}>Online</div>
            </div>
            {remaining !== null && (
              <div style={{ fontSize: "11px", color: remaining <= 3 ? "#ff3b3b" : "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                {remaining} req left
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 32px" }} />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <AnimatePresence mode="popLayout">
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div style={{ 
                  maxWidth: "600px", padding: "20px 24px", fontSize: "15px", lineHeight: "1.6",
                  borderRadius: "20px", fontWeight: 500,
                  background: m.role === "user" ? "#ffffff" : "rgba(255,255,255,0.03)",
                  border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.05)",
                  color: m.role === "user" ? "#000000" : "#ffffff",
                  boxShadow: m.role === "user" ? "0 10px 30px rgba(255,255,255,0.1)" : "none"
                }}>
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                Assistant
              </div>
              <div style={{ padding: "16px 24px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px" }}>
                {[0,1,2].map(i => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: "24px 32px 32px", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Query the system..."
              style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", fontSize: "16px", outline: "none", padding: "24px 32px", borderRadius: "24px", fontWeight: "bold" }}
              disabled={loading}
              autoFocus
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width: "64px", height: "64px", borderRadius: "24px", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? ACCENT : "rgba(255,255,255,0.05)", color: input.trim() && !loading ? "#000" : "#555", fontWeight: 900, fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              ›
            </button>
          </div>
        </div>

        <div className="watermark" style={{ bottom: "140px", opacity: 0.03, color: '#222' }}>AI Assistant</div>

      </main>
    </div>
  );
}
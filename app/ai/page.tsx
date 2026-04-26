"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIPage() {
  const { theme } = useThemeStore();
  const isEduverse = theme === "cosmos";
  const { academicData, setAcademicData: setGlobalData } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "AI INITIALIZED. ASK ME ABOUT ATTENDANCE, MARKS, OR TIMETABLE." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localAcademicData, setLocalAcademicData] = useState<any>(academicData);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) { router.push("/"); return; }
    Promise.all([
      dataAPI.getAll(),
      dataAPI.getMyTimetable(),
      dataAPI.getCalendar()
    ]).then(([allData, myTT, calData]) => {
      const calendarRows = calData?.data || [];
      const todayIso = new Date().toISOString().split('T')[0];
      const todayEvent = calendarRows.find((c: any) => c.date === todayIso);
      const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const tomorrowEvent = calendarRows.find((c: any) => c.date === tomorrowIso);

      let calendarStr = "";
      if (todayEvent) calendarStr += `Today (${todayIso}): Day Order ${todayEvent.dayOrder || "N/A"} - ${todayEvent.event || "No event"}\n`;
      if (tomorrowEvent) calendarStr += `Tomorrow (${tomorrowIso}): Day Order ${tomorrowEvent.dayOrder || "N/A"} - ${tomorrowEvent.event || "No event"}`;

      const merged = { ...allData, timetable: myTT?.data || myTT || [], calendarStr };
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

  return (
    <div className="page-root" style={{ height: "100vh" }}>
      <Sidebar />
      <main className="page-main" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "11px", color: isEduverse ? "var(--text-secondary)" : "#666666", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>Powered by Groq Llama-3.3</div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: isEduverse ? "#eef2ff" : "#ffffff", lineHeight: 1, letterSpacing: "-0.02em" }}>AI Tutor</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isEduverse ? "#60a5fa" : "#a8c200" }} />
              <div style={{ fontSize: "12px", color: isEduverse ? "var(--text-secondary)" : "#888888", letterSpacing: "0.1em", fontWeight: "bold" }}>Online</div>
            </div>
            {remaining !== null && (
              <div style={{ fontSize: "11px", color: remaining <= 3 ? "#ff3b3b" : "#666666", letterSpacing: "0.1em" }}>
                {remaining} req left
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "1px", background: isEduverse ? "rgba(132,157,255,0.22)" : "#1c1c1c", margin: "0 24px" }} />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: "10px", color: isEduverse ? "var(--text-muted)" : "#555555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div style={{ 
                maxWidth: "600px", padding: "20px 24px", fontSize: "15px", lineHeight: "1.6",
                borderRadius: "14px", fontWeight: 500,
                background: m.role === "user"
                  ? (isEduverse ? "linear-gradient(90deg, #325df8, #5b43ea)" : "#ffffff")
                  : (isEduverse ? "linear-gradient(180deg, rgba(22,34,73,0.82), rgba(13,22,52,0.84))" : "#1c1c1c"),
                color: m.role === "user" ? "#eef2ff" : (isEduverse ? "#dbe5ff" : "#ffffff"),
                border: isEduverse ? "1px solid rgba(132,157,255,0.22)" : "none",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", color: isEduverse ? "var(--text-muted)" : "#555555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                Assistant
              </div>
              <div style={{ padding: "20px 24px", borderRadius: "14px", background: isEduverse ? "linear-gradient(180deg, rgba(22,34,73,0.82), rgba(13,22,52,0.84))" : "#1c1c1c", display: "flex", gap: "8px", border: isEduverse ? "1px solid rgba(132,157,255,0.22)" : "none" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: isEduverse ? "#60a5fa" : "#a8c200", animation: `pulse 1s infinite ${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: "18px 24px 24px", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Query the system..."
              style={{ flex: 1, background: isEduverse ? "rgba(14,23,53,0.9)" : "#1c1c1c", border: isEduverse ? "1px solid rgba(132,157,255,0.22)" : "none", color: "#ffffff", fontSize: "16px", outline: "none", padding: "18px 22px", borderRadius: "14px", fontWeight: "bold" }}
              disabled={loading}
              autoFocus
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width: "54px", height: "54px", borderRadius: "14px", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? (isEduverse ? "linear-gradient(90deg, #325df8, #5b43ea)" : "#ffffff") : "#2a2a2a", color: input.trim() && !loading ? "#eef2ff" : "#555555", fontWeight: 900, fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              ›
            </button>
          </div>
        </div>

        <div className="watermark" style={{ bottom: "140px" }}>AI Assistant</div>

      </main>
    </div>
  );
}
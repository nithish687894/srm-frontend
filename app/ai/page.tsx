"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Message { role: "user" | "assistant"; content: string; }

export default function AIPage() {
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
    if (!localStorage.getItem("srmx_token")) { router.push("/"); return; }
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
        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "11px", color: "#666666", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>powered by groq llama-3.3</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.02em" }}>AI ASSISTANT</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a8c200" }} />
              <div style={{ fontSize: "12px", color: "#888888", letterSpacing: "0.1em", fontWeight: "bold" }}>ONLINE</div>
            </div>
            {remaining !== null && (
              <div style={{ fontSize: "11px", color: remaining <= 3 ? "#ff3b3b" : "#666666", letterSpacing: "0.1em" }}>
                {remaining} req left
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "2px", background: "#1c1c1c", margin: "0 32px" }} />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: "10px", color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                {m.role === "user" ? "YOU" : "ASSISTANT"}
              </div>
              <div style={{ 
                maxWidth: "600px", padding: "20px 24px", fontSize: "15px", lineHeight: "1.6",
                borderRadius: "20px", fontWeight: 500,
                background: m.role === "user" ? "#ffffff" : "#1c1c1c",
                color: m.role === "user" ? "#000000" : "#ffffff",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: "bold" }}>
                ASSISTANT
              </div>
              <div style={{ padding: "20px 24px", borderRadius: "20px", background: "#1c1c1c", display: "flex", gap: "8px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a8c200", animation: `pulse 1s infinite ${i * 0.15}s` }} />)}
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
              style={{ flex: 1, background: "#1c1c1c", border: "none", color: "#ffffff", fontSize: "16px", outline: "none", padding: "24px 32px", borderRadius: "24px", fontWeight: "bold" }}
              disabled={loading}
              autoFocus
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width: "70px", height: "70px", borderRadius: "24px", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "#ffffff" : "#2a2a2a", color: input.trim() && !loading ? "#000000" : "#555555", fontWeight: 900, fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              ›
            </button>
          </div>
        </div>

        <div className="watermark" style={{ bottom: "140px" }}>ai assistant</div>

      </main>
    </div>
  );
}
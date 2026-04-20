"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Send, Bot, User } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

function buildContext(data: any): string {
  if (!data) return "";
  const name = data.profile?.["Name"] || "";
  const sem = data.profile?.["Semester"] || "";
  const att = (data.attendance || []).map((c: any) =>
    `${c["Course Code"]} - ${c["Course Title"]}: ${c["Attn %"]}% (${c["Hours Conducted"]} classes, ${c["Hours Absent"]} absent)`
  ).join("\n");
  const marks = (data.marks || []).map((m: any) =>
    `${m.courseCode} (${m.courseType}): ${(m.tests || []).map((t: any) => `${t.test}=${t.score}`).join(", ")}`
  ).join("\n");
  return `Student: ${name}\nSemester: ${sem}\n\nAttendance:\n${att}\n\nMarks:\n${marks}`;
}

export default function AIPage() {
  const { academicData, setAcademicData: setGlobalData } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I am your SRM AI assistant. Ask me anything about your attendance, marks, or timetable!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localAcademicData, setLocalAcademicData] = useState<any>(academicData);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("srmx_token")) { router.push("/"); return; }
    Promise.all([
      dataAPI.getAll(),
      dataAPI.getMyTimetable()
    ]).then(([allData, myTT]) => {
      const merged = { ...allData, timetable: myTT?.data || myTT || [] };
      setLocalAcademicData(merged);
      setGlobalData(merged);
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const [remaining, setRemaining] = useState<number | null>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    
    // Add user message to UI
    const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);
    
    try {
      // Send message along with last 10 messages for context
      const historyLog = updatedMessages.slice(-11, -1);
      const res = await dataAPI.aiChat(userMsg, historyLog, localAcademicData);
      
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
      if (res.remaining !== undefined) setRemaining(res.remaining);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Sorry, I couldn't connect to the server. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-root" style={{ height: "100vh" }}>
      <Sidebar />
      <main className="page-main" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="srmx-topbar" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #00ff87, #00e676)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={16} color="#050505" />
            </div>
            <div>
              <h1 style={{ fontWeight: 600, fontSize: "15px", color: "#f0f0f0" }}>AI Assistant</h1>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)" }}>Powered by Groq Llama-3.3</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {remaining !== null && (
              <span style={{ fontSize: "12px", color: remaining <= 3 ? "#ff4444" : "rgba(255,255,255,0.50)", fontWeight: 500, marginRight: "8px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "8px" }}>
                {remaining} messages left
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff87", animation: "pulse 2s infinite", boxShadow: "0 0 8px rgba(0,255,135,0.5)" }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.30)" }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-end" }}>
              {m.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00ff87, #00e676)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="#050505" />
                </div>
              )}
              <div style={{ maxWidth: "560px", padding: "12px 16px", fontSize: "14px", lineHeight: "1.6",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "linear-gradient(135deg, #00ff87, #00e676)" : "rgba(10,10,10,0.65)",
                border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: m.role === "user" ? "#050505" : "#f0f0f0",
                backdropFilter: m.role === "assistant" ? "blur(12px)" : "none",
              }}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={14} color="rgba(255,255,255,0.40)" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #00ff87, #00e676)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} color="#050505" />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(10,10,10,0.65)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "4px", alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff87", animation: `bounce 1s infinite ${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 32px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "8px 8px 8px 16px", borderRadius: "16px", background: "rgba(10,10,10,0.65)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about your attendance, marks, or timetable..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f0f0f0", fontSize: "14px", padding: "4px 0" }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width: "36px", height: "36px", borderRadius: "10px", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg, #00ff87, #00e676)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
              <Send size={15} color={input.trim() && !loading ? "#050505" : "rgba(255,255,255,0.20)"} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
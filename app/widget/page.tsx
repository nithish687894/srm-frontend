"use client";
import { useAuthStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function WidgetPage() {
  const { academicData } = useAuthStore();
  const att = academicData?.attendance || [];
  const avgAtt = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1) : "—";
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", 
      background: "#050505", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px"
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: "100%",
          maxWidth: "320px",
          background: "#1c1c1c",
          borderRadius: "32px",
          padding: "24px",
          border: "1px solid #333",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ fontSize: "10px", color: "#a8c200", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "16px" }}>
          NEXUS LIVE STATUS
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "48px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{avgAtt}%</div>
            <div style={{ fontSize: "12px", color: "#666", fontWeight: 800, marginTop: "4px" }}>AVG ATTENDANCE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "24px", fontWeight: 900, color: riskCount > 0 ? "#ff3b3b" : "#fff" }}>{riskCount}</div>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 800 }}>RISK</div>
          </div>
        </div>

        <div style={{ marginTop: "24px", height: "4px", background: "#333", borderRadius: "2px", overflow: "hidden" }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${avgAtt}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ height: "100%", background: "#a8c200", boxShadow: "0 0 10px #a8c200" }} 
          />
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
           <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#666", fontWeight: 900 }}>REFRESH</div>
              <div style={{ fontSize: "10px", fontWeight: 800 }}>SYNCED</div>
           </div>
           <div style={{ flex: 1, background: "rgba(168,194,0,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#a8c200", fontWeight: 900 }}>GOAL</div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#a8c200" }}>75.0%</div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

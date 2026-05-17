"use client";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MatrixAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", paddingBottom: "120px" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      <header style={{ 
        padding: "60px 24px 20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(0,0,0,0.95)', 
        backdropFilter: 'blur(20px)', 
        zIndex: 100, 
        borderBottom: '1px solid #222' 
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "14px", 
            background: "#1c1c1c", 
            border: "1px solid #333", 
            color: "#ffffff", 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
          onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#a8c200', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '2px' }}>
            PORTAL INTEGRATION
          </div>
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            ATTENDANCE
          </span>
        </div>
        <button 
          onClick={handleSync} 
          style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "14px", 
            background: "#1c1c1c", 
            border: "1px solid #333", 
            color: "#ffffff", 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
          onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {attendance?.map((course: any, i: number) => {
              const pct = parseFloat(course["Attn %"]) || 0;
              const isCritical = pct < 75;
              
              return (
                <div 
                  key={i} 
                  style={{ 
                    background: "#1c1c1c", 
                    border: isCritical ? '1px solid rgba(255,59,59,0.3)' : '1px solid #333', 
                    borderRadius: '28px', 
                    padding: '24px', 
                    position: 'relative', 
                    overflow: 'hidden' 
                  }}
                >
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ 
                           fontSize: '9px', 
                           color: '#a8c200', 
                           background: 'rgba(168,194,0,0.1)', 
                           padding: '4px 10px', 
                           borderRadius: '8px', 
                           display: 'inline-block', 
                           marginBottom: '12px', 
                           fontWeight: 900 
                         }}>{course["Course Code"]}</div>
                         <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{course["Course Title"]}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '32px', fontWeight: 900, color: isCritical ? '#ff3b3b' : '#a8c200', lineHeight: 1 }}>{pct}%</div>
                         <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', fontWeight: 800 }}>STABILITY</div>
                      </div>
                   </div>

                   <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isCritical ? '#ff3b3b' : '#a8c200', boxShadow: `0 0 10px ${isCritical ? '#ff3b3b' : '#a8c200'}` }} />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', position: 'relative' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2b2b2b', padding: '10px', borderRadius: '16px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800 }}>Conducted</div>
                         <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{course["Hours Conducted"]}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2b2b2b', padding: '10px', borderRadius: '16px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800 }}>Attended</div>
                         <div style={{ fontSize: '16px', fontWeight: 900, color: '#a8c200' }}>{course["Hours Attended"]}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2b2b2b', padding: '10px', borderRadius: '16px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800 }}>Absent</div>
                         <div style={{ fontSize: '16px', fontWeight: 900, color: '#ff3b3b' }}>{course["Hours Absent"]}</div>
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}

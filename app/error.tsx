'use client';

import { useEffect } from 'react';
import { RefreshCw, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Error Caught]:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        // Clear corrupted academic data cache while preserving auth tokens
        const auth = localStorage.getItem('auth-storage');
        localStorage.clear();
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            // Reset corrupted academicData object
            if (parsed.state) {
              parsed.state.academicData = null;
              parsed.state.studentPortalData = null;
            }
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          } catch {
            // Ignored
          }
        }
        window.location.href = '/dashboard';
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        background: '#050508',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(255, 117, 195, 0.1)',
          border: '1px solid rgba(255, 117, 195, 0.2)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '28px',
          marginBottom: '20px',
        }}
      >
        ⚡
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Session Sync Refresh Needed
      </h2>

      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '360px', marginBottom: '28px', fontSize: '13px', lineHeight: 1.5 }}>
        A portal sync update requires a quick reload. Tap Reload or Re-Sync below to refresh your dashboard.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 22px',
            background: 'linear-gradient(135deg, #FF75C3 0%, #A78BFA 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw size={15} />
          Reload
        </button>

        <button
          onClick={handleClearCacheAndReload}
          style={{
            padding: '12px 22px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RotateCcw size={15} />
          Re-Sync Cache
        </button>

        <button
          onClick={() => { window.location.href = '/dashboard'; }}
          style={{
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Home size={15} />
          Home
        </button>
      </div>
    </div>
  );
}

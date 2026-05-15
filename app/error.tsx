'use client'
 
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#050505',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>This page couldn't load</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '32px', fontSize: '14px' }}>
        Reload to try again, or go back.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Reload
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>
    </div>
  )
}

import React from "react";
import Link from "next/link";

export const metadata = {
  title: "SRM Attendance Tracker | Safe Miss Limit Calculator",
  description: "Track your SRM University attendance in real-time. Calculate how many classes you can safely miss while staying above 75%.",
};

export default function AttendanceSEO() {
  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '80px 24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
        <h1 style={{ fontSize: '48px', marginTop: '24px', marginBottom: '16px' }}>SRM Attendance Tracker</h1>
        <p style={{ fontSize: '18px', color: '#aaa', lineHeight: '1.6' }}>
          Stop worrying about debarment. Use the SRM Nexus Attendance Tracker to get a precise look at your presence records synced directly from Academia.
        </p>

        <section style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Why use SRM Nexus for Attendance?</h2>
          <ul style={{ lineHeight: '2', color: '#ccc' }}>
            <li><strong>Safe Miss Calculator:</strong> Know exactly how many more classes you can skip.</li>
            <li><strong>Real-time Sync:</strong> No manual entry. We fetch your data instantly.</li>
            <li><strong>Mobile Friendly:</strong> Check your attendance while walking to class.</li>
          </ul>
        </section>

        <div style={{ marginTop: '64px', padding: '40px', background: '#111', borderRadius: '24px', textAlign: 'center' }}>
          <h3>Ready to check your attendance?</h3>
          <Link href="/#login" style={{ display: 'inline-block', marginTop: '20px', padding: '16px 32px', background: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
            Login to SRM Nexus
          </Link>
        </div>
      </div>
    </div>
  );
}

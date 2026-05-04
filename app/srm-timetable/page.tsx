import React from "react";
import Link from "next/link";

export const metadata = {
  title: "SRM Timetable | Smart Daily Class Schedule",
  description: "Access your SRM University personal timetable instantly. View room numbers, faculty details, and slot timings on the go.",
};

export default function TimetableSEO() {
  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '80px 24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
        <h1 style={{ fontSize: '48px', marginTop: '24px', marginBottom: '16px' }}>SRM Timetable Portal</h1>
        <p style={{ fontSize: '18px', color: '#aaa', lineHeight: '1.6' }}>
          Never miss a class again. SRM Nexus provides a beautifully redesigned timetable view that shows you exactly where you need to be.
        </p>

        <section style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Key Timetable Features</h2>
          <ul style={{ lineHeight: '2', color: '#ccc' }}>
            <li><strong>Room Navigation:</strong> Quickly find your block and room number.</li>
            <li><strong>Faculty Insights:</strong> See which professor is taking your next session.</li>
            <li><strong>Offline Mode:</strong> Access your schedule even when the campus Wi-Fi is down.</li>
          </ul>
        </section>

        <div style={{ marginTop: '64px', padding: '40px', background: '#111', borderRadius: '24px', textAlign: 'center' }}>
          <h3>View your schedule today</h3>
          <Link href="/#login" style={{ display: 'inline-block', marginTop: '20px', padding: '16px 32px', background: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
            Enter Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

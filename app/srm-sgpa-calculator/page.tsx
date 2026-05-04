import React from "react";
import Link from "next/link";

export const metadata = {
  title: "SRM SGPA Calculator | CGPA & Credit Engine",
  description: "The most accurate SGPA calculator for SRM University. Pre-loaded with latest credit systems and grading scales.",
};

export default function SGPACalculatorSEO() {
  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '80px 24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
        <h1 style={{ fontSize: '48px', marginTop: '24px', marginBottom: '16px' }}>SRM SGPA Calculator</h1>
        <p style={{ fontSize: '18px', color: '#aaa', lineHeight: '1.6' }}>
          Calculate your semester results with precision. Our engine is specifically tuned for SRM IST's unique credit and grading system.
        </p>

        <section style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Why use our SGPA Calculator?</h2>
          <ul style={{ lineHeight: '2', color: '#ccc' }}>
            <li><strong>Automated Data:</strong> No need to remember your credits. We fetch them from your marks record.</li>
            <li><strong>What-If Analysis:</strong> Simulate potential grades to see your target CGPA.</li>
            <li><strong>Grade Prediction:</strong> Integrated with internal marks to predict your final SGPA.</li>
          </ul>
        </section>

        <div style={{ marginTop: '64px', padding: '40px', background: '#111', borderRadius: '24px', textAlign: 'center' }}>
          <h3>Ready to calculate your SGPA?</h3>
          <Link href="/#login" style={{ display: 'inline-block', marginTop: '20px', padding: '16px 32px', background: '#fff', color: '#000', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
            Open SGPA Engine
          </Link>
        </div>
      </div>
    </div>
  );
}

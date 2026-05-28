import React from "react";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SRM Nexus",
    "alternateName": ["Nexus Academia", "SRM Academia Portal", "srmnexus", "SRMX", "Lumina OS"],
    "url": "https://srmnexus.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All (Windows, macOS, iOS, Android, Linux)",
    "browserRequirements": "Requires HTML5 compatible browsers (Chrome, Safari, Firefox, Edge)",
    "description": "SRM Nexus is the definitive student portal for SRM University. Track attendance, internal marks, timetable schedules, and SGPA with high-precision visual metrics and PWA offline access.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "featureList": [
      "Real-time Attendance Tracking (99.8% scraper bypass rate)",
      "Internal Marks Visual Registry",
      "Interactive 'What-If' SGPA & CGPA Simulator",
      "Dynamic PWA Offline Hub Caching",
      "Personalized Academic Timetable Schedules",
      "Local CryptoJS Browser Vault Encryption"
    ],
    "author": {
      "@type": "Organization",
      "name": "SRM Nexus Team",
      "url": "https://srmnexus.app"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://srmnexus.app",
    "name": "SRM Nexus",
    "alternateName": ["SRMNexus", "Nexus Academia", "SRM Academia Portal"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://srmnexus.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Conversational FAQ Schema for AEO (Voice Answers) and GEO (AI Search Engines)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is SRM Nexus student portal safe to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, SRM Nexus is 100% safe. It implements local-first security using CryptoJS encryption. All passwords, NetIDs, and academic records are stored locally inside your browser's secure IndexedDB vault without uploading credentials to external servers."
        }
      },
      {
        "@type": "Question",
        "name": "What features are included in SRM Nexus?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SRM Nexus includes live attendance margin tracking, visual internal marks trackers, a personalized timetable scheduler, and an interactive 'What-If' SGPA and CGPA forecasting calculator to predict academic outcomes."
        }
      },
      {
        "@type": "Question",
        "name": "How does the SRM Nexus Academia scraper work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SRM Nexus establishes a secure, localized connection to the official SRM Academia database. It retrieves your academic stats in real-time, completely bypassing server lags, and displays them inside an intelligent, dark-mode dashboard."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use SRM Nexus offline?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. SRM Nexus is structured as a Progressive Web App (PWA). Once linked, it securely caches your attendance, marks, and schedules offline, allowing you to access all features even without an active internet connection."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

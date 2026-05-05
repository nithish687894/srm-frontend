import React from "react";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SRM Nexus",
    "alternateName": ["Nexus Academia", "SRM Academia Portal", "srmnexus", "SRMX"],
    "url": "https://srmnexus.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "SRM Nexus is the ultimate SRM Academia student portal. Track attendance, internal marks, timetable, and SGPA with precision using the definitive Nexus Academia interface.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "featureList": [
      "Attendance Tracking",
      "Internal Marks Analysis",
      "SGPA & CGPA Calculator",
      "AI Academic Assistant",
      "Nexus Academia Integration",
      "Personalized Timetable"
    ],
    "author": {
      "@type": "Organization",
      "name": "SRM Nexus Team"
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
    </>
  );
}

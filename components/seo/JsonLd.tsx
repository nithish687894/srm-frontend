import React from "react";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SRM Nexus",
    "alternateName": "srmnexus",
    "url": "https://srmnexus.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "The most advanced student portal for SRM University. Track attendance, marks, and SGPA with precision.",
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

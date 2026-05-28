import React from "react";

interface AuraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function AuraCard({ children, style = {}, className = "", ...props }: AuraCardProps) {
  return (
    <div 
      className={`aura-card ${className}`} 
      style={{ 
        position: 'relative',
        ...style 
      }} 
      {...props}
    >
      {children}
    </div>
  );
}

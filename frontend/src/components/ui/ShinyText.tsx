"use client";

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  disabled = false, 
  speed = 5, 
  className = '',
  intensity = 'medium'
}) => {
  const animationDuration = `${speed}s`;
  
  // Different gradient intensities
  const gradients = {
    low: 'linear-gradient(120deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%)',
    medium: 'linear-gradient(110deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.4) 100%)',
    high: 'linear-gradient(100deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 1) 35%, #ffffff 50%, rgba(255, 255, 255, 1) 65%, rgba(255, 255, 255, 0.2) 100%)'
  };

  return (
    <span
      className={`inline-block ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage: gradients[intensity],
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        animationDuration: animationDuration
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;

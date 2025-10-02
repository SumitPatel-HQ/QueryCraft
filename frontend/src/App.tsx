import React from 'react';
import QueryInterface from './QueryInterface';
import PixelBlast from './PixelBlast';
import LightRays from './LightRays';
import './App.css';

function App() {
  return (
    <div className="App">
      <PixelBlast
        variant="circle"
        pixelSize={8}
        color="#1a1a2e"
        patternScale={4}
        patternDensity={0.8}
        pixelSizeJitter={0.3}
        enableRipples
        rippleSpeed={0.3}
        rippleThickness={0.15}
        rippleIntensityScale={2.0}
        liquid
        liquidStrength={0.15}
        liquidRadius={1.5}
        liquidWobbleSpeed={3}
        speed={0.4}
        edgeFade={0.1}
        transparent
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#60a5fa"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <QueryInterface />
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';
import './ERDView.css';

const API_BASE = 'http://localhost:8000';

const ERDView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [erdData, setErdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#fff',
        primaryBorderColor: '#764ba2',
        lineColor: '#667eea',
        secondaryColor: '#764ba2',
        tertiaryColor: '#1a1d2e'
      }
    });
    fetchERD();
  }, [id]);

  const fetchERD = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/schema/erd`);
      const data = await response.json();
      setErdData(data);
      
      if (data.mermaid_diagram && mermaidRef.current) {
        mermaidRef.current.innerHTML = data.mermaid_diagram;
        await mermaid.run({
          querySelector: '.mermaid'
        });
      }
    } catch (err) {
      console.error('Failed to fetch ERD:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="erd-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ERD diagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="erd-view">
      <div className="erd-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1>Entity Relationship Diagram</h1>
      </div>

      <div className="erd-container">
        <div className="mermaid" ref={mermaidRef}></div>
      </div>

      {erdData?.relationships && erdData.relationships.length > 0 && (
        <div className="relationships-info">
          <h3>Relationships ({erdData.relationships.length})</h3>
          <div className="relationships-list">
            {erdData.relationships.map((rel: any, idx: number) => (
              <div key={idx} className="relationship-item">
                <span className="table-name">{rel.from}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="table-name">{rel.to}</span>
                <span className="relationship-type">{rel.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ERDView;

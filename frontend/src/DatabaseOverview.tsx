import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QueryInterface from './QueryInterface';
import './DatabaseOverview.css';

const API_BASE = 'http://localhost:8000';

interface Database {
  id: number;
  name: string;
  display_name: string;
  description: string;
  db_type: string;
  table_count: number;
  row_count: number;
  size_mb: number;
  created_at: string;
  last_accessed: string;
}

const DatabaseOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabase = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/databases/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDatabase(data);
      } else {
        setError('Database not found');
      }
    } catch (err) {
      setError('Failed to load database');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDatabase();
  }, [fetchDatabase]);

  if (loading) {
    return (
      <div className="database-overview">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading database...</p>
        </div>
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="database-overview">
        <div className="error-state">
          <h2>❌ {error || 'Database not found'}</h2>
          <button onClick={() => navigate('/')}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="database-overview">
      {/* Database Header */}
      <div className="database-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <div className="database-info">
          <div className="db-icon-large">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          
          <div className="db-details">
            <h1>{database.display_name}</h1>
            {database.description && <p className="db-description">{database.description}</p>}
            
            <div className="db-stats">
              <span className="stat-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                {database.table_count} tables
              </span>
              
              <span className="stat-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
                {database.row_count.toLocaleString()} rows
              </span>
              
              <span className="stat-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" 
                  />
                </svg>
                {database.db_type.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Query Interface */}
      <div className="query-section">
        <QueryInterface databaseId={parseInt(id!)} />
      </div>
    </div>
  );
};

export default DatabaseOverview;

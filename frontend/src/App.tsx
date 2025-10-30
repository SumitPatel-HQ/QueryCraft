import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import DatabaseOverview from './DatabaseOverview';
import SchemaView from './SchemaView';
import ERDView from './ERDView';
import QueryInterface from './QueryInterface';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chatbot" element={<QueryInterface />} />
            <Route path="/database/:id" element={<DatabaseOverview />} />
            <Route path="/database/:id/schema" element={<SchemaView />} />
            <Route path="/database/:id/erd" element={<ERDView />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

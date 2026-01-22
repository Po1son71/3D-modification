import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import DataCenterPage from "./pages/DataCenterPage";
import WarehousePage from "./pages/WarehousePage";

function Navigation() {
  const location = useLocation();
  
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      backgroundColor: '#1976d2',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '0 20px',
      zIndex: 10000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Link
        to="/"
        style={{
          color: location.pathname === '/' ? '#ffffff' : '#e3f2fd',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: location.pathname === '/' ? 600 : 400,
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        Data Center
      </Link>
      <Link
        to="/warehouse"
        style={{
          color: location.pathname === '/warehouse' ? '#ffffff' : '#e3f2fd',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: location.pathname === '/warehouse' ? 600 : 400,
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: location.pathname === '/warehouse' ? 'rgba(255,255,255,0.2)' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        Warehouse Management
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<DataCenterPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

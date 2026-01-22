import React from "react";
import Scene from "../components/Scene";
import Sidebar from "../components/UI/Sidebar";
import TopBar from "../components/UI/TopBar";
import PropertiesPanel from "../components/UI/PropertiesPanel";

function DataCenterPage() {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      margin: 0,
      padding: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Sidebar />
      <TopBar />
      <PropertiesPanel />

      <div style={{
        position: 'absolute',
        left: '280px',
        right: '320px',
        top: '60px',
        bottom: 0
      }}>
        <Scene />
      </div>
    </div>
  );
}

export default DataCenterPage;


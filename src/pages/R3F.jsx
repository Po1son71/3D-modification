import React, { useState } from 'react'
import { TwoD } from './TwoD'
import ThreeD from './ThreeD';
import TopHeader from '@/components/UI/Topheader';

export default function R3F() {
    const [viewMode, setViewMode] = useState("2D");
    const [newComp, setNewComp] = useState({});

    const toggleViewMode = (mode) => {
        setViewMode(mode);
    }

    const addNewComponents = (data) => {
        setNewComp(data);
    }
    return (
        <div style={{
            width: "100vw",
            height: "92vh",
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: "8vh",
            overflow: 'hidden',
            backgroundColor: '#f5f5f5'
        }}>
            <TopHeader toggle={toggleViewMode} view={viewMode} add={addNewComponents}/>
            {/* {viewMode == "2D" ? */}
                <TwoD  mode={viewMode} data={newComp}/> 
                {/* :
                <ThreeD />
            } */}
        </div>
    )
}

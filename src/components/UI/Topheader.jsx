import React from 'react'

export default function TopHeader({ toggle, view }) {
    return (
        <>
            <div style={{ width: 'max-content' }}>
                {view === "2D" ?
                    < button onClick={() => toggle('3D')}>
                        SWITCH TO 3D
                    </button> :
                    <button onClick={() => toggle('2D')}>
                        SWITCH TO 2D
                    </button>
                }
            </div >
        </>
    )
}

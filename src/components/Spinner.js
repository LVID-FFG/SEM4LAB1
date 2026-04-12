import React from 'react';

const Spinner = () => {
    return (
        <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '3px solid #ccc',
            borderTop: '3px solid #333',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '10px'
        }}>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default Spinner;
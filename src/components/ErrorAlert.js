import React from 'react';

const ErrorAlert = ({ message, onClose }) => {
    if (!message) return null;
    
    return (
        <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '20px',
            position: 'relative'
        }}>
            <span>{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#721c24'
                    }}
                >
                    
                </button>
            )}
        </div>
    );
};

export default ErrorAlert;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Если уже авторизован, сразу перенаправляем
    useEffect(() => {
        if (auth.isAuthenticated()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Имитация небольшой задержки для реализма
        setTimeout(() => {
            const result = auth.login(username, password);
            if (result.success) {
                navigate('/', { replace: true });
            } else {
                setError(result.error);
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Вход в систему СКУД</h2>
            
            {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        Логин:
                        <br />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            autoComplete="off"
                        />
                    </label>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        Пароль:
                        <br />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </label>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ width: '100%', padding: '10px' }}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </div>
    );
};

export default Login;
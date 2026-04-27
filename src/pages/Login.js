// Login.js - Страница входа в систему
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../api';
import Spinner from '../components/Spinner';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Получаем сообщение об ошибке из состояния (если был редирект с 403)
    useEffect(() => {
        if (location.state?.error) {
            console.log('[Login] Получена ошибка из редиректа:', location.state.error);
            setError(location.state.error);
            // Очищаем state, чтобы ошибка не показывалась при обновлении
            window.history.replaceState({}, document.title);
        }
        
        if (auth.isAuthenticated()) {
            console.log('[Login] Пользователь уже авторизован, перенаправление на главную');
            navigate('/', { replace: true });
        }
    }, [location, navigate]);

    // Обработчик отправки формы входа
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        console.log(`[Login] Попытка входа для пользователя: ${username}`);
        
        const result = await auth.login(username, password);
        
        if (result.success) {
            console.log(`[Login] Вход выполнен успешно (${result.status})`);
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } else {
            console.log(`[Login] Ошибка входа (${result.status}):`, result.error);
            setError(result.error);
        }
        
        setIsLoading(false);
    };

    console.log('[Login] Отображение страницы входа');

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Вход в систему СКУД</h2>
            
            {error && (
                <div style={{ 
                    backgroundColor: error.includes('403') ? '#fff3cd' : '#f8d7da', 
                    color: error.includes('403') ? '#856404' : '#721c24', 
                    padding: '10px', 
                    borderRadius: '4px', 
                    marginBottom: '15px' 
                }}>
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                        />
                    </label>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ width: '100%', padding: '10px' }}
                >
                    {isLoading ? <><Spinner /> Вход...</> : 'Войти'}
                </button>
            </form>
        </div>
    );
};

export default Login;
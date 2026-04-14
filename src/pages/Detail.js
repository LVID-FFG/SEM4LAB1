// Detail.js - Страница редактирования турникета
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { turnstileApi } from '../api';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const Detail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState("open");
    const [isSubmitting, setIsSubmitting] = useState(false); //идёт ли сейчас отправка формы
    const { updateTurnstile } = useData();

    // Загрузка данных турникета при монтировании
    useEffect(() => {
        console.log(`[Detail] Загрузка турникета ${id}`);
        loadTurnstile();
    }, [id]);

    async function loadTurnstile() {
        setLoading(true);
        const result = await turnstileApi.getOne(id);
        if (result.error) {
            console.error(`[Detail] Ошибка загрузки турникета ${id}:`, result.error);
            setError(result.error);
        } else {
            console.log(`[Detail] Турникет ${id} загружен:`, result.data);
            const turnstile = result.data;
            setName(turnstile.name || '');
            setLocation(turnstile.location || '');
            setStatus(turnstile.status || 'open');
        }
        setLoading(false);
    }

    // Обработчик сохранения изменений
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !location) {
            setError("Название и расположение обязательны для заполнения");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const updatedTurnstile = { name, location, status };
        console.log(`[Detail] Обновление турникета ${id}:`, updatedTurnstile);

        try {
            await updateTurnstile(id, updatedTurnstile);
            console.log(`[Detail] Турникет ${id} успешно обновлён`);
            navigate('/');
        } catch (error) {
            console.error(`[Detail] Ошибка обновления турникета ${id}:`, error);
            setError(error.message || "Ошибка при обновлении турникета");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Отображение загрузки
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spinner />
                <span>Загрузка данных турникета...</span>
            </div>
        );
    }

    // Отображение ошибки
    if (error) {
        return (
            <div>
                <div style={{ 
                    backgroundColor: "#f8d7da", 
                    color: "#721c24", 
                    padding: "15px", 
                    borderRadius: "4px" 
                }}>
                    {error}
                </div>
                <button onClick={() => navigate('/')} style={{ marginTop: "20px" }}>
                    Вернуться к списку
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1>Редактирование турникета</h1>
            {error && (
                <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                    {error}
                </p>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Название турникета:
                        <br />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                            style={{ width: "300px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Расположение:
                        <br />
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required 
                            style={{ width: "300px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Статус:
                        <br />
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value="open">Открыт</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </label>
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner /> Сохранение...</> : "Сохранить изменения"}
                </button>
                <button 
                    type="button" 
                    onClick={() => navigate('/')} 
                    style={{ marginLeft: "10px" }}
                    disabled={isSubmitting}
                >
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default Detail;
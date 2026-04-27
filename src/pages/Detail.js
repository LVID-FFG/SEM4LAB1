// Detail.js - Страница редактирования турникета
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { turnstileApi } from '../api';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const getTypeName = (type) => {
    const types = {
        'turnstile': 'Турникет',
        'gate': 'Ворота',
        'barrier': 'Шлагбаум'
    };
    return types[type] || type;
};

const Detail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState("turnstile");
    const [status, setStatus] = useState("open");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { updateTurnstile, isAdmin } = useData();

    useEffect(() => {
        if (!isAdmin) return;
        console.log(`[Detail] Загрузка точки доступа ${id}`);
        loadTurnstile();
    }, [id, isAdmin]);

    async function loadTurnstile() {
        setLoading(true);
        const result = await turnstileApi.getOne(id);
        if (result.error) {
            console.error(`[Detail] Ошибка загрузки ${id}:`, result.error);
            setError(result.error);
        } else {
            console.log(`[Detail] Данные загружены:`, result.data);
            const turnstile = result.data;
            setName(turnstile.name || '');
            setLocation(turnstile.location || '');
            setType(turnstile.type || 'turnstile');
            setStatus(turnstile.status || 'open');
            setLat(turnstile.lat || '');
            setLng(turnstile.lng || '');
        }
        setLoading(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !location) {
            setError("Название и расположение обязательны для заполнения");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const updatedTurnstile = {
            name,
            location,
            type,
            status,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null
        };
        
        Object.keys(updatedTurnstile).forEach(key => {
            if (updatedTurnstile[key] === null) {
                delete updatedTurnstile[key];
            }
        });

        console.log(`[Detail] Обновление ${id}:`, updatedTurnstile);

        try {
            await updateTurnstile(id, updatedTurnstile);
            console.log(`[Detail] Обновлено успешно`);
            navigate('/');
        } catch (error) {
            console.error(`[Detail] Ошибка обновления:`, error);
            setError(error.message || "Ошибка при обновлении");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Переносим проверку роли после всех хуков
    if (!isAdmin) {
        console.log('[Detail] Доступ запрещён: пользователь не администратор');
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spinner />
                <span>Загрузка данных...</span>
            </div>
        );
    }

    if (error && !name) {
        return (
            <div>
                <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "15px", borderRadius: "4px" }}>
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
            <h1>Редактирование точки доступа</h1>
            {error && (
                <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                    {error}
                </p>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Название:
                        <br />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Тип точки доступа:
                        <br />
                        <select value={type} onChange={(e) => setType(e.target.value)} disabled={isSubmitting}>
                            <option value="turnstile">Турникет</option>
                            <option value="gate">Ворота/калитка</option>
                            <option value="barrier">Шлагбаум</option>
                        </select>
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Расположение:
                        <br />
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Статус:
                        <br />
                        <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}>
                            <option value="open">Открыт</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Широта:
                        <br />
                        <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="55.751244" style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Долгота:
                        <br />
                        <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="37.618423" style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner /> Сохранение...</> : "Сохранить изменения"}
                </button>
                <button type="button" onClick={() => navigate('/')} style={{ marginLeft: "10px" }} disabled={isSubmitting}>
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default Detail;
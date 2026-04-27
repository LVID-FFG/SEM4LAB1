// Form.js - Страница добавления новой точки доступа 
import React, { useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const Form = () => {
    const nameRef = useRef(null);
    const locationRef = useRef(null);
    const typeRef = useRef(null);
    const statusRef = useRef(null);
    const latRef = useRef(null);
    const lngRef = useRef(null);
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addTurnstile, isAdmin } = useData();

    // Проверка роли
    if (!isAdmin) {
        console.log('[Form] Доступ запрещён: пользователь не администратор');
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const name = nameRef.current.value.trim();
        const location = locationRef.current.value.trim();
        const type = typeRef.current.value;
        const status = statusRef.current.value;
        const lat = latRef.current.value ? parseFloat(latRef.current.value) : null;
        const lng = lngRef.current.value ? parseFloat(lngRef.current.value) : null;

        if (!name || !location) {
            setError("Название и расположение обязательны для заполнения");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const newTurnstile = { name, location, type, status };
        if (lat && lng) {
            newTurnstile.lat = lat;
            newTurnstile.lng = lng;
        }

        console.log('[Form] Отправка новой точки доступа:', newTurnstile);

        try {
            await addTurnstile(newTurnstile);
            console.log('[Form] Точка доступа успешно добавлена');
            navigate('/');
        } catch (error) {
            console.error('[Form] Ошибка добавления:', error);
            setError(error.message || "Ошибка при добавлении");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1>Добавление точки доступа</h1>
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
                        <input type="text" ref={nameRef} required style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Тип точки доступа:
                        <br />
                        <select ref={typeRef} defaultValue="turnstile" disabled={isSubmitting}>
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
                        <input type="text" ref={locationRef} required style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Статус:
                        <br />
                        <select ref={statusRef} defaultValue="open" disabled={isSubmitting}>
                            <option value="open">Открыт</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Координаты (широта):
                        <br />
                        <input type="number" step="any" ref={latRef} placeholder="55.751244" style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Координаты (долгота):
                        <br />
                        <input type="number" step="any" ref={lngRef} placeholder="37.618423" style={{ width: "300px" }} disabled={isSubmitting} />
                    </label>
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner /> Добавление...</> : "Добавить"}
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
            <p style={{ marginTop: "10px", color: "#666" }}>
                Координаты можно скопировать из Яндекс.Карт или Google Maps
            </p>
        </div>
    );
};

export default Form;
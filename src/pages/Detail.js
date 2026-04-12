import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useData } from '../App';

const Detail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState("open");
    const { updateTurnstile } = useData();

    useEffect(() => {
        loadTurnstile();
    }, [id]);

    async function loadTurnstile() {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/turnstiles/${id}`);
            const turnstile = response.data;
            setName(turnstile.name || '');
            setLocation(turnstile.location || '');
            setStatus(turnstile.status || 'open');
            setLoading(false);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            setError("Турникет не найден");
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !location) {
            setError("Название и расположение обязательны для заполнения");
            return;
        }
        setError("");

        const updatedTurnstile = { name, location, status };

        try {
            await updateTurnstile(id, updatedTurnstile);
            navigate('/');
        } catch (error) {
            console.error("Ошибка обновления:", error);
            setError("Ошибка при обновлении турникета");
        }
    };

    if (loading) {
        return <div>Загрузка данных турникета...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
    }

    return (
        <div>
            <h1>Редактирование турникета</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
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
                        >
                            <option value="open">Открыт</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </label>
                </div>
                <button type="submit">Сохранить изменения</button>
            </form>
        </div>
    );
};

export default Detail;
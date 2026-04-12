import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const Form = () => {
    const nameRef = useRef(null);
    const locationRef = useRef(null);
    const statusRef = useRef(null);
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addTurnstile } = useData();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const name = nameRef.current.value.trim();
        const location = locationRef.current.value.trim();
        const status = statusRef.current.value;

        if (!name || !location) {
            setError("Название и расположение обязательны для заполнения");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const newTurnstile = { name, location, status };

        try {
            await addTurnstile(newTurnstile);
            navigate('/');
        } catch (error) {
            console.error("Ошибка создания:", error);
            setError(error.message || "Ошибка при добавлении турникета");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1>Добавление турникета</h1>
            {error && <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Название турникета:
                        <br />
                        <input type="text" ref={nameRef} required style={{ width: "300px" }} disabled={isSubmitting} />
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
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner /> Добавление...</> : "Добавить турникет"}
                </button>
            </form>
        </div>
    );
};

export default Form;
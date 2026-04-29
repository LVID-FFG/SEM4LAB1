// Home.js - Главная страница со списком точек доступа
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";

const getTypeName = (type) => {
    const types = {
        'turnstile': 'Турникет',
        'gate': 'Ворота',
        'barrier': 'Шлагбаум'
    };
    return types[type] || type || '—';
};

const getStatusText = (status) => {
    return status === "open" ? "Открыт" : "Заблокирован";
};

const Home = () => {
    const { turnstiles, updateTurnstile, deleteTurnstile, isAdmin } = useData();
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [error, setError] = useState("");

    async function handleToggleStatus(turnstile) {
        const newStatus = turnstile.status === "open" ? "blocked" : "open";
        console.log(`[Home] Переключение статуса ${turnstile.id} на ${newStatus}`);
        setTogglingId(turnstile.id);
        setError("");
        try {
            await updateTurnstile(turnstile.id, { ...turnstile, status: newStatus });
            console.log(`[Home] Статус ${turnstile.id} изменён`);
        } catch (error) {
            console.error("[Home] Ошибка переключения:", error);
            setError(error.message || "Ошибка при изменении статуса");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDelete(id) {
        if (window.confirm("Удалить эту точку доступа?")) {
            console.log(`[Home] Удаление ${id}`);
            setDeletingId(id);
            setError("");
            try {
                await deleteTurnstile(id);
                console.log(`[Home] ${id} успешно удалён`);
            } catch (error) {
                console.error("[Home] Ошибка удаления:", error);
                setError(error.message || "Ошибка при удалении");
            } finally {
                setDeletingId(null);
            }
        }
    }

    console.log(`[Home] Отображение ${turnstiles.length} точек доступа`);

    return (
        <div>
            <h1>Точки доступа</h1>
            {error && (
                <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                    {error}
                </p>
            )}
            {turnstiles.length === 0 ? (
                <p>Нет точек доступа. {isAdmin && <Link to="/add">Добавить</Link>}</p>
            ) : (
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Расположение</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {turnstiles.map(item => (
                            <tr key={item.id}>
                                <td>
                                    {isAdmin ? (
                                        <Link to={`/detail/${item.id}`}>{item.name}</Link>
                                    ) : (
                                        item.name
                                    )}
                                </td>
                                <td>{getTypeName(item.type)}</td>
                                <td>{item.location}</td>
                                <td style={{ color: item.status === "open" ? "green" : "red" }}>
                                    {getStatusText(item.status)}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <button 
                                        onClick={() => handleToggleStatus(item)}
                                        disabled={togglingId === item.id}
                                        style={{ 
                                            marginRight: "5px",
                                            backgroundColor: item.status === "open" ? "#dc3545" : "#28a745",
                                            color: "white",
                                            border: "none",
                                            padding: "4px 8px",
                                            borderRadius: "3px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {togglingId === item.id ? "..." : (item.status === "open" ? "Заблокировать" : "Открыть")}
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            disabled={deletingId === item.id}
                                        >
                                            {deletingId === item.id ? "Удаление..." : "Удалить"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Home;
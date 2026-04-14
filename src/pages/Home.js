// Home.js - Главная страница со списком турникетов
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";

const Home = () => {
    const { turnstiles, deleteTurnstile } = useData();
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    // Получение текстового представления статуса
    function getStatusText(status) {
        return status === "open" ? "Открыт" : "Заблокирован";
    }

    // Обработчик удаления турникета
    async function handleDelete(id) {
        if (window.confirm("Удалить этот турникет?")) {
            console.log(`[Home] Удаление турникета ${id}`);
            setDeletingId(id);
            setError("");
            try {
                await deleteTurnstile(id);
                console.log(`[Home] Турникет ${id} успешно удалён`);
            } catch (error) {
                console.error("[Home] Ошибка удаления:", error);
                setError(error.message || "Ошибка при удалении турникета");
            } finally {
                setDeletingId(null);
            }
        }
    }

    console.log(`[Home] Отображение ${turnstiles.length} турникетов`);

    return (
        <div>
            <h1>Управление турникетами</h1>
            {error && (
                <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                    {error}
                </p>
            )}
            {turnstiles.length === 0 ? (
                <p>Нет турникетов. <Link to="/add">Добавить турникет</Link></p>
            ) : (
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Расположение</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {turnstiles.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <Link to={`/detail/${item.id}`}>{item.name}</Link>
                                </td>
                                <td>{item.location}</td>
                                <td style={{ color: item.status === "open" ? "green" : "red" }}>
                                    {getStatusText(item.status)}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleDelete(item.id)} 
                                        disabled={deletingId === item.id}
                                    >
                                        {deletingId === item.id ? "Удаление..." : "Удалить"}
                                    </button>
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
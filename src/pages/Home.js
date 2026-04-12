import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";

const Home = () => {
    const { turnstiles, deleteTurnstile } = useData();
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    function getStatusText(status) {
        return status === "open" ? "Открыт" : "Заблокирован";
    }

    async function handleDelete(id) {
        if (window.confirm("Удалить этот турникет?")) {
            setDeletingId(id);
            setError("");
            try {
                await deleteTurnstile(id);
                console.log(`Турникет ${id} удалён`);
            } catch (error) {
                console.error("Ошибка удаления", error);
                setError(error.message || "Ошибка при удалении турникета");
            } finally {
                setDeletingId(null);
            }
        }
    }

    return (
        <div>
            <h1>Управление турникетами</h1>
            {error && <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>{error}</p>}
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
                            <td>{getStatusText(item.status)}</td>
                            <td>
                                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>
                                    {deletingId === item.id ? "Удаление..." : "Удалить"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Home;
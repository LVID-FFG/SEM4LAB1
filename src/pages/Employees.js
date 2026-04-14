// Employees.js - Страница управления сотрудниками
import React, { useRef, useState } from 'react';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const Employees = () => {
    const { employees, addEmployee, deleteEmployee } = useData();
    const lastNameRef = useRef(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Обработчик добавления сотрудника
    async function handleAddEmployee(e) {
        e.preventDefault();
        const lastName = lastNameRef.current.value.trim();
        
        if (!lastName) {
            setError("Введите фамилию");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const newEmployee = { lastName };
        console.log('[Employees] Добавление сотрудника:', newEmployee);

        try {
            await addEmployee(newEmployee);
            console.log('[Employees] Сотрудник успешно добавлен');
            lastNameRef.current.value = "";
        } catch (error) {
            console.error('[Employees] Ошибка добавления сотрудника:', error);
            setError(error.message || "Ошибка при добавлении сотрудника");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Обработчик удаления сотрудника
    async function handleDeleteEmployee(id, lastName) {
        if (window.confirm(`Удалить сотрудника ${lastName}?`)) {
            console.log(`[Employees] Удаление сотрудника ${id} (${lastName})`);
            setDeletingId(id);
            try {
                await deleteEmployee(id);
                console.log(`[Employees] Сотрудник ${id} успешно удалён`);
            } catch (error) {
                console.error('[Employees] Ошибка удаления сотрудника:', error);
                setError(error.message || "Ошибка при удалении сотрудника");
            } finally {
                setDeletingId(null);
            }
        }
    }

    console.log(`[Employees] Отображение ${employees.length} сотрудников`);

    return (
        <div>
            <h1>Сотрудники</h1>
            
            <div style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "15px", borderRadius: "5px" }}>
                <h3>Добавить сотрудника</h3>
                {error && (
                    <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                        {error}
                    </p>
                )}
                <form onSubmit={handleAddEmployee}>
                    <label>
                        Фамилия:
                        <input 
                            type="text" 
                            ref={lastNameRef} 
                            style={{ marginLeft: "10px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                    <button type="submit" style={{ marginLeft: "10px" }} disabled={isSubmitting}>
                        {isSubmitting ? <><Spinner /> Добавление...</> : "Добавить"}
                    </button>
                </form>
            </div>

            <h3>Список сотрудников</h3>
            {employees.length === 0 ? (
                <p>Нет сотрудников. Добавьте первого сотрудника.</p>
            ) : (
                <ul>
                    {employees.map(emp => (
                        <li key={emp.id} style={{ marginBottom: "5px" }}>
                            {emp.lastName}
                            <button 
                                onClick={() => handleDeleteEmployee(emp.id, emp.lastName)} 
                                style={{ marginLeft: "10px" }}
                                disabled={deletingId === emp.id}
                            >
                                {deletingId === emp.id ? "Удаление..." : "Удалить"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Employees;
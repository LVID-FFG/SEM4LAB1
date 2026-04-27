import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const getStatusText = (status) => {
    return status === 'active' ? 'Активен' : 'Заблокирован';
};

const Employees = () => {
    const { employees, addEmployee, deleteEmployee, isAdmin } = useData();
    const navigate = useNavigate();
    const lastNameRef = useRef(null);
    const firstNameRef = useRef(null);
    const middleNameRef = useRef(null);
    const positionRef = useRef(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    async function handleAddEmployee(e) {
        e.preventDefault();
        const lastName = lastNameRef.current.value.trim();
        const firstName = firstNameRef.current.value.trim();
        const middleName = middleNameRef.current.value.trim();
        const position = positionRef.current.value.trim();
        
        if (!lastName || !firstName) {
            setError("Фамилия и имя обязательны");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const newEmployee = {
            lastName,
            firstName,
            middleName,
            position,
            status: 'active'
        };

        console.log('[Employees] Добавление сотрудника:', newEmployee);

        try {
            await addEmployee(newEmployee);
            console.log('[Employees] Сотрудник успешно добавлен');
            lastNameRef.current.value = "";
            firstNameRef.current.value = "";
            middleNameRef.current.value = "";
            positionRef.current.value = "";
        } catch (error) {
            console.error('[Employees] Ошибка добавления:', error);
            setError(error.message || "Ошибка при добавлении сотрудника");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteEmployee(id, fullName) {
        if (window.confirm(`Удалить сотрудника ${fullName}?`)) {
            console.log(`[Employees] Удаление сотрудника ${id}`);
            setDeletingId(id);
            try {
                await deleteEmployee(id);
                console.log(`[Employees] Сотрудник ${id} удалён`);
            } catch (error) {
                console.error('[Employees] Ошибка удаления:', error);
                setError(error.message || "Ошибка при удалении");
            } finally {
                setDeletingId(null);
            }
        }
    }

    const getFullName = (emp) => {
        return `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim();
    };

    console.log(`[Employees] Отображение ${employees.length} сотрудников`);

    return (
        <div>
            <h1>Сотрудники</h1>
            
            {isAdmin && (
                <div style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "15px", borderRadius: "5px" }}>
                    <h3>Добавить сотрудника</h3>
                    {error && (
                        <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                            {error}
                        </p>
                    )}
                    <form onSubmit={handleAddEmployee}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                            <label>
                                Фамилия:<br />
                                <input type="text" ref={lastNameRef} required disabled={isSubmitting} />
                            </label>
                            <label>
                                Имя:<br />
                                <input type="text" ref={firstNameRef} required disabled={isSubmitting} />
                            </label>
                            <label>
                                Отчество:<br />
                                <input type="text" ref={middleNameRef} disabled={isSubmitting} />
                            </label>
                            <label>
                                Должность:<br />
                                <input type="text" ref={positionRef} placeholder="Охранник" disabled={isSubmitting} />
                            </label>
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Spinner /> Добавление...</> : "Добавить"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <h3>Список сотрудников</h3>
            {employees.length === 0 ? (
                <p>Нет сотрудников. {isAdmin && 'Добавьте первого сотрудника.'}</p>
            ) : (
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Должность</th>
                            <th>Статус</th>
                            {isAdmin && <th>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} style={{ 
                                backgroundColor: emp.status === 'blocked' ? '#fff3cd' : 'transparent' 
                            }}>
                                <td>
                                    {isAdmin ? (
                                        <button 
                                            onClick={() => navigate(`/employees/${emp.id}`)}
                                            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', padding: 0, textAlign: 'left' }}
                                        >
                                            {getFullName(emp)}
                                        </button>
                                    ) : (
                                        getFullName(emp)
                                    )}
                                </td>
                                <td>{emp.position || '—'}</td>
                                <td>{getStatusText(emp.status)}</td>
                                {isAdmin && (
                                    <td>
                                        <button 
                                            onClick={() => navigate(`/employees/${emp.id}`)}
                                            style={{ marginRight: "5px" }}
                                        >
                                            Редактировать
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteEmployee(emp.id, getFullName(emp))} 
                                            disabled={deletingId === emp.id}
                                        >
                                            {deletingId === emp.id ? "Удаление..." : "Удалить"}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Employees;
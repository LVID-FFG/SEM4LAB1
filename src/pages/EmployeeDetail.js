// EmployeeDetail.js - Страница редактирования сотрудника
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { employeeApi } from '../api';
import { useData } from '../App';
import Spinner from '../components/Spinner';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [position, setPosition] = useState("");
    const [status, setStatus] = useState("active");
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { updateEmployee, isAdmin } = useData();

    useEffect(() => {
        if (!isAdmin) return;
        console.log(`[EmployeeDetail] Загрузка сотрудника ${id}`);
        loadEmployee();
    }, [id, isAdmin]);

    async function loadEmployee() {
        setLoading(true);
        try {
            const response = await employeeApi.getAll();
            if (response.error) {
                setError(response.error);
            } else {
                const employee = response.data.find(e => e.id === id);
                if (employee) {
                    console.log(`[EmployeeDetail] Сотрудник загружен:`, employee);
                    setLastName(employee.lastName || '');
                    setFirstName(employee.firstName || '');
                    setMiddleName(employee.middleName || '');
                    setPosition(employee.position || '');
                    setStatus(employee.status || 'active');
                } else {
                    setError('Сотрудник не найден (404)');
                }
            }
        } catch (err) {
            setError('Ошибка загрузки данных сотрудника');
        }
        setLoading(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!lastName || !firstName) {
            setError("Фамилия и имя обязательны для заполнения");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const updatedEmployee = {
            lastName,
            firstName,
            middleName,
            position,
            status
        };

        console.log(`[EmployeeDetail] Обновление сотрудника ${id}:`, updatedEmployee);

        try {
            await updateEmployee(id, updatedEmployee);
            console.log(`[EmployeeDetail] Сотрудник ${id} обновлён`);
            navigate('/employees');
        } catch (error) {
            console.error(`[EmployeeDetail] Ошибка обновления:`, error);
            setError(error.message || "Ошибка при обновлении сотрудника");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Проверка роли после всех хуков
    if (!isAdmin) {
        console.log('[EmployeeDetail] Доступ запрещён: пользователь не администратор');
        return <Navigate to="/employees" replace />;
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spinner />
                <span>Загрузка данных сотрудника...</span>
            </div>
        );
    }

    if (error && !lastName) {
        return (
            <div>
                <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "15px", borderRadius: "4px" }}>
                    {error}
                </div>
                <button onClick={() => navigate('/employees')} style={{ marginTop: "20px" }}>
                    Вернуться к списку
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1>Редактирование сотрудника</h1>
            {error && (
                <p style={{ color: "red", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
                    {error}
                </p>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Фамилия:
                        <br />
                        <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required 
                            style={{ width: "300px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Имя:
                        <br />
                        <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required 
                            style={{ width: "300px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Отчество:
                        <br />
                        <input 
                            type="text" 
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            style={{ width: "300px" }} 
                            disabled={isSubmitting}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label>
                        Должность:
                        <br />
                        <input 
                            type="text" 
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
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
                            <option value="active">Активен</option>
                            <option value="blocked">Заблокирован</option>
                        </select>
                    </label>
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner /> Сохранение...</> : "Сохранить изменения"}
                </button>
                <button 
                    type="button" 
                    onClick={() => navigate('/employees')} 
                    style={{ marginLeft: "10px" }}
                    disabled={isSubmitting}
                >
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default EmployeeDetail;
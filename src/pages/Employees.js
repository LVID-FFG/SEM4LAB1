import React, { useRef, useState } from 'react';
import { useData } from '../App';

const Employees = () => {
    const { employees, addEmployee, deleteEmployee } = useData();
    const lastNameRef = useRef(null);
    const [error, setError] = useState("");

    async function handleAddEmployee(e) {
        e.preventDefault();
        const lastName = lastNameRef.current.value.trim();
        
        if (!lastName) {
            setError("Введите фамилию");
            return;
        }
        setError("");

        const newEmployee = { lastName };

        try {
            await addEmployee(newEmployee);
            lastNameRef.current.value = "";
        } catch (error) {
            console.error("Ошибка добавления:", error);
            setError("Ошибка при добавлении сотрудника");
        }
    }

    async function handleDeleteEmployee(id) {
        if (window.confirm("Удалить сотрудника?")) {
            try {
                await deleteEmployee(id);
            } catch (error) {
                console.error("Ошибка удаления:", error);
            }
        }
    }

    return (
        <div>
            <h1>Сотрудники</h1>
            
            <div style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "15px" }}>
                <h3>Добавить сотрудника</h3>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleAddEmployee}>
                    <label>
                        Фамилия:
                        <input type="text" ref={lastNameRef} style={{ marginLeft: "10px" }} />
                    </label>
                    <button type="submit" style={{ marginLeft: "10px" }}>Добавить</button>
                </form>
            </div>

            <h3>Список сотрудников</h3>
            <ul>
                {employees.map(emp => (
                    <li key={emp.id} style={{ marginBottom: "5px" }}>
                        {emp.lastName}
                        <button 
                            onClick={() => handleDeleteEmployee(emp.id)} 
                            style={{ marginLeft: "10px" }}
                        >
                            Удалить
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Employees;
import React, { useState, useRef } from 'react';
import { useData } from '../App';

const Access = () => {
    const { turnstiles, employees } = useData();
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const selectedTurnstileRef = useRef(null);
    const lastNameRef = useRef(null);

    async function attemptAccess(e) {
        e.preventDefault();
        
        const turnstileId = selectedTurnstileRef.current.value;
        const lastName = lastNameRef.current.value.trim();
        
        if (!turnstileId) {
            setMessage("Выберите турникет");
            setMessageType("error");
            return;
        }
        
        if (!lastName) {
            setMessage("Введите фамилию");
            setMessageType("error");
            return;
        }

        const turnstile = turnstiles.find(t => t.id === turnstileId);
        
        if (turnstile.status === "blocked") {
            setMessage(`ТУРНИКЕТ ЗАБЛОКИРОВАН. Проход через "${turnstile.name}" невозможен.`);
            setMessageType("error");
            return;
        }

        const employee = employees.find(emp => emp.lastName.toLowerCase() === lastName.toLowerCase());
        
        if (employee) {
            setMessage(`УСПЕХ. Сотрудник ${employee.lastName} прошёл через "${turnstile.name}".`);
            setMessageType("success");
        } else {
            setMessage(`ОТКАЗ. Сотрудник с фамилией "${lastName}" не найден в базе.`);
            setMessageType("error");
        }
        
        lastNameRef.current.value = "";
        
        setTimeout(() => {
            setMessage("");
        }, 5000);
    }

    return (
        <div>
            <h1>Попытка прохода через турникет</h1>
            
            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "5px" }}>
                <form onSubmit={attemptAccess}>
                    <div style={{ marginBottom: "15px" }}>
                        <label>
                            Выберите турникет:
                            <br />
                            <select ref={selectedTurnstileRef} style={{ width: "300px", marginTop: "5px" }}>
                                <option value="">-- Выберите турникет --</option>
                                {turnstiles.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.location}) - {t.status === "open" ? "Открыт" : "Заблокирован"}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    
                    <div style={{ marginBottom: "15px" }}>
                        <label>
                            Фамилия сотрудника:
                            <br />
                            <input 
                                type="text" 
                                ref={lastNameRef} 
                                placeholder="Введите фамилию" 
                                style={{ width: "300px", marginTop: "5px" }}
                            />
                        </label>
                    </div>
                    
                    <button type="submit">Попытаться пройти</button>
                </form>
                
                {message && (
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "10px", 
                        backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
                        color: messageType === "success" ? "#155724" : "#721c24",
                        border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                        borderRadius: "4px"
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Access;
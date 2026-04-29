// Access.js - Страница имитации прохода через точку доступа
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../App';

const getTypeName = (type) => {
    const types = {
        'turnstile': 'Турникет',
        'gate': 'Ворота',
        'barrier': 'Шлагбаум'
    };
    return types[type] || type || '—';
};

const Access = () => {
    const { turnstiles, employees, addEvent } = useData();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const selectedTurnstileRef = useRef(null);
    
    // Состояния для автокомплита
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Фильтрация сотрудников при вводе текста
    useEffect(() => {
        // Сбрасываем выбранного сотрудника, если текст поиска не совпадает с ним
        if (selectedEmployee) {
            const fullName = `${selectedEmployee.lastName} ${selectedEmployee.firstName} ${selectedEmployee.middleName || ''}`.trim();
            if (searchTerm.trim() !== fullName) {
                setSelectedEmployee(null);
            }
        }
        
        if (searchTerm.trim().length > 0 && !selectedEmployee) {
            const term = searchTerm.toLowerCase();
            const filtered = employees
                .filter(emp => {
                    const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.toLowerCase();
                    return fullName.includes(term);
                })
                .slice(0, 5); // Максимум 5 подсказок
            
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
            setHighlightedIndex(-1);
        } else if (selectedEmployee) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        }
    }, [searchTerm, employees, selectedEmployee]);

    // Закрытие подсказок при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target) &&
                searchInputRef.current && 
                !searchInputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Выбор сотрудника из списка
    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
        setSearchTerm(`${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.trim());
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    };

    // Очистка выбранного сотрудника
    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setSearchTerm("");
        setSuggestions([]);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.focus();
    };

    // Обработка клавиатурной навигации
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelectEmployee(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setHighlightedIndex(-1);
                break;
            default:
                break;
        }
    };

    // Обработчик попытки прохода
    async function attemptAccess(e) {
        e.preventDefault();
        
        const turnstileId = selectedTurnstileRef.current.value;
        const timestamp = new Date().toISOString();
        
        if (!turnstileId) {
            setMessage("Выберите точку доступа");
            setMessageType("error");
            return;
        }
        
        if (!selectedEmployee) {
            setMessage("Выберите сотрудника из списка");
            setMessageType("error");
            return;
        }

        const turnstile = turnstiles.find(t => t.id === turnstileId);
        
        // Ищем сотрудника в актуальном списке (на случай, если его заблокировали)
        const currentEmployee = employees.find(emp => emp.id === selectedEmployee.id);
        
        if (!currentEmployee) {
            const msg = `ОШИБКА. Сотрудник не найден в базе данных.`;
            console.log('[Access]', msg);
            setMessage(msg);
            setMessageType("error");
            return;
        }
        
        console.log('[Access] Попытка прохода:', { 
            turnstile: turnstile.name, 
            turnstileStatus: turnstile.status,
            employee: `${currentEmployee.lastName} ${currentEmployee.firstName}`,
            employeeStatus: currentEmployee.status
        });
        

        // Проверка статуса точки доступа
        if (turnstile.status === "blocked") {
            const msg = `ТОЧКА ДОСТУПА ЗАБЛОКИРОВАНА. Проход через "${turnstile.name}" (${getTypeName(turnstile.type)}) невозможен.`;
            console.log('[Access]', msg);
            setMessage(msg);
            setMessageType("error");
            
            await addEvent({
                eventNumber: Date.now(),
                timestamp,
                turnstileName: turnstile.name,
                turnstileType: turnstile.type,
                employeeName: `${currentEmployee.lastName} ${currentEmployee.firstName} ${currentEmployee.middleName || ''}`.trim(),
                employeePosition: currentEmployee.position || '—',
                result: 'blocked_turnstile',
                description: 'Точка доступа заблокирована'
            });
            return;
        }

        // Проверка статуса сотрудника
        if (currentEmployee.status === 'blocked') {
            const msg = `ОТКАЗ. Сотрудник ${currentEmployee.lastName} ${currentEmployee.firstName} (${currentEmployee.position || 'без должности'}) заблокирован. Доступ запрещён.`;
            console.log('[Access]', msg);
            setMessage(msg);
            setMessageType("error");
            
            await addEvent({
                eventNumber: Date.now(),
                timestamp,
                turnstileName: turnstile.name,
                turnstileType: turnstile.type,
                employeeName: `${currentEmployee.lastName} ${currentEmployee.firstName} ${currentEmployee.middleName || ''}`.trim(),
                employeePosition: currentEmployee.position || '—',
                result: 'blocked_employee',
                description: 'Сотрудник заблокирован'
            });
            return;
        }

        // Успешный проход
        const msg = `УСПЕХ. Сотрудник ${currentEmployee.lastName} ${currentEmployee.firstName} (${currentEmployee.position || 'без должности'}) прошёл через "${turnstile.name}" (${getTypeName(turnstile.type)}).`;       

        console.log('[Access]', msg);
        setMessage(msg);
        setMessageType("success");
        
        // Сохраняем успешное событие
        await addEvent({
            eventNumber: Date.now(),
            timestamp,
            turnstileName: turnstile.name,
            turnstileType: turnstile.type,
            employeeName: `${currentEmployee.lastName} ${currentEmployee.firstName} ${currentEmployee.middleName || ''}`.trim(),
            employeePosition: currentEmployee.position || '—',
            result: 'success',
            description: 'Успешный проход'
        });
        
        // Сброс формы
        setSelectedEmployee(null);
        setSearchTerm("");
        setSuggestions([]);
        setShowSuggestions(false);
        
        setTimeout(() => {
            setMessage("");
        }, 5000);
    }

    // Функция для подсветки совпадающего текста
    const highlightMatch = (text, search) => {
        if (!search.trim()) return text;
        
        const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0' }}>{part}</mark> : part
        );
    };

    console.log(`[Access] Отображение страницы (${employees.length} сотрудников, ${turnstiles.length} точек доступа)`);

    return (
        <div>
            <h1>Попытка прохода через точку доступа</h1>

            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "5px" }}>
                <form onSubmit={attemptAccess}>
                    {/* Выбор точки доступа */}
                    <div style={{ marginBottom: "15px" }}>
                        <label>
                            Выберите точку доступа:
                            <br />
                            <select ref={selectedTurnstileRef} style={{ width: "500px", marginTop: "5px", padding: "8px" }}>
                                <option value="">-- Выберите --</option>
                                {turnstiles.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({getTypeName(t.type)}, {t.location}) — {t.status === "open" ? "Открыт" : "Заблокирован"}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    
                    {/* Автокомплит для выбора сотрудника */}
                    <div style={{ marginBottom: "15px", position: "relative" }}>
                        <label>
                            Сотрудник (начните вводить фамилию):
                            <br />
                            <div style={{ position: "relative", width: "500px", marginTop: "5px" }}>
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedEmployee(null);
                                    }}
                                    onFocus={() => {
                                        if (suggestions.length > 0 && !selectedEmployee) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Введите фамилию сотрудника..."
                                    autoComplete="off"
                                    style={{ 
                                        width: "100%", 
                                        padding: "8px 35px 8px 8px",
                                        border: `2px solid ${selectedEmployee ? '#28a745' : '#ccc'}`,
                                        borderRadius: "4px"
                                    }}
                                />
                                {selectedEmployee && (
                                    <button
                                        type="button"
                                        onClick={handleClearEmployee}
                                        style={{
                                            position: "absolute",
                                            right: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            fontSize: "18px",
                                            cursor: "pointer",
                                            color: "#666",
                                            padding: "0 4px"
                                        }}
                                        title="Очистить выбор"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </label>
                        
                        {/* Выпадающий список подсказок */}
                        {showSuggestions && (
                            <div 
                                ref={suggestionsRef}
                                style={{
                                    position: "absolute",
                                    zIndex: 1000,
                                    width: "500px",
                                    maxHeight: "250px",
                                    overflowY: "auto",
                                    backgroundColor: "white",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                    marginTop: "2px"
                                }}
                            >
                                {suggestions.map((emp, index) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleSelectEmployee(emp)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        style={{
                                            padding: "10px 12px",
                                            cursor: "pointer",
                                            backgroundColor: highlightedIndex === index ? '#e8f0fe' : 'transparent',
                                            borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {highlightMatch(`${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`, searchTerm)}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                {emp.position || 'Без должности'}
                                            </div>
                                        </div>
                                        <span style={{ 
                                            fontSize: '0.85em',
                                            color: emp.status === 'active' ? '#28a745' : '#dc3545'
                                        }}>
                                            {emp.status === 'active' ? 'Активен' : 'Неактивен'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Информация о выбранном сотруднике */}
                    {selectedEmployee && (
                        <div style={{ 
                            marginBottom: "15px", 
                            padding: "10px", 
                            backgroundColor: selectedEmployee.status === 'active' ? '#d4edda' : '#fff3cd',
                            border: `1px solid ${selectedEmployee.status === 'active' ? '#c3e6cb' : '#ffc107'}`,
                            borderRadius: "4px",
                            maxWidth: "500px"
                        }}>
                            <strong>Выбран:</strong> {selectedEmployee.lastName} {selectedEmployee.firstName} {selectedEmployee.middleName || ''}
                            {selectedEmployee.position && ` • ${selectedEmployee.position}`}
                            {' • '}
                            <span style={{ 
                                color: selectedEmployee.status === 'active' ? '#155724' : '#856404',
                                fontWeight: 'bold'
                            }}>
                                {selectedEmployee.status === 'active' ? 'Активен' : 'Заблокирован'}
                            </span>
                        </div>
                    )}
                    
                    <button type="submit" style={{ padding: "10px 20px", fontSize: "16px" }}>
                        Попытаться пройти
                    </button>
                </form>
                
                {/* Сообщение о результате */}
                {message && (
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "15px", 
                        backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
                        color: messageType === "success" ? "#155724" : "#721c24",
                        border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                        borderRadius: "4px",
                        fontWeight: "bold"
                    }}>
                        {message}
                    </div>
                )}
            </div>
            
            {/* Подсказка */}
            <div style={{ marginTop: "10px", color: "#666", fontSize: "0.9em" }}>
                Начните вводить фамилию — и выберите сотрудника из выпадающего списка. Можно использовать стрелки и Enter.
            </div>
            
            {/* Кнопка перехода к истории */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button 
                    onClick={() => navigate('/history')}
                    style={{ 
                        padding: "12px 24px", 
                        fontSize: "16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Показать историю проходов
                </button>
            </div>
        </div>
    );
};

export default Access;
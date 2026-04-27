// History.js - История проходов с фильтрацией
import React, { useState, useMemo } from 'react';
import { useData } from '../App';

const getTypeName = (type) => {
    const types = {
        'turnstile': 'Турникет',
        'gate': 'Ворота',
        'barrier': 'Шлагбаум'
    };
    return types[type] || type || '—';
};

const getResultBadge = (result) => {
    const badges = {
        'success': { text: '✅ Успех', color: '#d4edda', textColor: '#155724' },
        'blocked_turnstile': { text: '🚫 Турникет заблокирован', color: '#f8d7da', textColor: '#721c24' },
        'blocked_employee': { text: '🚫 Сотрудник заблокирован', color: '#fff3cd', textColor: '#856404' }
    };
    return badges[result] || { text: result, color: '#e2e3e5', textColor: '#383d41' };
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const History = () => {
    const { events } = useData();
    
    // Состояния фильтров
    const [filterResult, setFilterResult] = useState('all');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterTurnstile, setFilterTurnstile] = useState('');
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' или 'asc'
    
    // Фильтрация и сортировка событий
    const filteredEvents = useMemo(() => {
        let filtered = [...events];
        
        // Фильтр по результату
        if (filterResult !== 'all') {
            filtered = filtered.filter(e => e.result === filterResult);
        }
        
        // Фильтр по сотруднику
        if (filterEmployee.trim()) {
            filtered = filtered.filter(e => 
                e.employeeName.toLowerCase().includes(filterEmployee.toLowerCase())
            );
        }
        
        // Фильтр по точке доступа
        if (filterTurnstile.trim()) {
            filtered = filtered.filter(e => 
                e.turnstileName.toLowerCase().includes(filterTurnstile.toLowerCase())
            );
        }
        
        // Сортировка по времени
        filtered.sort((a, b) => {
            const comparison = new Date(b.timestamp) - new Date(a.timestamp);
            return sortOrder === 'desc' ? comparison : -comparison;
        });
        
        return filtered;
    }, [events, filterResult, filterEmployee, filterTurnstile, sortOrder]);
    
    // Статистика
    const stats = useMemo(() => {
        const total = events.length;
        const success = events.filter(e => e.result === 'success').length;
        const blocked = events.filter(e => e.result !== 'success').length;
        
        return { total, success, blocked };
    }, [events]);

    console.log(`[History] Отображение ${filteredEvents.length} из ${events.length} событий`);

    return (
        <div>
            <h1>История проходов</h1>
            
            {/* Статистика */}
            <div style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                <div style={{ 
                    padding: '10px 15px', 
                    border: '1px solid #ccc', 
                    borderRadius: '5px',
                    backgroundColor: '#f8f9fa',
                    flex: '1',
                    minWidth: '120px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>Всего событий</div>
                </div>
                <div style={{ 
                    padding: '10px 15px', 
                    border: '1px solid #28a745', 
                    borderRadius: '5px',
                    backgroundColor: '#d4edda',
                    flex: '1',
                    minWidth: '120px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{stats.success}</div>
                    <div style={{ color: '#155724', fontSize: '14px' }}>Успешных</div>
                </div>
                <div style={{ 
                    padding: '10px 15px', 
                    border: '1px solid #dc3545', 
                    borderRadius: '5px',
                    backgroundColor: '#f8d7da',
                    flex: '1',
                    minWidth: '120px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{stats.blocked}</div>
                    <div style={{ color: '#721c24', fontSize: '14px' }}>Отклонённых</div>
                </div>
            </div>
            
            {/* Фильтры */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                border: '1px solid #dee2e6',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                        Результат:
                    </label>
                    <select 
                        value={filterResult}
                        onChange={(e) => setFilterResult(e.target.value)}
                        style={{ padding: '6px' }}
                    >
                        <option value="all">Все</option>
                        <option value="success">✅ Успешные</option>
                        <option value="blocked_turnstile">🚫 Турникет заблокирован</option>
                        <option value="blocked_employee">🚫 Сотрудник заблокирован</option>
                    </select>
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                        Сотрудник:
                    </label>
                    <input 
                        type="text"
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                        placeholder="Поиск по ФИО..."
                        style={{ padding: '6px' }}
                    />
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                        Точка доступа:
                    </label>
                    <input 
                        type="text"
                        value={filterTurnstile}
                        onChange={(e) => setFilterTurnstile(e.target.value)}
                        placeholder="Поиск по названию..."
                        style={{ padding: '6px' }}
                    />
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '14px' }}>
                        Сортировка:
                    </label>
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        style={{ padding: '6px 12px', cursor: 'pointer' }}
                    >
                        {sortOrder === 'desc' ? '↓ Новые сверху' : '↑ Старые сверху'}
                    </button>
                </div>
                
                <button 
                    onClick={() => {
                        setFilterResult('all');
                        setFilterEmployee('');
                        setFilterTurnstile('');
                    }}
                    style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                    Сбросить фильтры
                </button>
            </div>
            
            {/* Таблица событий */}
            {filteredEvents.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px'
                }}>
                    {events.length === 0 
                        ? 'Нет событий. Выполните попытку прохода на странице «Попытка прохода».' 
                        : 'Нет событий, соответствующих фильтрам.'}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th>Дата и время</th>
                                <th>Сотрудник</th>
                                <th>Должность</th>
                                <th>Точка доступа</th>
                                <th>Результат</th>
                                <th>Описание</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map(event => {
                                const badge = getResultBadge(event.result);
                                return (
                                    <tr key={event.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {formatDate(event.timestamp)}
                                        </td>
                                        <td>{event.employeeName}</td>
                                        <td>{event.employeePosition}</td>
                                        <td>
                                            {event.turnstileName} ({getTypeName(event.turnstileType)})
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 8px',
                                                borderRadius: '3px',
                                                backgroundColor: badge.color,
                                                color: badge.textColor,
                                                fontSize: '0.9em',
                                                fontWeight: 'bold'
                                            }}>
                                                {badge.text}
                                            </span>
                                        </td>
                                        <td>{event.description}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default History;
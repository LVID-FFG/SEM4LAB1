// App.js - Главный компонент приложения, содержит роутинг и управление состоянием
import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Form from "./pages/Form";
import Detail from "./pages/Detail";
import Employees from "./pages/Employees";
import Access from "./pages/Access";
import Login from "./pages/Login";
import { turnstileApi, employeeApi, auth } from "./api";
import Spinner from "./components/Spinner";

// Контекст для передачи данных между компонентами
export const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Компонент навигационного меню
const Navigation = ({ onLogout, currentUser }) => {
    return (
        <nav style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <Link to="/" style={{ marginRight: "15px" }}>Турникеты</Link>
                <Link to="/employees" style={{ marginRight: "15px" }}>Сотрудники</Link>
                <Link to="/access" style={{ marginRight: "15px" }}>Попытка прохода</Link>
                <Link to="/add">Добавить турникет</Link>
            </div>
            <div>
                <span style={{ marginRight: "15px" }}>Пользователь: {currentUser || 'admin'}</span>
                <button onClick={onLogout}>Выйти</button>
            </div>
        </nav>
    );
};

// Компонент для защиты маршрутов от неавторизованного доступа
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    if (!auth.isAuthenticated()) {
        console.log(`[Router] Доступ запрещён к ${location.pathname} - 403 Forbidden`);
        return <Navigate to="/login" replace state={{ 
            from: location.pathname, 
            error: `Доступ запрещён (403): требуется авторизация для доступа к ${location.pathname}` 
        }} />;
    }
    
    return children;
};

// Основной компонент содержимого приложения (после авторизации)
const AppContent = () => {
    // Состояния для хранения данных
    const [turnstiles, setTurnstiles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState("");
    const [globalErrorStatus, setGlobalErrorStatus] = useState(null);
    const navigate = useNavigate();

    // При монтировании загружаем данные, если пользователь авторизован
    useEffect(() => {
        if (auth.isAuthenticated()) {
            loadAllData();
        } else {
            setLoading(false);
        }
    }, []);

    // Загрузка всех данных (турникеты и сотрудники)
    async function loadAllData() {
        console.log('[App] Загрузка всех данных...');
        setLoading(true);
        setGlobalError("");
        setGlobalErrorStatus(null);
        
        // Параллельная загрузка для ускорения
        const [turnstilesRes, employeesRes] = await Promise.all([
            turnstileApi.getAll(),
            employeeApi.getAll()
        ]);
        
        const errors = [];
        
        // Обработка результата загрузки турникетов
        if (turnstilesRes.error) {
            console.error(`[App] Ошибка загрузки турникетов (${turnstilesRes.status}):`, turnstilesRes.error);
            errors.push(turnstilesRes.error);
            setGlobalErrorStatus(turnstilesRes.status);
        } else {
            console.log(`[App] Турникеты загружены (${turnstilesRes.status}):`, turnstilesRes.data.length);
            setTurnstiles(turnstilesRes.data);
        }
        
        // Обработка результата загрузки сотрудников
        if (employeesRes.error) {
            console.error(`[App] Ошибка загрузки сотрудников (${employeesRes.status}):`, employeesRes.error);
            // Добавляем ошибку только если она не дублируется
            if (!errors.includes(employeesRes.error)) {
                errors.push(employeesRes.error);
            }
            if (!globalErrorStatus) {
                setGlobalErrorStatus(employeesRes.status);
            }
        } else {
            console.log(`[App] Сотрудники загружены (${employeesRes.status}):`, employeesRes.data.length);
            setEmployees(employeesRes.data);
        }
        
        // Устанавливаем глобальную ошибку, если есть
        if (errors.length > 0) {
            setGlobalError(errors.join('; '));
        }
        
        setLoading(false);
    }

    // Добавление нового турникета с проверкой на дубликат
    async function addTurnstile(newTurnstile) {
        console.log('[App] Добавление турникета:', newTurnstile);
        
        // Проверка на дубликат по названию и расположению
        const isDuplicate = turnstiles.some(
            t => t.name.toLowerCase() === newTurnstile.name.toLowerCase() && 
                 t.location.toLowerCase() === newTurnstile.location.toLowerCase()
        );
        
        if (isDuplicate) {
            const errorMsg = 'Турникет с таким названием и расположением уже существует (409 Conflict)';
            console.error('[App] Дубликат турникета:', errorMsg);
            setGlobalError(errorMsg);
            setGlobalErrorStatus(409);
            throw new Error(errorMsg);
        }
        
        const result = await turnstileApi.create(newTurnstile);
        if (result.error) {
            console.error(`[App] Ошибка добавления турникета (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Турникет добавлен (${result.status}):`, result.data);
        setTurnstiles([...turnstiles, result.data]);
        return result.data;
    }

    // Обновление существующего турникета
    async function updateTurnstile(id, updatedData) {
        console.log('[App] Обновление турникета:', id, updatedData);
        
        // Проверка на дубликат (исключая текущий турникет)
        const isDuplicate = turnstiles.some(
            t => t.id !== id && 
                 t.name.toLowerCase() === updatedData.name.toLowerCase() && 
                 t.location.toLowerCase() === updatedData.location.toLowerCase()
        );
        
        if (isDuplicate) {
            const errorMsg = 'Турникет с таким названием и расположением уже существует (409 Conflict)';
            console.error('[App] Дубликат турникета:', errorMsg);
            setGlobalError(errorMsg);
            setGlobalErrorStatus(409);
            throw new Error(errorMsg);
        }
        
        const result = await turnstileApi.update(id, updatedData);
        if (result.error) {
            console.error(`[App] Ошибка обновления турникета (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Турникет обновлён (${result.status}):`, result.data);
        setTurnstiles(turnstiles.map(t => t.id === id ? result.data : t));
        return result.data;
    }

    // Удаление турникета
    async function deleteTurnstile(id) {
        console.log('[App] Удаление турникета:', id);
        const result = await turnstileApi.delete(id);
        if (result.error) {
            console.error(`[App] Ошибка удаления турникета (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Турникет удалён (${result.status}):`, id);
        setTurnstiles(turnstiles.filter(t => t.id !== id));
    }

    // Добавление нового сотрудника с проверкой на дубликат
    async function addEmployee(newEmployee) {
        console.log('[App] Добавление сотрудника:', newEmployee);
        
        // Проверка на дубликат по фамилии
        const isDuplicate = employees.some(
            e => e.lastName.toLowerCase() === newEmployee.lastName.toLowerCase()
        );
        
        if (isDuplicate) {
            const errorMsg = 'Сотрудник с такой фамилией уже существует (409 Conflict)';
            console.error('[App] Дубликат сотрудника:', errorMsg);
            setGlobalError(errorMsg);
            setGlobalErrorStatus(409);
            throw new Error(errorMsg);
        }
        
        const result = await employeeApi.create(newEmployee);
        if (result.error) {
            console.error(`[App] Ошибка добавления сотрудника (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Сотрудник добавлен (${result.status}):`, result.data);
        setEmployees([...employees, result.data]);
        return result.data;
    }

    // Удаление сотрудника
    async function deleteEmployee(id) {
        console.log('[App] Удаление сотрудника:', id);
        const result = await employeeApi.delete(id);
        if (result.error) {
            console.error(`[App] Ошибка удаления сотрудника (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Сотрудник удалён (${result.status}):`, id);
        setEmployees(employees.filter(e => e.id !== id));
    }

    // Обработчик выхода из системы
    function handleLogout() {
        console.log('[App] Выход из системы');
        auth.logout();
        navigate('/login');
    }

    // Значение контекста для дочерних компонентов
    const contextValue = {
        turnstiles,
        employees,
        loading,
        globalError,
        setGlobalError,
        addTurnstile,
        updateTurnstile,
        deleteTurnstile,
        addEmployee,
        deleteEmployee
    };

    // Показываем спиннер во время загрузки
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spinner />
                <span>Загрузка данных...</span>
            </div>
        );
    }

    return (
        <DataContext.Provider value={contextValue}>
            <div style={{ padding: "20px" }}>
                <Navigation onLogout={handleLogout} currentUser={auth.getCurrentUser()} />
                
                {/* Отображение глобальной ошибки, если есть */}
                {globalError && (
                    <div style={{ 
                        backgroundColor: "#f8d7da", 
                        color: "#721c24", 
                        padding: "10px", 
                        borderRadius: "4px", 
                        marginBottom: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span>{globalError}</span>
                        <button 
                            onClick={() => { setGlobalError(""); setGlobalErrorStatus(null); }}
                            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                        >
                            ×
                        </button>
                    </div>
                )}
                
                {/* Маршруты приложения */}
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/detail/:id" element={<ProtectedRoute><Detail /></ProtectedRoute>} />
                    <Route path="/add" element={<ProtectedRoute><Form /></ProtectedRoute>} />
                    <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                    <Route path="/access" element={<ProtectedRoute><Access /></ProtectedRoute>} />
                </Routes>
            </div>
        </DataContext.Provider>
    );
};

// Корневой компонент приложения
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<AppContent />} />
            </Routes>
        </Router>
    );
};

export default App;
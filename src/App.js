// App.js - Главный компонент приложения, содержит роутинг и управление состоянием
import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Form from "./pages/Form";
import Detail from "./pages/Detail";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Access from "./pages/Access";
import Login from "./pages/Login";
import Map from "./pages/Map";
import History from "./pages/History";
import { turnstileApi, employeeApi, eventApi, auth } from "./api";
import Spinner from "./components/Spinner";

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

const Navigation = ({ onLogout, currentUser, userRole }) => {
    const isAdmin = userRole === 'admin';

    return (
        <nav style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <Link to="/" style={{ marginRight: "15px" }}>Турникеты</Link>
                <Link to="/employees" style={{ marginRight: "15px" }}>Сотрудники</Link>
                <Link to="/map" style={{ marginRight: "15px" }}>Карта</Link>
                <Link to="/access" style={{ marginRight: "15px" }}>Попытка прохода</Link>
                <Link to="/history" style={{ marginRight: "15px" }}>История</Link>
                {isAdmin && <Link to="/add">Добавить турникет</Link>}
            </div>
            <div>
                <span style={{ marginRight: "15px" }}>
                    Пользователь: {currentUser || 'admin'}
                    {userRole && <span style={{ color: '#666', marginLeft: '8px' }}>({userRole === 'admin' ? 'Администратор' : 'Охранник'})</span>}
                </span>
                <button onClick={onLogout}>Выйти</button>
            </div>
        </nav>
    );
};

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

const AppContent = () => {
    const [turnstiles, setTurnstiles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState("");
    const [globalErrorStatus, setGlobalErrorStatus] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated()) {
            loadAllData();
        } else {
            setLoading(false);
        }
    }, []);

    async function loadAllData() {
        console.log('[App] Загрузка всех данных...');
        setLoading(true);
        setGlobalError("");
        setGlobalErrorStatus(null);
        
        const [turnstilesRes, employeesRes, eventsRes] = await Promise.all([
            turnstileApi.getAll(),
            employeeApi.getAll(),
            eventApi.getAll()
        ]);
        
        const errors = [];
        
        if (turnstilesRes.error) {
            console.error(`[App] Ошибка загрузки турникетов (${turnstilesRes.status}):`, turnstilesRes.error);
            errors.push(turnstilesRes.error);
            setGlobalErrorStatus(turnstilesRes.status);
        } else {
            console.log(`[App] Турникеты загружены (${turnstilesRes.status}):`, turnstilesRes.data.length);
            setTurnstiles(turnstilesRes.data);
        }
        
        if (employeesRes.error) {
            console.error(`[App] Ошибка загрузки сотрудников (${employeesRes.status}):`, employeesRes.error);
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
        
        if (eventsRes.error) {
            console.error(`[App] Ошибка загрузки событий (${eventsRes.status}):`, eventsRes.error);
            if (!errors.includes(eventsRes.error)) {
                errors.push(eventsRes.error);
            }
        } else {
            console.log(`[App] История проходов загружена (${eventsRes.status}):`, eventsRes.data.length);
            setEvents(eventsRes.data);
        }
        
        if (errors.length > 0) {
            setGlobalError(errors.join('; '));
        }
        
        setLoading(false);
    }

    async function addEvent(eventData) {
        console.log('[App] Добавление события:', eventData);
        const result = await eventApi.create(eventData);
        if (result.error) {
            console.error(`[App] Ошибка сохранения события (${result.status}):`, result.error);
            return null;
        }
        console.log(`[App] Событие сохранено (${result.status}):`, result.data);
        setEvents(prev => [...prev, result.data]);
        return result.data;
    }

    async function addTurnstile(newTurnstile) {
        console.log('[App] Добавление турникета:', newTurnstile);
        
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

    async function updateTurnstile(id, updatedData) {
        console.log('[App] Обновление турникета:', id, updatedData);
        
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

    async function addEmployee(newEmployee) {
        console.log('[App] Добавление сотрудника:', newEmployee);
        
        const isDuplicate = employees.some(
            e => 
                e.lastName.toLowerCase() === newEmployee.lastName.toLowerCase() &&
                e.firstName.toLowerCase() === newEmployee.firstName.toLowerCase() &&
                (e.middleName || '').toLowerCase() === (newEmployee.middleName || '').toLowerCase()
        );
        
        if (isDuplicate) {
            const errorMsg = 'Сотрудник с таким ФИО уже существует (409 Conflict)';
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

    async function updateEmployee(id, updatedData) {
        console.log('[App] Обновление сотрудника:', id, updatedData);
        
        const isDuplicate = employees.some(
            e => 
                e.id !== id &&
                e.lastName.toLowerCase() === updatedData.lastName.toLowerCase() &&
                e.firstName.toLowerCase() === updatedData.firstName.toLowerCase() &&
                (e.middleName || '').toLowerCase() === (updatedData.middleName || '').toLowerCase()
        );
        
        if (isDuplicate) {
            const errorMsg = 'Сотрудник с таким ФИО уже существует (409 Conflict)';
            console.error('[App] Дубликат сотрудника:', errorMsg);
            setGlobalError(errorMsg);
            setGlobalErrorStatus(409);
            throw new Error(errorMsg);
        }
        
        const result = await employeeApi.update(id, updatedData);
        if (result.error) {
            console.error(`[App] Ошибка обновления сотрудника (${result.status}):`, result.error);
            setGlobalError(result.error);
            setGlobalErrorStatus(result.status);
            throw new Error(result.error);
        }
        console.log(`[App] Сотрудник обновлён (${result.status}):`, result.data);
        setEmployees(employees.map(e => e.id === id ? result.data : e));
        return result.data;
    }

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

    function handleLogout() {
        console.log('[App] Выход из системы');
        auth.logout();
        navigate('/login');
    }

    const userRole = auth.getUserRole();
    const isAdmin = userRole === 'admin';

    const contextValue = {
        turnstiles,
        employees,
        events,
        loading,
        globalError,
        setGlobalError,
        addTurnstile,
        updateTurnstile,
        deleteTurnstile,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addEvent,
        isAdmin
    };

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
                <Navigation onLogout={handleLogout} currentUser={auth.getCurrentUser()} userRole={userRole} />
                
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
                
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/detail/:id" element={<ProtectedRoute><Detail /></ProtectedRoute>} />
                    <Route path="/add" element={<ProtectedRoute><Form /></ProtectedRoute>} />
                    <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                    <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
                    <Route path="/access" element={<ProtectedRoute><Access /></ProtectedRoute>} />
                    <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                    <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                </Routes>
            </div>
        </DataContext.Provider>
    );
};

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
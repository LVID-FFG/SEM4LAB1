import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Form from "./pages/Form";
import Detail from "./pages/Detail";
import Employees from "./pages/Employees";
import Access from "./pages/Access";
import Login from "./pages/Login";
import { turnstileApi, employeeApi, auth } from "./api";
import Spinner from "./components/Spinner";

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Компонент навигации с хуком useNavigate
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

const AppContent = () => {
    const [turnstiles, setTurnstiles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
    const navigate = useNavigate();

    // Проверка аутентификации при загрузке
    useEffect(() => {
        setIsAuthenticated(auth.isAuthenticated());
    }, []);

    // Загрузка всех данных
    useEffect(() => {
        if (isAuthenticated) {
            loadAllData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    async function loadAllData() {
        setLoading(true);
        setGlobalError("");
        
        const [turnstilesRes, employeesRes] = await Promise.all([
            turnstileApi.getAll(),
            employeeApi.getAll()
        ]);
        
        if (turnstilesRes.error) {
            setGlobalError(turnstilesRes.error);
        } else {
            setTurnstiles(turnstilesRes.data);
        }
        
        if (employeesRes.error) {
            setGlobalError(prev => prev ? `${prev}; ${employeesRes.error}` : employeesRes.error);
        } else {
            setEmployees(employeesRes.data);
        }
        
        setLoading(false);
    }

    async function addTurnstile(newTurnstile) {
        const result = await turnstileApi.create(newTurnstile);
        if (result.error) {
            setGlobalError(result.error);
            throw new Error(result.error);
        }
        setTurnstiles([...turnstiles, result.data]);
        return result.data;
    }

    async function updateTurnstile(id, updatedData) {
        const result = await turnstileApi.update(id, updatedData);
        if (result.error) {
            setGlobalError(result.error);
            throw new Error(result.error);
        }
        setTurnstiles(turnstiles.map(t => t.id === id ? result.data : t));
        return result.data;
    }

    async function deleteTurnstile(id) {
        const result = await turnstileApi.delete(id);
        if (result.error) {
            setGlobalError(result.error);
            throw new Error(result.error);
        }
        setTurnstiles(turnstiles.filter(t => t.id !== id));
    }

    async function addEmployee(newEmployee) {
        const result = await employeeApi.create(newEmployee);
        if (result.error) {
            setGlobalError(result.error);
            throw new Error(result.error);
        }
        setEmployees([...employees, result.data]);
        return result.data;
    }

    async function deleteEmployee(id) {
        const result = await employeeApi.delete(id);
        if (result.error) {
            setGlobalError(result.error);
            throw new Error(result.error);
        }
        setEmployees(employees.filter(e => e.id !== id));
    }

    function handleLogout() {
        auth.logout();
        setIsAuthenticated(false);
        navigate('/login');
    }

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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

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
                            onClick={() => setGlobalError("")}
                            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                        >
                            ×
                        </button>
                    </div>
                )}
                
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/detail/:id" element={<Detail />} />
                    <Route path="/add" element={<Form />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/access" element={<Access />} />
                    <Route path="/login" element={<Navigate to="/" replace />} />
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
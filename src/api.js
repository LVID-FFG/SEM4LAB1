// api.js - Модуль для работы с REST API
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавление JWT токена ко всем запросам
api.interceptors.request.use(request => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        request.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[API] ${request.method?.toUpperCase()} ${request.url}`);
    if (request.data) {
        console.log('[API] Данные запроса:', request.data);
    }
    return request;
});

api.interceptors.response.use(
    response => {
        console.log(`[API] Ответ ${response.status} от ${response.config.url}`);
        return response;
    },
    error => {
        if (error.response) {
            console.error(`[API] Ошибка ${error.response.status} от ${error.config?.url}:`, error.response.data);
        } else if (error.request) {
            console.error('[API] Нет ответа от сервера:', error.message);
        } else {
            console.error('[API] Ошибка запроса:', error.message);
        }
        return Promise.reject(error);
    }
);

export function getErrorMessage(error) {
    if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.error || '';
        
        switch (status) {
            case 400: return { message: serverMessage || 'Некорректный запрос (400 Bad Request)', status };
            case 401: return { message: serverMessage || 'Ошибка авторизации (401): требуется вход в систему', status };
            case 403: return { message: serverMessage || 'Доступ запрещён (403): у вас нет прав', status };
            case 404: return { message: serverMessage || 'Данные не найдены (404)', status };
            case 500: return { message: serverMessage || 'Внутренняя ошибка сервера (500)', status };
            default: return { message: serverMessage || `Ошибка сервера (${status})`, status };
        }
    } else if (error.request) {
        return { message: 'Сервер не отвечает. Убедитесь, что сервер запущен.', status: 503 };
    } else {
        return { message: `Ошибка: ${error.message}`, status: 0 };
    }
}

// API для турникетов
export const turnstileApi = {
    getAll: async () => {
        try {
            const response = await api.get('/api/turnstiles');
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    getOne: async (id) => {
        try {
            const response = await api.get(`/api/turnstiles/${id}`);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    create: async (turnstile) => {
        try {
            const response = await api.post('/api/turnstiles', turnstile);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    update: async (id, turnstile) => {
        try {
            const response = await api.put(`/api/turnstiles/${id}`, turnstile);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    delete: async (id) => {
        try {
            await api.delete(`/api/turnstiles/${id}`);
            return { error: null, status: 204 };
        } catch (error) { const err = getErrorMessage(error); return { error: err.message, status: err.status }; }
    }
};

// API для сотрудников
export const employeeApi = {
    getAll: async () => {
        try {
            const response = await api.get('/api/employees');
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    create: async (employee) => {
        try {
            const response = await api.post('/api/employees', employee);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    update: async (id, employee) => {
        try {
            const response = await api.put(`/api/employees/${id}`, employee);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    delete: async (id) => {
        try {
            await api.delete(`/api/employees/${id}`);
            return { error: null, status: 204 };
        } catch (error) { const err = getErrorMessage(error); return { error: err.message, status: err.status }; }
    }
};

// API для событий
export const eventApi = {
    getAll: async () => {
        try {
            const response = await api.get('/api/events');
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    },
    create: async (event) => {
        try {
            const response = await api.post('/api/events', event);
            return { data: response.data, error: null, status: response.status };
        } catch (error) { const err = getErrorMessage(error); return { data: null, error: err.message, status: err.status }; }
    }
};

// Аутентификация через JWT
export const auth = {
    login: async (username, password) => {
        try {
            console.log(`[Auth] Попытка входа: ${username}`);
            const response = await api.post('/api/login', { username, password });
            
            const { token, user } = response.data;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            
            console.log(`[Auth] Вход выполнен успешно (${response.status}), роль: ${user.role}`);
            return { success: true, error: null, status: response.status, user };
        } catch (error) {
            const err = getErrorMessage(error);
            console.log(`[Auth] Ошибка входа (${err.status}): ${err.message}`);
            return { success: false, error: err.message, status: err.status };
        }
    },
    
    logout: () => {
        console.log('[Auth] Выход из системы');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },
    
    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            return Date.now() < expiry;
        } catch (e) {
            return false;
        }
    },
    
    getCurrentUser: () => {
        const userStr = localStorage.getItem('auth_user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.fullName || user.username;
        } catch (e) {
            return null;
        }
    },
    
    getUserRole: () => {
        const userStr = localStorage.getItem('auth_user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.role;
        } catch (e) {
            return null;
        }
    }
};

export default api;
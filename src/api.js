// api.js - Модуль для работы с REST API (json-server)
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Создаём экземпляр axios с базовыми настройками
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Логирование запросов - выводим в консоль метод и URL
api.interceptors.request.use(request => {
    console.log(`[API] ${request.method?.toUpperCase()} ${request.url}`);
    if (request.data) {
        console.log('[API] Данные запроса:', request.data);
    }
    return request;
});

// Логирование ответов - выводим статус и данные
api.interceptors.response.use(
    response => {
        console.log(`[API] Ответ ${response.status} от ${response.config.url}:`, response.data);
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

// Функция для получения текста ошибки по объекту ошибки axios
// Возвращает объект с сообщением и статус-кодом
export function getErrorMessage(error) {
    if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText || '';
        
        switch (status) {
            case 401:
                return { message: `Ошибка авторизации (401): требуется вход в систему`, status };
            case 403:
                return { message: `Доступ запрещён (403): у вас нет прав для этого действия`, status };
            case 404:
                return { message: `Данные не найдены (404): запрашиваемый ресурс отсутствует`, status };
            case 409:
                return { message: `Конфликт данных (409): возможно, такой элемент уже существует`, status };
            case 500:
                return { message: `Внутренняя ошибка сервера (500): попробуйте позже`, status };
            case 503:
                return { message: `Сервис недоступен (503): попробуйте позже`, status };
            default:
                return { message: `Ошибка сервера (${status}${statusText ? ': ' + statusText : ''})`, status };
        }
    } else if (error.request) {
        return { message: `Сервер не отвечает (нет соединения). Убедитесь, что json-server запущен.`, status: 503 };
    } else {
        return { message: `Ошибка: ${error.message}`, status: 0 };
    }
}

// API методы для работы с турникетами
export const turnstileApi = {
    // Получить все турникеты
    getAll: async () => {
        try {
            const response = await api.get('/turnstiles');
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Получить один турникет по ID
    getOne: async (id) => {
        try {
            const response = await api.get(`/turnstiles/${id}`);
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Создать новый турникет
    create: async (turnstile) => {
        try {
            const response = await api.post('/turnstiles', turnstile);
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Обновить существующий турникет
    update: async (id, turnstile) => {
        try {
            const response = await api.put(`/turnstiles/${id}`, turnstile);
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Удалить турникет по ID
    delete: async (id) => {
        try {
            const response = await api.delete(`/turnstiles/${id}`);
            return { error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { error: err.message, status: err.status };
        }
    }
};

// API методы для работы с сотрудниками
export const employeeApi = {
    // Получить всех сотрудников
    getAll: async () => {
        try {
            const response = await api.get('/employees');
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Создать нового сотрудника
    create: async (employee) => {
        try {
            const response = await api.post('/employees', employee);
            return { data: response.data, error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { data: null, error: err.message, status: err.status };
        }
    },
    
    // Удалить сотрудника по ID
    delete: async (id) => {
        try {
            const response = await api.delete(`/employees/${id}`);
            return { error: null, status: response.status };
        } catch (error) {
            const err = getErrorMessage(error);
            return { error: err.message, status: err.status };
        }
    }
};

// Фиктивная аутентификация (только admin/admin)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const FAKE_TOKEN = 'admin-token-12345';

export const auth = {
    // Вход в систему
    login: (username, password) => {
        console.log(`[Auth] Попытка входа: ${username}`);
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('auth_token', FAKE_TOKEN);
            localStorage.setItem('auth_user', username);
            console.log('[Auth] Вход выполнен успешно (статус: 200 OK)');
            return { success: true, error: null, status: 200 };
        }
        console.log('[Auth] Ошибка входа: неверные учётные данные (статус: 401 Unauthorized)');
        return { success: false, error: 'Неверный логин или пароль (401 Unauthorized)', status: 401 };
    },
    
    // Выход из системы
    logout: () => {
        console.log('[Auth] Выход из системы');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },
    
    // Проверка авторизации
    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        return token === FAKE_TOKEN;
    },
    
    // Получить имя текущего пользователя
    getCurrentUser: () => {
        return localStorage.getItem('auth_user');
    }
};

export default api;
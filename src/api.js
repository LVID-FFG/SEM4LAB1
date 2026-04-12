import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Создаём экземпляр axios с настройками
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Функция для получения сообщения об ошибке
function getErrorMessage(error) {
    if (error.response) {
        const status = error.response.status;
        switch (status) {
            case 400:
                return 'Ошибка запроса (400): проверьте правильность данных';
            case 401:
                return 'Ошибка авторизации (401): требуется вход в систему';
            case 403:
                return 'Доступ запрещён (403): у вас нет прав для этого действия';
            case 404:
                return 'Данные не найдены (404): запрашиваемый ресурс отсутствует';
            case 409:
                return 'Конфликт данных (409): возможно, такой элемент уже существует';
            case 500:
                return 'Внутренняя ошибка сервера (500): попробуйте позже';
            case 502:
                return 'Ошибка шлюза (502): сервер временно недоступен';
            case 503:
                return 'Сервис недоступен (503): попробуйте позже';
            default:
                return `Ошибка сервера (${status}): ${error.response.data?.message || 'неизвестная ошибка'}`;
        }
    } else if (error.request) {
        return 'Сервер не отвечает. Убедитесь, что json-server запущен';
    } else {
        return `Ошибка: ${error.message}`;
    }
}

// API методы для турникетов
export const turnstileApi = {
    getAll: async () => {
        try {
            const response = await api.get('/turnstiles');
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    getOne: async (id) => {
        try {
            const response = await api.get(`/turnstiles/${id}`);
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    create: async (turnstile) => {
        try {
            const response = await api.post('/turnstiles', turnstile);
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    update: async (id, turnstile) => {
        try {
            const response = await api.put(`/turnstiles/${id}`, turnstile);
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    delete: async (id) => {
        try {
            await api.delete(`/turnstiles/${id}`);
            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error) };
        }
    }
};

// API методы для сотрудников
export const employeeApi = {
    getAll: async () => {
        try {
            const response = await api.get('/employees');
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    create: async (employee) => {
        try {
            const response = await api.post('/employees', employee);
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: getErrorMessage(error) };
        }
    },
    
    delete: async (id) => {
        try {
            await api.delete(`/employees/${id}`);
            return { error: null };
        } catch (error) {
            return { error: getErrorMessage(error) };
        }
    }
};

// Аутентификация - только admin/admin
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const FAKE_TOKEN = 'admin-token-12345';

export const auth = {
    login: (username, password) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('auth_token', FAKE_TOKEN);
            localStorage.setItem('auth_user', username);
            return { success: true, error: null };
        }
        return { success: false, error: 'Неверный логин или пароль' };
    },
    
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },
    
    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        return token === FAKE_TOKEN;
    },
    
    getCurrentUser: () => {
        return localStorage.getItem('auth_user');
    }
};

export default api;
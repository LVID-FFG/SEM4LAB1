const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'super-secret-key-change-in-production-2024';
const TOKEN_EXPIRY = '1h';

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

function readDB() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function initializeUsers() {
    const db = readDB();
    
    if (!db.users) {
        const salt = bcrypt.genSaltSync(10);
        db.users = [
            {
                id: "1",
                username: "admin",
                password: bcrypt.hashSync("admin", salt),
                role: "admin",
                fullName: "Администратор системы"
            },
            {
                id: "2",
                username: "guard",
                password: bcrypt.hashSync("guard", salt),
                role: "guard",
                fullName: "Охранник Петров"
            }
        ];
        writeDB(db);
        console.log('[Server] Пользователи инициализированы с хешированными паролями');
    }
}

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация (401 Unauthorized)' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Токен недействителен или истёк (403 Forbidden)' });
        }
        req.user = user;
        next();
    });
}

// Middleware для проверки роли admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён: требуется роль администратора (403 Forbidden)' });
    }
    next();
}

// Роут для входа
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`[Auth] Попытка входа: ${username}`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны (400 Bad Request)' });
    }

    const db = readDB();
    const user = db.users.find(u => u.username === username);

    if (!user) {
        console.log(`[Auth] Пользователь ${username} не найден`);
        return res.status(401).json({ error: 'Неверный логин или пароль (401 Unauthorized)' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    
    if (!isValidPassword) {
        console.log(`[Auth] Неверный пароль для ${username}`);
        return res.status(401).json({ error: 'Неверный логин или пароль (401 Unauthorized)' });
    }

    const token = jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            fullName: user.fullName
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );

    console.log(`[Auth] Успешный вход: ${username} (роль: ${user.role})`);
    
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        }
    });
});

// Турникеты: чтение доступно всем, изменение только admin
app.get('/api/turnstiles', authenticateToken, (req, res) => {
    const db = readDB();
    console.log(`[API] GET /api/turnstiles (пользователь: ${req.user.username})`);
    res.json(db.turnstiles || []);
});

app.get('/api/turnstiles/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const turnstile = db.turnstiles.find(t => t.id === req.params.id);
    if (!turnstile) {
        return res.status(404).json({ error: 'Точка доступа не найдена (404 Not Found)' });
    }
    res.json(turnstile);
});

app.post('/api/turnstiles', authenticateToken, requireAdmin, (req, res) => {
    const db = readDB();
    const newTurnstile = {
        ...req.body,
        id: req.body.id || Date.now().toString()
    };
    db.turnstiles.push(newTurnstile);
    writeDB(db);
    console.log(`[API] POST /api/turnstiles - создана точка доступа: ${newTurnstile.name}`);
    res.status(201).json(newTurnstile);
});

app.put('/api/turnstiles/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const index = db.turnstiles.findIndex(t => t.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Точка доступа не найдена (404 Not Found)' });
    }
    db.turnstiles[index] = { ...db.turnstiles[index], ...req.body, id: req.params.id };
    writeDB(db);
    console.log(`[API] PUT /api/turnstiles/${req.params.id} - обновлена точка доступа`);
    res.json(db.turnstiles[index]);
});

app.delete('/api/turnstiles/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = readDB();
    const index = db.turnstiles.findIndex(t => t.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Точка доступа не найдена (404 Not Found)' });
    }
    db.turnstiles.splice(index, 1);
    writeDB(db);
    console.log(`[API] DELETE /api/turnstiles/${req.params.id} - удалена точка доступа`);
    res.status(204).send();
});

// Сотрудники: чтение доступно всем, изменение только admin
app.get('/api/employees', authenticateToken, (req, res) => {
    const db = readDB();
    console.log(`[API] GET /api/employees (пользователь: ${req.user.username})`);
    res.json(db.employees || []);
});

app.post('/api/employees', authenticateToken, requireAdmin, (req, res) => {
    const db = readDB();
    const newEmployee = {
        ...req.body,
        id: req.body.id || Date.now().toString()
    };
    db.employees.push(newEmployee);
    writeDB(db);
    console.log(`[API] POST /api/employees - создан сотрудник: ${newEmployee.lastName}`);
    res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = readDB();
    const index = db.employees.findIndex(e => e.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Сотрудник не найден (404 Not Found)' });
    }
    db.employees[index] = { ...db.employees[index], ...req.body, id: req.params.id };
    writeDB(db);
    console.log(`[API] PUT /api/employees/${req.params.id} - обновлён сотрудник`);
    res.json(db.employees[index]);
});

app.delete('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = readDB();
    const index = db.employees.findIndex(e => e.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Сотрудник не найден (404 Not Found)' });
    }
    db.employees.splice(index, 1);
    writeDB(db);
    console.log(`[API] DELETE /api/employees/${req.params.id} - удалён сотрудник`);
    res.status(204).send();
});

// События: чтение и создание доступно всем
app.get('/api/events', authenticateToken, (req, res) => {
    const db = readDB();
    console.log(`[API] GET /api/events (пользователь: ${req.user.username})`);
    res.json(db.events || []);
});

app.post('/api/events', authenticateToken, (req, res) => {
    const db = readDB();
    const newEvent = {
        ...req.body,
        id: req.body.id || Date.now().toString()
    };
    if (!db.events) db.events = [];
    db.events.push(newEvent);
    writeDB(db);
    console.log(`[API] POST /api/events - создано событие: ${newEvent.result}`);
    res.status(201).json(newEvent);
});

initializeUsers();
app.listen(PORT, () => {
    console.log(`[Server] Express + JWT сервер запущен на http://localhost:${PORT}`);
    console.log(`[Server] Логины: admin/admin, guard/guard`);
});
class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.messageCallbacks = [];
        this.connectCallbacks = [];
    }

    connect(token) {
        console.log('=== WebSocket CONNECT ===');
        console.log('Токен:', token ? 'есть' : 'нет');
        console.log('Уже подключен:', this.connected);

        if (this.connected && this.socket) {
            if (token && this.socket) {
                this.socket.emit('authenticate', token);
            }
            return;
        }

        console.log('🔄 Инициализирую WebSocket подключение...');
        this.socket = io('http://localhost:3000', {
            auth: { token: token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket подключен, ID:', this.socket.id);
            console.log('Auth токен отправлен:', this.socket.auth?.token ? 'да' : 'нет');
            console.log('Socket объект:', this.socket); // ← ДОБАВЬТЕ ЭТУ СТРОКУ
            this.connected = true;

            if (token && !this.socket.auth?.token) {
                console.log('📤 Отправляю токен для авторизации...');
                this.socket.emit('authenticate', token);
            }

            this.connectCallbacks.forEach(cb => cb());
        });

        this.socket.on('authenticated', (data) => {
            console.log('✅ WebSocket авторизован, user_id:', data.userId);
            this.socket.userId = data.userId;
            this.userId = data.userId;
        });

        this.socket.on('unauthorized', (error) => {
            console.error('❌ WebSocket авторизация не прошла:', error);
        });

        this.socket.on('new_message', (data) => {
            console.log('Новое сообщение через WS:', data);
            this.messageCallbacks.forEach(cb => cb(data));

            if (Notification.permission === 'granted' && data.sender_id !== window.currentUser?.id) {
                new Notification('Новое сообщение', {
                    body: `${data.sender_name}: ${data.text.substring(0, 50)}...`,
                    icon: '/favicon.ico'
                });
            }
        });

        this.socket.on('message_sent', (data) => {
            console.log('Сообщение отправлено:', data);
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket ошибка:', error);
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket отключен');
            this.connected = false;
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    sendMessage(receiver_id, text, ad_id = null) {
        if (!this.connected || !this.socket) {
            throw new Error('WebSocket не подключен');
        }

        console.log('📤 Emitting new_message. Мой userId:', this.userId);
        

        this.socket.emit('new_message', {
            receiver_id,
            text,
            ad_id,
            sender_name: window.currentUser?.name,
            sender_id: this.userId
        });
    }

    joinConversation(otherUserId) {
        if (this.connected && this.socket) {
            this.socket.emit('join_conversation', otherUserId);
        }
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }

    onConnect(callback) {
        this.connectCallbacks.push(callback);
    }
}

// Глобальный экземпляр
window.socketManager = new SocketManager();
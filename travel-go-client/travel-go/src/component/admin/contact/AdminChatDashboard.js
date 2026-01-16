import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle,
    Users,
    Search,
    Mail,
    Clock,
    User,
    Send,
    X,
    Archive,
    Eye,
    RefreshCw
} from 'lucide-react';

// API Service
const chatApiService = {
    // Lấy lịch sử phòng từ API
    async loadRoomHistory(roomId) {
        try {
            const response = await fetch(`http://localhost:8080/rooms/${roomId}/history`);
            const data = await response.json();

            if (data.success) {
                return data.messages.map(msg => ({
                    id: msg.id,
                    type: this.mapMessageType(msg.senderType),
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                    sender: msg.senderId,
                    senderType: msg.senderType,
                    customerName: msg.customerName,
                    adminName: msg.adminName
                }));
            } else {
                console.error('Lỗi tải lịch sử:', data.error);
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Lỗi API:', error);
            throw error;
        }
    },

    // Lấy danh sách rooms từ API
    async loadAllRooms() {
        try {
            const response = await fetch('http://localhost:8080/admin/rooms');
            const data = await response.json();

            if (data.success) {
                console.log('✅ Rooms loaded from API:', data.rooms);
                return data.rooms;
            } else {
                console.error('❌ Error loading rooms:', data.error);
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ API Error loading rooms:', error);
            throw error;
        }
    },

    // Map message type
    mapMessageType(senderType) {
        switch (senderType) {
            case 'SYSTEM': return 'system';
            case 'CUSTOMER': return 'customer';
            case 'ADMIN': return 'admin';
            case 'AGENT': return 'admin';
            default: return 'system';
        }
    }
};

const AdminChatDashboard = () => {
    const [activeRooms, setActiveRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [apiLoading, setApiLoading] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        waiting: 0,
        active: 0,
        closed: 0
    });

    const [adminInfo] = useState({
        name: 'Admin Support',
        id: 'admin_' + Date.now(),
        role: 'ADMIN'
    });

    const messagesEndRef = useRef(null);
    const roomSubscriptions = useRef(new Map());

    // WebSocket connection
    useEffect(() => {
        connectWebSocket();
        return () => {
            disconnectWebSocket();
        };
    }, []);

    // Load rooms from API when component mounts
    useEffect(() => {
        loadRoomsFromAPI();
    }, []);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Update stats when rooms change
    useEffect(() => {
        updateStats();
    }, [activeRooms]);

    const loadRoomsFromAPI = async () => {
        try {
            console.log('📡 Loading rooms from API...');
            setApiLoading(true);

            const rooms = await chatApiService.loadAllRooms();
            setActiveRooms(rooms);

        } catch (error) {
            console.error('❌ Error loading rooms:', error);
            // Fallback: Show empty state
            setActiveRooms([]);
        } finally {
            setApiLoading(false);
        }
    };

    const connectWebSocket = () => {
        try {
            console.log('🔄 Admin connecting to WebSocket...');
            setLoading(true);
            setConnectionStatus('connecting');

            import('sockjs-client').then(SockJS => {
                import('@stomp/stompjs').then(Stomp => {

                    const socket = new SockJS.default('http://localhost:8080/ws');
                    const client = new Stomp.Client({
                        webSocketFactory: () => socket,
                        reconnectDelay: 5000,
                        heartbeatIncoming: 4000,
                        heartbeatOutgoing: 4000,
                        debug: (str) => {
                            console.log('🔧 STOMP Debug:', str);
                        },
                        onConnect: (frame) => {
                            console.log('✅ Admin WebSocket connected!', frame);
                            setIsConnected(true);
                            setConnectionStatus('connected');
                            setStompClient(client);
                            setLoading(false);

                            // Subscribe to admin dashboard topics
                            subscribeToAdminTopics(client);

                        },
                        onStompError: (frame) => {
                            console.error('❌ Admin STOMP error:', frame);
                            setIsConnected(false);
                            setConnectionStatus('error');
                            setLoading(false);
                        },
                        onWebSocketError: (error) => {
                            console.error('❌ Admin WebSocket error:', error);
                            setIsConnected(false);
                            setConnectionStatus('error');
                            setLoading(false);
                        },
                        onDisconnect: () => {
                            console.log('🔌 Admin WebSocket disconnected');
                            setIsConnected(false);
                            setConnectionStatus('disconnected');
                            setLoading(false);
                        }
                    });

                    client.activate();
                    setStompClient(client);

                }).catch(error => {
                    console.error('❌ Error loading STOMP:', error);
                    setConnectionStatus('error');
                    setLoading(false);
                });
            }).catch(error => {
                console.error('❌ Error loading SockJS:', error);
                setConnectionStatus('error');
                setLoading(false);
            });

        } catch (error) {
            console.error('💥 Admin WebSocket init error:', error);
            setIsConnected(false);
            setConnectionStatus('error');
            setLoading(false);
        }
    };

    const subscribeToAdminTopics = (client) => {
        try {
            // Subscribe to admin dashboard for room updates
            const subscription = client.subscribe('/topic/admin/dashboard', (message) => {
                console.log('📊 Raw dashboard message:', message.body);
                handleDashboardUpdate(message);
            });

            console.log('✅ Admin subscribed to dashboard topics');
            return subscription;

        } catch (error) {
            console.error('❌ Error subscribing to admin topics:', error);
            return null;
        }
    };

    const handleDashboardUpdate = (message) => {
        try {
            console.log('🔄 Processing dashboard message...');

            let data;
            if (typeof message.body === 'string') {
                data = JSON.parse(message.body);
            } else if (message.body) {
                data = message.body;
            } else {
                console.error('❌ Empty message body');
                return;
            }

            console.log('📊 Parsed dashboard data:', data);

            switch (data.type) {
                case 'ACTIVE_ROOMS':
                    console.log('📋 Received active rooms:', data.rooms);
                    setActiveRooms(Array.isArray(data.rooms) ? data.rooms : []);
                    break;

                case 'NEW_CUSTOMER':
                    console.log('👤 New customer:', data);
                    handleNewCustomer(data);
                    break;

                case 'NEW_MESSAGE':
                    console.log('💬 New message:', data);
                    handleNewMessage(data);
                    break;

                default:
                    console.log('❓ Unknown message type:', data.type, data);
            }

        } catch (error) {
            console.error('❌ Error processing dashboard update:', error);
        }
    };

    const handleNewCustomer = (data) => {
        const newRoom = {
            roomId: data.roomId,
            customerId: data.customerId,
            customerName: data.customerName || 'Khách hàng',
            customerEmail: data.customerEmail || 'Chưa có email',
            status: 'waiting',
            lastActivity: new Date().toISOString(),
            messageCount: 0
        };

        setActiveRooms(prev => {
            const exists = prev.some(room => room.roomId === data.roomId);
            if (!exists) {
                return [...prev, newRoom];
            }
            return prev;
        });
    };

    const handleNewMessage = (data) => {
        // Update room info
        setActiveRooms(prev => prev.map(room =>
            room.roomId === data.roomId
                ? {
                    ...room,
                    lastMessage: data.message || data.content,
                    lastActivity: data.timestamp || new Date().toISOString(),
                    messageCount: (room.messageCount || 0) + 1
                }
                : room
        ));

        // If this message is for the selected room, add it to messages
        if (selectedRoom && selectedRoom.roomId === data.roomId) {
            const newMessage = {
                id: data.messageId || data.id || Date.now(),
                type: data.senderType === 'CUSTOMER' ? 'customer' : 'admin',
                content: data.message || data.content,
                timestamp: new Date(data.timestamp),
                sender: data.senderId,
                senderType: data.senderType,
                customerName: data.customerName,
                adminName: data.adminName
            };

            setMessages(prev => {
                if (prev.some(msg => msg.id === newMessage.id)) {
                    return prev;
                }
                return [...prev, newMessage];
            });
        }
    };

    const subscribeToRoom = (roomId) => {
        if (stompClient && stompClient.connected) {
            try {
                // Unsubscribe from previous room if exists
                if (roomSubscriptions.current.has(roomId)) {
                    roomSubscriptions.current.get(roomId).unsubscribe();
                }

                const subscription = stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
                    console.log('💬 Room message received:', message.body);
                    handleRoomMessage(message);
                });

                roomSubscriptions.current.set(roomId, subscription);
                console.log('✅ Subscribed to room:', roomId);
                return subscription;
            } catch (error) {
                console.error('❌ Error subscribing to room:', error);
                return null;
            }
        }
        return null;
    };

    const unsubscribeFromRoom = (roomId) => {
        if (roomSubscriptions.current.has(roomId)) {
            roomSubscriptions.current.get(roomId).unsubscribe();
            roomSubscriptions.current.delete(roomId);
            console.log('✅ Unsubscribed from room:', roomId);
        }
    };

    const handleRoomMessage = (message) => {
        try {
            console.log('💬 Processing room message...');

            let data;
            if (typeof message.body === 'string') {
                data = JSON.parse(message.body);
            } else {
                data = message.body;
            }

            console.log('💬 Parsed room message:', data);

            // Only add to messages if it's for the selected room
            if (selectedRoom && data.roomId === selectedRoom.roomId) {
                const newMessage = {
                    id: data.id || Date.now(),
                    type: data.senderType === 'CUSTOMER' ? 'customer' : 'admin',
                    content: data.content,
                    timestamp: new Date(data.timestamp),
                    sender: data.senderId,
                    senderType: data.senderType,
                    customerName: data.customerName,
                    adminName: data.adminName
                };

                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(msg => msg.id === newMessage.id)) {
                        return prev;
                    }
                    return [...prev, newMessage];
                });
            }

        } catch (error) {
            console.error('❌ Error processing room message:', error);
        }
    };

    const disconnectWebSocket = () => {
        // Unsubscribe from all rooms
        roomSubscriptions.current.forEach((subscription, roomId) => {
            subscription.unsubscribe();
        });
        roomSubscriptions.current.clear();

        if (stompClient) {
            if (stompClient.connected) {
                stompClient.deactivate();
            }
            setStompClient(null);
        }
        setIsConnected(false);
        setConnectionStatus('disconnected');
    };

    const reconnectWebSocket = () => {
        disconnectWebSocket();
        setTimeout(() => {
            connectWebSocket();
        }, 1000);
    };

    const joinRoom = async (room) => {
        console.log('👨‍💼 Admin joining room:', room);
        setSelectedRoom(room);
        setMessages([]);

        // Update room status to active
        setActiveRooms(prev => prev.map(r =>
            r.roomId === room.roomId
                ? { ...r, status: 'active', adminId: adminInfo.id }
                : r
        ));

        // Join room via WebSocket
        if (stompClient && stompClient.connected) {
            try {
                const joinPayload = {
                    roomId: room.roomId,
                    senderId: adminInfo.id,
                    senderType: 'ADMIN',
                    adminName: adminInfo.name
                };

                console.log('🎯 Sending join request:', joinPayload);

                stompClient.publish({
                    destination: '/app/chat.join',
                    body: JSON.stringify(joinPayload)
                });

                // Subscribe to room messages
                subscribeToRoom(room.roomId);

            } catch (error) {
                console.error('❌ Error joining room via WebSocket:', error);
            }
        }

        // Load room history từ API
        await loadRoomHistory(room.roomId);
    };

    const loadRoomHistory = async (roomId) => {
        setLoading(true);
        try {
            console.log(`📡 Loading room history for: ${roomId}`);

            const history = await chatApiService.loadRoomHistory(roomId);
            setMessages(history);
            console.log(`✅ Loaded ${history.length} messages for room: ${roomId}`);

        } catch (error) {
            console.error('❌ Error loading room history:', error);
            // Fallback to empty array
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedRoom) return;

        const messageContent = inputMessage.trim();

        // Add message to UI immediately for better UX
        const tempMessage = {
            id: 'temp_' + Date.now(),
            type: 'admin',
            content: messageContent,
            timestamp: new Date(),
            sender: adminInfo.id,
            adminName: adminInfo.name
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputMessage('');

        // Send via WebSocket
        if (stompClient && stompClient.connected) {
            try {
                const messagePayload = {
                    roomId: selectedRoom.roomId,
                    content: messageContent,
                    senderId: adminInfo.id,
                    senderType: 'ADMIN',
                    adminName: adminInfo.name
                };

                console.log('📤 Sending message via WebSocket:', messagePayload);

                stompClient.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify(messagePayload)
                });

            } catch (error) {
                console.error('❌ Error sending message via WebSocket:', error);
                // Remove temp message if WebSocket fails
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                alert('Lỗi gửi tin nhắn. Vui lòng thử lại.');
            }
        } else {
            console.error('❌ WebSocket not connected');
            // Remove temp message
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            alert('Không có kết nối. Vui lòng kiểm tra kết nối WebSocket.');
        }
    };

    const leaveRoom = () => {
        if (selectedRoom) {
            // Unsubscribe from room
            unsubscribeFromRoom(selectedRoom.roomId);

            // Update room status back to waiting
            setActiveRooms(prev => prev.map(room =>
                room.roomId === selectedRoom.roomId
                    ? { ...room, status: 'waiting', adminId: null }
                    : room
            ));
        }

        setSelectedRoom(null);
        setMessages([]);
    };

    const closeRoom = (roomId, e) => {
        e.stopPropagation();

        // Unsubscribe from room
        unsubscribeFromRoom(roomId);

        // Remove room from list
        setActiveRooms(prev => prev.filter(room => room.roomId !== roomId));

        if (selectedRoom && selectedRoom.roomId === roomId) {
            setSelectedRoom(null);
            setMessages([]);
        }
    };

    const updateStats = () => {
        const waiting = activeRooms.filter(room => room.status === 'waiting').length;
        const active = activeRooms.filter(room => room.status === 'active').length;
        const closed = activeRooms.filter(room => room.status === 'closed').length;

        setStats({
            total: activeRooms.length,
            waiting,
            active,
            closed
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '--:--';
        try {
            if (typeof timestamp === 'string') {
                return new Date(timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            return '--:--';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            if (typeof timestamp === 'string') {
                return new Date(timestamp).toLocaleDateString('vi-VN');
            } else {
                return timestamp.toLocaleDateString('vi-VN');
            }
        } catch (error) {
            return '';
        }
    };

    const getRoomStatus = (room) => {
        let status = room.status || 'waiting';
        if (room.adminId && room.status !== 'closed') {
            status = 'active';
        }

        switch (status) {
            case 'active':
                return { text: 'Đang hỗ trợ', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' };
            case 'waiting':
                return { text: 'Chờ hỗ trợ', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
            case 'closed':
                return { text: 'Đã đóng', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
            default:
                return { text: 'Không xác định', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
        }
    };

    const filteredRooms = activeRooms.filter(room => {
        const matchesSearch =
            room.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.roomId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ||
            room.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const QuickReplies = () => {
        const quickReplies = [
            "Xin chào, tôi có thể giúp gì cho bạn?",
            "Cảm ơn bạn đã liên hệ với TravelGo!",
            "Bạn cần hỗ trợ thông tin gì ạ?",
            "Tôi sẽ kiểm tra và phản hồi bạn ngay.",
            "Bạn vui lòng cung cấp thêm thông tin chi tiết."
        ];

        return (
            <div className="flex flex-wrap gap-2 mb-4">
                {quickReplies.map((reply, index) => (
                    <button
                        key={index}
                        onClick={() => setInputMessage(reply)}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        {reply}
                    </button>
                ))}
            </div>
        );
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return { text: 'Đã kết nối', color: 'text-green-600', bg: 'bg-green-500' };
            case 'connecting': return { text: 'Đang kết nối...', color: 'text-yellow-600', bg: 'bg-yellow-500' };
            case 'error': return { text: 'Lỗi kết nối', color: 'text-red-600', bg: 'bg-red-500' };
            default: return { text: 'Ngắt kết nối', color: 'text-gray-600', bg: 'bg-gray-500' };
        }
    };

    const connectionStatusInfo = getConnectionStatusText();

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b p-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <MessageCircle className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Quản lý Chat - TravelGo</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className={`w-2 h-2 rounded-full ${connectionStatusInfo.bg}`}></div>
                                <span className={connectionStatusInfo.color}>{connectionStatusInfo.text}</span>
                                <span>•</span>
                                <span>{stats.total} phòng chat</span>
                                {connectionStatus === 'error' && (
                                    <button
                                        onClick={reconnectWebSocket}
                                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} />
                                        Thử lại
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {adminInfo.name} • {adminInfo.role}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="bg-white border rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <div className="text-sm text-gray-600">Tổng số phòng</div>
                    </div>
                    <div className="bg-white border rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
                        <div className="text-sm text-gray-600">Chờ hỗ trợ</div>
                    </div>
                    <div className="bg-white border rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <div className="text-sm text-gray-600">Đang hỗ trợ</div>
                    </div>
                    <div className="bg-white border rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                        <div className="text-sm text-gray-600">Đã đóng</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Room List */}
                <div className="w-96 bg-white border-r flex flex-col">
                    {/* Search and Filter */}
                    <div className="p-4 border-b space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm phòng chat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="waiting">Chờ hỗ trợ</option>
                                <option value="active">Đang hỗ trợ</option>
                                <option value="closed">Đã đóng</option>
                            </select>
                            <button
                                onClick={reconnectWebSocket}
                                className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
                                title="Kết nối lại WebSocket"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button
                                onClick={loadRoomsFromAPI}
                                className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 hover:bg-blue-200 transition-colors"
                                title="Tải lại danh sách phòng"
                            >
                                <RefreshCw size={16} className="text-blue-600" />
                            </button>
                        </div>
                    </div>

                    {/* Room List */}
                    <div className="flex-1 overflow-y-auto">
                        {apiLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-2 text-gray-600">Đang tải danh sách phòng...</span>
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="text-center text-gray-500 p-8">
                                <Users className="mx-auto mb-2 text-gray-400" size={32} />
                                <p>Không có phòng chat nào</p>
                                <p className="text-sm mt-2">Kết nối WebSocket: {connectionStatus}</p>
                                <button
                                    onClick={loadRoomsFromAPI}
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Tải lại danh sách
                                </button>
                            </div>
                        ) : (
                            filteredRooms.map((room) => {
                                const status = getRoomStatus(room);
                                const isSelected = selectedRoom?.roomId === room.roomId;

                                return (
                                    <div
                                        key={room.roomId}
                                        onClick={() => joinRoom(room)}
                                        className={`p-4 border-b cursor-pointer transition-colors ${
                                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                {room.customerName || 'Khách hàng'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.textColor}`}>
                                                    {status.text}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                            <Mail size={12} />
                                            <span className="truncate">{room.customerEmail || 'Chưa có email'}</span>
                                        </div>

                                        {room.lastMessage && (
                                            <div className="text-sm text-gray-500 truncate mb-2">
                                                {room.lastMessage}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>
                                                    {room.lastActivity
                                                        ? `${formatDate(room.lastActivity)} ${formatTime(room.lastActivity)}`
                                                        : 'Chưa có hoạt động'
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {room.messageCount > 0 && (
                                                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs min-w-6 text-center">
                                                        {room.messageCount}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => closeRoom(room.roomId, e)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Đóng phòng"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <User className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-800">
                                                {selectedRoom.customerName || 'Khách hàng'}
                                            </h2>
                                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                                <Mail size={12} />
                                                <span>{selectedRoom.customerEmail || 'Chưa có email'}</span>
                                                <span>•</span>
                                                <span className="font-mono text-xs">ID: {selectedRoom.roomId?.substring(0, 8)}...</span>
                                                <span>•</span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getRoomStatus(selectedRoom).bgColor} ${getRoomStatus(selectedRoom).textColor}`}>
                                                    {getRoomStatus(selectedRoom).text}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                                            <Eye size={18} />
                                        </button>
                                        <button className="text-gray-500 hover:text-gray-700 transition-colors p-2">
                                            <Archive size={18} />
                                        </button>
                                        <button
                                            onClick={leaveRoom}
                                            className="text-gray-500 hover:text-red-500 transition-colors p-2"
                                            title="Rời phòng chat"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {loading ? (
                                    <div className="flex justify-center items-center h-20">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-gray-600">Đang tải tin nhắn...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">
                                                <MessageCircle className="mx-auto mb-2 text-gray-400" size={32} />
                                                <p>Chưa có tin nhắn nào</p>
                                                <p className="text-sm">Bắt đầu cuộc trò chuyện với khách hàng</p>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div key={message.id} className={`flex ${message.type === 'admin' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'}`}>
                                                    {message.type === 'system' ? (
                                                        <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm text-center">
                                                            {message.content}
                                                        </div>
                                                    ) : (
                                                        <div className={`max-w-[70%] ${message.type === 'admin' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'} rounded-2xl px-4 py-2 ${message.type === 'admin' ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm`}>
                                                            <div className="text-sm whitespace-pre-wrap">
                                                                {message.content}
                                                            </div>
                                                            <div className={`text-xs mt-1 ${message.type === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                {formatTime(message.timestamp)}
                                                                {message.type === 'admin' && message.adminName && ` • ${message.adminName}`}
                                                                {message.type === 'customer' && message.customerName && ` • ${message.customerName}`}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Quick Replies */}
                            {selectedRoom && <QuickReplies />}

                            {/* Input Area */}
                            <div className="bg-white border-t p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={isConnected ? "Nhập tin nhắn hỗ trợ..." : "Đang kết nối..."}
                                        disabled={!isConnected}
                                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || !isConnected}
                                        className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center text-gray-500">
                                <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                                <h3 className="text-lg font-medium mb-2">Chọn một phòng chat</h3>
                                <p>Chọn phòng chat từ danh sách bên trái để bắt đầu hỗ trợ khách hàng</p>
                                <div className="mt-4 text-sm text-gray-400">
                                    <p>• Hiện có {stats.waiting} phòng đang chờ hỗ trợ</p>
                                    <p>• {stats.active} phòng đang được hỗ trợ</p>
                                    <p>• Trạng thái kết nối: {connectionStatusInfo.text}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Status */}
            <div className="bg-white border-t px-4 py-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                        <span>Trạng thái: <span className={connectionStatusInfo.color}>{connectionStatusInfo.text}</span></span>
                        <span>Tổng số phòng: {stats.total}</span>
                        <span>Đang hỗ trợ: {stats.active}</span>
                        <span>Chờ hỗ trợ: {stats.waiting}</span>
                    </div>
                    <div>
                        {selectedRoom ? `Đang hỗ trợ: ${selectedRoom.customerName}` : 'Chưa chọn phòng'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChatDashboard;
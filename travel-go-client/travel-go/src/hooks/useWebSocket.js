import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [activeChats, setActiveChats] = useState([]);
    const [activeRooms, setActiveRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const clientRef = useRef(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            debug: function(str) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('STOMP: ' + str);
                }
            },

            onConnect: () => {
                console.log('✅ WebSocket connected successfully');
                setIsConnected(true);

                // Subscribe to admin dashboard
                client.subscribe('/topic/admin/dashboard', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log('📨 Admin dashboard message:', data);
                        handleAdminMessage(data);
                    } catch (error) {
                        console.error('❌ Error parsing admin message:', error);
                    }
                });

                // Subscribe to ALL room messages
                client.subscribe('/topic/room/+', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log('💬 Room message received:', {
                            roomId: data.roomId,
                            content: data.content,
                            senderType: data.senderType
                        });
                        handleRoomMessage(data);
                    } catch (error) {
                        console.error('❌ Error parsing room message:', error);
                    }
                });

                // Join admin dashboard
                joinAdminDashboard();
            },

            onStompError: (frame) => {
                console.error('💥 STOMP error:', frame);
                setIsConnected(false);
            },

            onWebSocketClose: () => {
                console.log('🔌 WebSocket closed');
                setIsConnected(false);
            },

            onDisconnect: () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);
            }
        });

        clientRef.current = client;
        client.activate();

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const handleAdminMessage = (data) => {
        switch(data.type) {
            case 'ACTIVE_ROOMS':
                console.log('🔄 Active rooms updated:', data.rooms?.length || 0);
                const rooms = data.rooms || [];
                setActiveRooms(rooms);

                // Convert active rooms to active chats format
                const chats = rooms.map(room => ({
                    id: room.roomId,
                    roomId: room.roomId,
                    contactId: room.contactId || extractContactIdFromRoom(room.roomId),
                    customerName: room.customerName || 'Khách hàng',
                    customerEmail: room.customerEmail || 'customer@example.com',
                    status: "ACTIVE",
                    unreadCount: 0,
                    lastMessage: `Có ${room.messageCount || 0} tin nhắn`,
                    lastActivity: room.lastActivity || new Date().toISOString(),
                    isOnline: room.isActive || room.customerCount > 0
                }));
                setActiveChats(chats);
                break;

            case 'NEW_CUSTOMER':
                console.log('🎯 New customer joined:', data);
                setTimeout(() => getActiveRooms(), 1000);
                break;

            case 'ROOM_CREATED':
                console.log('✅ Room created:', data);
                setTimeout(() => getActiveRooms(), 1000);
                break;

            default:
                console.log('📨 Unknown message type:', data);
        }
    };

    const handleRoomMessage = (data) => {
        console.log('💬 Processing room message for room:', data.roomId);

        // Only process messages for current room
        if (!currentRoom || currentRoom.roomId === data.roomId) {
            setMessages(prev => {
                // Avoid duplicates
                const isDuplicate = prev.some(msg =>
                    msg.id === data.id ||
                    (msg.timestamp === data.timestamp && msg.content === data.content && msg.senderId === data.senderId)
                );

                if (isDuplicate) {
                    return prev;
                }

                return [...prev, data];
            });
        }
    };

    const extractContactIdFromRoom = (roomId) => {
        if (!roomId) return null;

        const patterns = [
            /room_(\d+)_/,
            /customer_(\d+)_/,
            /admin_(\d+)_/,
            /room_(\d+)/,
            /customer_(\d+)/,
            /admin_(\d+)/,
            /user_(\d+)_/
        ];

        for (const pattern of patterns) {
            const match = roomId.match(pattern);
            if (match && match[1]) return match[1];
        }

        return null;
    };

    const joinAdminDashboard = () => {
        if (!clientRef.current || !isConnected) return;

        try {
            clientRef.current.publish({
                destination: '/app/chat.join',
                body: JSON.stringify({
                    roomId: 'admin-dashboard',
                    senderId: 'admin',
                    senderType: 'ADMIN',
                    content: 'Admin joined dashboard',
                    adminName: 'Quản trị viên'
                })
            });
        } catch (error) {
            console.error('❌ Error joining admin dashboard:', error);
        }
    };

    const getActiveRooms = () => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            clientRef.current.publish({
                destination: '/app/chat.admin.rooms'
            });
            console.log('🔄 Requesting active rooms...');
            return true;
        } catch (error) {
            console.error('💥 Error getting active rooms:', error);
            return false;
        }
    };

    const createRoom = (contactId, customerName, customerEmail) => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return null;
        }

        try {
            const roomId = `room_${contactId}_${Date.now()}`;

            clientRef.current.publish({
                destination: '/app/chat.createRoom',
                body: JSON.stringify({
                    roomId: roomId,
                    contactId: contactId.toString(),
                    customerName: customerName,
                    customerEmail: customerEmail,
                    createdBy: 'admin'
                })
            });

            console.log('🆕 Creating room:', roomId);
            return roomId;

        } catch (error) {
            console.error('💥 Error creating room:', error);
            return null;
        }
    };

    const joinRoom = (roomId, userType = 'ADMIN', userId = 'admin') => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            console.log('🎯 Joining room:', roomId);

            // Join room
            clientRef.current.publish({
                destination: '/app/chat.join',
                body: JSON.stringify({
                    roomId: roomId,
                    senderId: userId,
                    senderType: userType,
                    content: `${userType} joined the room`,
                    adminName: 'Quản trị viên'
                })
            });

            // Set current room and clear old messages
            setCurrentRoom({
                roomId: roomId,
                userType: userType,
                userId: userId
            });

            // Clear messages when joining new room
            setMessages([]);

            console.log('✅ Successfully joined room:', roomId);
            return true;

        } catch (error) {
            console.error('💥 Error joining room:', error);
            return false;
        }
    };

    const joinCustomerRoom = (roomId, customerId, customerName, customerEmail) => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            clientRef.current.publish({
                destination: '/app/chat.admin.join',
                body: JSON.stringify({
                    roomId: roomId,
                    customerId: customerId,
                    customerName: customerName,
                    customerEmail: customerEmail,
                    agentId: 'admin',
                    agentName: 'Quản trị viên',
                    timestamp: new Date().toISOString()
                })
            });

            console.log('✅ Admin join request sent for room:', roomId);
            return true;

        } catch (error) {
            console.error('💥 Error joining customer room:', error);
            return false;
        }
    };

    const leaveRoom = (roomId, userType = 'ADMIN', userId = 'admin') => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            // Send leave message
            clientRef.current.publish({
                destination: '/app/chat.leave',
                body: JSON.stringify({
                    roomId: roomId,
                    senderId: userId,
                    senderType: userType,
                    content: `${userType} left the room`
                })
            });

            // Clear current room
            if (currentRoom && currentRoom.roomId === roomId) {
                setCurrentRoom(null);
                setMessages([]);
            }

            console.log('🚪 Successfully left room:', roomId);
            return true;

        } catch (error) {
            console.error('💥 Error leaving room:', error);
            return false;
        }
    };

    const sendMessage = (messageData) => {
        if (!clientRef.current || !isConnected) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            const fullMessageData = {
                ...messageData,
                timestamp: new Date().toISOString(),
                id: Date.now()
            };

            clientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(fullMessageData)
            });

            // Add message to local state immediately
            setMessages(prev => [...prev, {
                ...fullMessageData,
                senderType: messageData.senderType || 'ADMIN',
                adminName: 'Quản trị viên'
            }]);

            console.log('📤 Message sent to room:', messageData.roomId);
            return true;

        } catch (error) {
            console.error('💥 Error sending message:', error);
            return false;
        }
    };

    return {
        isConnected,
        sendMessage,
        joinRoom,
        leaveRoom,
        createRoom,
        joinCustomerRoom,
        getActiveRooms,
        messages,
        activeChats,
        activeRooms,
        currentRoom
    };
};

export { useWebSocket };
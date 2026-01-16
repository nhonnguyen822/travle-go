import React, { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const AdminChat = () => {
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [adminName, setAdminName] = useState('Quản trị viên')
    const [connected, setConnected] = useState(false)
    const messagesEndRef = useRef(null)
    const clientRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Admin connected to WebSocket')
                setConnected(true)

                // Subscribe to session updates
                client.subscribe('/topic/admin/sessions', (message) => {
                    const sessionsData = JSON.parse(message.body)
                    setSessions(sessionsData)
                })

                // Load initial sessions
                fetchSessions()
            },
            onDisconnect: () => {
                console.log('Admin disconnected from WebSocket')
                setConnected(false)
            }
        })

        client.activate()
        clientRef.current = client

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate()
            }
        }
    }, [])

    const fetchSessions = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/admin/sessions')
            if (response.ok) {
                const sessionsData = await response.json()
                setSessions(sessionsData)
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
        }
    }

    const selectSession = async (session) => {
        if (selectedSession?.sessionId === session.sessionId) return

        setSelectedSession(session)
        setMessages([])

        if (clientRef.current) {
            // Subscribe to selected session
            clientRef.current.subscribe(
                `/topic/chat/${session.sessionId}`,
                (message) => {
                    const newMessage = JSON.parse(message.body)
                    setMessages(prev => [...prev, { ...newMessage, id: Date.now() + Math.random() }])
                }
            )

            // Notify admin join
            clientRef.current.publish({
                destination: '/app/chat.adminJoin',
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    adminName: adminName
                })
            })
        }
    }

    const sendMessage = () => {
        if (inputMessage.trim() && selectedSession && clientRef.current) {
            const chatMessage = {
                sessionId: selectedSession.sessionId,
                sender: adminName,
                content: inputMessage.trim(),
                type: 'ADMIN',
                timestamp: new Date().toISOString()
            }

            clientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(chatMessage)
            })

            // Add message to local state immediately
            setMessages(prev => [...prev, { ...chatMessage, id: Date.now() }])
            setInputMessage('')
        }
    }

    const endSession = () => {
        if (selectedSession && clientRef.current) {
            clientRef.current.publish({
                destination: '/app/chat.endSession',
                body: JSON.stringify({
                    sessionId: selectedSession.sessionId
                })
            })
            setSelectedSession(null)
            setMessages([])
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            WAITING: { label: '🕒 Đang chờ', className: 'bg-yellow-100 text-yellow-800' },
            ACTIVE: { label: '💬 Đang chat', className: 'bg-green-100 text-green-800' },
            ADMIN_JOINED: { label: '👨‍💼 Đang trả lời', className: 'bg-blue-100 text-blue-800' },
            RESOLVED: { label: '✅ Đã xong', className: 'bg-gray-100 text-gray-800' }
        }

        const config = statusConfig[status] || statusConfig.WAITING
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        )
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleDateString('vi-VN')
    }

    const getSessionDuration = (startTime) => {
        if (!startTime) return ''
        const start = new Date(startTime)
        const now = new Date()
        const diffMs = now - start
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 60) {
            return `${diffMins} phút`
        } else {
            const hours = Math.floor(diffMins / 60)
            const mins = diffMins % 60
            return `${hours}h${mins}p`
        }
    }

    return (
        <div className="h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-96 bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
                    <div className="flex items-center justify-between">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            connected ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                            {connected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
                        </div>
                        <div className="text-sm bg-blue-500 px-3 py-1 rounded-full">
                            {sessions.length} phiên
                        </div>
                    </div>
                    <div className="mt-4">
                        <input
                            type="text"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            placeholder="Tên quản trị viên"
                            className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4 text-lg">
                            Phiên chat đang hoạt động
                        </h3>

                        {sessions.length === 0 ? (
                            <div className="text-center text-gray-500 py-12">
                                <div className="text-6xl mb-4">💭</div>
                                <p className="font-medium">Chưa có phiên chat nào</p>
                                <p className="text-sm mt-1">Khách hàng sẽ xuất hiện ở đây</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map(session => (
                                    <div
                                        key={session.sessionId}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                            selectedSession?.sessionId === session.sessionId
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                        onClick={() => selectSession(session)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-gray-800 truncate">
                                                {session.displayName}
                                            </div>
                                            {getStatusBadge(session.status)}
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <div>Bắt đầu: {formatTime(session.startTime)}</div>
                                            <div>Hoạt động: {formatTime(session.lastActivity)}</div>
                                            <div className="font-medium text-green-600">
                                                Đã {getSessionDuration(session.startTime)}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 font-mono">
                                            ID: {session.sessionId.substring(0, 10)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Chat với {selectedSession.displayName}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Phiên bắt đầu lúc {formatTime(selectedSession.startTime)} •
                                        ID: {selectedSession.sessionId}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {getStatusBadge(selectedSession.status)}
                                    <button
                                        onClick={endSession}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                    >
                                        Kết thúc
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50 p-6">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-16">
                                    <div className="text-6xl mb-4">💬</div>
                                    <p className="text-lg font-medium">Bắt đầu cuộc trò chuyện</p>
                                    <p className="text-sm mt-1">Gửi lời chào đến khách hàng</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === adminName ? 'justify-end' : 'justify-start'} message-animation`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                                    msg.sender === adminName
                                                        ? 'bg-blue-500 text-white rounded-br-none'
                                                        : msg.type === 'SYSTEM'
                                                            ? 'bg-yellow-500 text-white rounded-bl-none'
                                                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                                                }`}
                                            >
                                                <div className="font-semibold text-xs opacity-90 mb-1">
                                                    {msg.sender}
                                                </div>
                                                <div className="text-sm">{msg.content}</div>
                                                <div
                                                    className={`text-xs mt-2 ${
                                                        msg.sender === adminName ? 'text-blue-100' :
                                                            msg.type === 'SYSTEM' ? 'text-yellow-100' : 'text-gray-500'
                                                    } opacity-70 text-right`}
                                                >
                                                    {formatTime(msg.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Container */}
                        <div className="bg-white border-t border-gray-200 p-6">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Nhập tin nhắn hỗ trợ khách hàng..."
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim()}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        Gửi
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    Nhấn Enter để gửi • Hỗ trợ chuyên nghiệp và thân thiện
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="text-8xl mb-6">👨‍💼</div>
                            <h3 className="text-2xl font-bold mb-4">Chào mừng đến Admin Chat</h3>
                            <p className="text-lg mb-2">Chọn một phiên chat từ danh sách bên trái</p>
                            <p className="text-sm text-gray-400">
                                Hiện có <span className="font-bold text-blue-600">{sessions.length}</span> phiên đang chờ
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminChat
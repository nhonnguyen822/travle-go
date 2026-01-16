// components/ChatNotificationWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../../context/api";

export default function ChatNotificationWidget({ roomId = "room1" }) {
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);
    const messagesEndRef = useRef(null);

    const currentUserId = localStorage.getItem("userId") || "test-user";
    const token = localStorage.getItem("token");

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // === WebSocket setup ===
    useEffect(() => {
        console.log("🔗 Connecting WebSocket...");

        const socket = new SockJS(`${process.env.REACT_APP_BACKEND_URL}/ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : "",
            },
            onConnect: () => {
                console.log("✅ Connected WebSocket!");
                setIsConnected(true);

                // Subscribe vào room
                client.subscribe(`/topic/chat/${roomId}`, (msg) => {
                    const body = JSON.parse(msg.body);
                    console.log("📩 Received message:", body);
                    setMessages((prev) => [...prev, body]);
                });

                // Subscribe vào user queue (nếu cần)
                client.subscribe(`/user/queue/notifications`, (msg) => {
                    console.log("🔔 Personal notification:", msg.body);
                });
            },
            onStompError: (frame) => {
                console.error("❌ Broker error:", frame.headers["message"]);
                setIsConnected(false);
            },
            onDisconnect: () => {
                console.log("🔴 WebSocket disconnected");
                setIsConnected(false);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            console.log("🧹 Cleaning up WebSocket...");
            client.deactivate();
        };
    }, [roomId, token]);

    // === Fetch notifications từ API ===
    useEffect(() => {
        api.get("/api/notifications")
            .then((res) => {
                console.log("📋 Notifications loaded:", res.data);
                setNotifications(res.data);
            })
            .catch((err) => {
                console.error("❌ Error fetching notifications:", err.response?.data || err);
            });
    }, []);

    // === Send message ===
    const sendMessage = () => {
        if (!input.trim()) return;

        const msg = {
            roomId,
            senderId: currentUserId,
            senderType: "CUSTOMER",
            content: input,
            timestamp: new Date().toISOString(),
        };

        console.log("📤 Sending message:", msg);

        if (clientRef.current && isConnected) {
            clientRef.current.publish({
                destination: "/app/chat.send",
                body: JSON.stringify(msg),
            });

            setInput("");
        } else {
            console.error("❌ WebSocket not connected");
        }
    };

    return (
        <div style={{
            width: 350,
            border: "1px solid #ccc",
            padding: 10,
            borderRadius: 8,
            backgroundColor: "white"
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Chat Room: {roomId}</h3>
                <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: isConnected ? 'green' : 'red'
                }} />
            </div>

            {/* Messages Area */}
            <div
                style={{
                    height: 200,
                    overflowY: "auto",
                    border: "1px solid #eee",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 4,
                }}
            >
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        style={{
                            textAlign: m.senderId === currentUserId ? "right" : "left",
                            marginBottom: 8,
                        }}
                    >
                        <div style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: 12,
                            backgroundColor: m.senderId === currentUserId ? '#007bff' : '#f1f1f1',
                            color: m.senderId === currentUserId ? 'white' : 'black',
                            maxWidth: '80%'
                        }}>
                            <strong>{m.senderId}: </strong>
                            {m.content}
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#666', marginTop: 2 }}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: 4
                    }}
                    placeholder="Type message..."
                    disabled={!isConnected}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isConnected ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: isConnected ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!isConnected}
                >
                    Send
                </button>
            </div>

            {/* Notifications */}
            <h4 style={{ marginTop: 15, marginBottom: 8 }}>Notifications</h4>
            <div
                style={{
                    height: 100,
                    overflowY: "auto",
                    border: "1px solid #eee",
                    padding: 10,
                    borderRadius: 4,
                }}
            >
                {notifications.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center' }}>No notifications</p>
                ) : (
                    notifications.map((n, idx) => (
                        <div key={idx} style={{
                            marginBottom: 6,
                            padding: '4px 8px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: 4,
                            borderLeft: `3px solid ${n.type === 'message' ? '#007bff' : '#28a745'}`
                        }}>
                            {n.content}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
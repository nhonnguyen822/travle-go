// hooks/useChatCore.js
import { useState, useEffect, useRef } from "react";
import chatAPI from "../service/ChatAPI";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function useChatCore({ roomId, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const stompClient = useRef(null);

    // load messages
    useEffect(() => {
        if (!roomId) return;

        setIsLoading(true);
        chatAPI
            .getMessages(roomId)
            .then((res) => setMessages(res.data))
            .finally(() => setIsLoading(false));
    }, [roomId]);

    // websocket connect
    useEffect(() => {
        if (!roomId) return;

        const socket = new SockJS("/ws");
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            client.subscribe(`/topic/room/${roomId}`, (message) => {
                const body = JSON.parse(message.body);
                setMessages((prev) => [...prev, body]);
            });
        };

        client.activate();
        stompClient.current = client;

        return () => client.deactivate();
    }, [roomId]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;
        setIsSending(true);

        stompClient.current.publish({
            destination: `/app/send/${roomId}`,
            body: JSON.stringify({
                content: text,
                sender: currentUser.email,
                displayName: currentUser.name,
            }),
        });

        setIsSending(false);
    };

    return {
        messages,
        sendMessage,
        isLoading,
        isSending,
        showScrollToBottom,
        messagesEndRef,
        messagesContainerRef,
    };
}

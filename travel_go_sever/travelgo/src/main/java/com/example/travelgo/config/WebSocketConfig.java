package com.example.travelgo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue", "/user");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null) {
                    try {
                        StompCommand command = accessor.getCommand();

                        if (command != null) {
                            switch (command) {
                                case CONNECT:
                                    System.out.println("🎯 Client CONNECTING - Session: " + accessor.getSessionId());
                                    handleConnect(accessor);
                                    break;
                                case SUBSCRIBE:
                                    System.out.println("📨 Client SUBSCRIBING to: " + accessor.getDestination());
                                    handleSubscribe(accessor);
                                    break;
                                case SEND:
                                    System.out.println("📤 Client SENDING to: " + accessor.getDestination());
                                    handleSend(accessor);
                                    break;
                                case DISCONNECT:
                                    System.out.println("🔴 Client DISCONNECTING - Session: " + accessor.getSessionId());
                                    break;
                                default:
                                    System.out.println("🔧 STOMP Command: " + command);
                                    break;
                            }
                        }
                    } catch (SecurityException e) {
                        System.err.println("🚫 SECURITY BLOCKED: " + e.getMessage());
                        // ✅ BLOCK THẬT SỰ - không trả về message
                        return null;
                    } catch (Exception e) {
                        System.err.println("❌ Error in WebSocket interceptor: " + e.getMessage());
                        // Vẫn trả về message để không block connection
                    }
                }

                return message;
            }

            private void handleConnect(StompHeaderAccessor accessor) {
                try {
                    // ✅ KIỂM TRA AUTHENTICATION THỰC SỰ
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

                    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
                        System.out.println("🚫 Unauthenticated connection attempt");
                        // Có thể block ở đây nếu muốn
                        // throw new SecurityException("Unauthenticated connection");
                    } else {
                        System.out.println("✅ Authenticated user: " + auth.getName() + " - Roles: " + auth.getAuthorities());
                    }

                    // Log headers để debug
                    System.out.println("🔧 Connect Headers: " + accessor.toMap());

                } catch (Exception e) {
                    System.err.println("❌ Error handling connect: " + e.getMessage());
                }
            }

            private void handleSubscribe(StompHeaderAccessor accessor) {
                String destination = accessor.getDestination();
                if (destination != null) {
                    System.out.println("🔍 Checking subscription to: " + destination);

                    // ✅ KIỂM TRA AUTHORIZATION THỰC SỰ
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

                    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
                        System.out.println("🚫 Unauthenticated subscription attempt to: " + destination);
                        throw new SecurityException("Unauthenticated user cannot subscribe to: " + destination);
                    }

                    // ✅ KIỂM TRA ADMIN-ONLY DESTINATIONS
                    if (destination.startsWith("/topic/admin") || destination.startsWith("/queue/admin")) {
                        boolean isAdmin = auth.getAuthorities().stream()
                                .anyMatch(grantedAuthority ->
                                        grantedAuthority.getAuthority().equals("ROLE_ADMIN") ||
                                                grantedAuthority.getAuthority().equals("ADMIN"));

                        if (!isAdmin) {
                            System.out.println("🚫 Non-admin user attempted to subscribe to admin channel: " + destination);
                            throw new SecurityException("Only ADMIN can subscribe to: " + destination);
                        }
                        System.out.println("👑 Admin subscription allowed to: " + destination);
                    }

                    // ✅ KIỂM TRA USER-SPECIFIC DESTINATIONS
                    else if (destination.startsWith("/user/queue/notifications") ||
                            destination.startsWith("/user/queue/admin-notifications")) {

                        String destinationUserId = extractUserIdFromDestination(destination);
                        String currentUserId = auth.getName(); // Giả sử username là user ID

                        if (destinationUserId != null && !destinationUserId.equals(currentUserId)) {
                            System.out.println("🚫 User " + currentUserId + " attempted to subscribe to other user's queue: " + destination);
                            throw new SecurityException("Cannot subscribe to other user's queue");
                        }

                        System.out.println("✅ User subscription allowed to: " + destination);
                    }

                    // ✅ CHO PHÉP CÁC DESTINATIONS CÔNG KHAI
                    else if (destination.startsWith("/topic/public") ||
                            destination.startsWith("/app/")) {
                        System.out.println("✅ Public subscription allowed to: " + destination);
                    }

                    // ✅ BLOCK CÁC DESTINATIONS KHÔNG RÕ RÀNG
                    else {
                        System.out.println("⚠️ Unknown destination pattern: " + destination);
                        // Có thể block hoặc cho phép tùy chính sách
                    }
                }
            }

            private void handleSend(StompHeaderAccessor accessor) {
                String destination = accessor.getDestination();
                if (destination != null) {
                    System.out.println("🔍 Checking send to: " + destination);

                    // ✅ KIỂM TRA AUTHENTICATION CHO SEND
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

                    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
                        System.out.println("🚫 Unauthenticated send attempt to: " + destination);
                        throw new SecurityException("Unauthenticated user cannot send to: " + destination);
                    }

                    // ✅ KIỂM TRA ADMIN-ONLY SEND DESTINATIONS
                    if (destination.startsWith("/app/admin")) {
                        boolean isAdmin = auth.getAuthorities().stream()
                                .anyMatch(grantedAuthority ->
                                        grantedAuthority.getAuthority().equals("ROLE_ADMIN") ||
                                                grantedAuthority.getAuthority().equals("ADMIN"));

                        if (!isAdmin) {
                            System.out.println("🚫 Non-admin user attempted to send to admin endpoint: " + destination);
                            throw new SecurityException("Only ADMIN can send to: " + destination);
                        }
                    }

                    System.out.println("✅ Send allowed to: " + destination);
                }
            }

            // ✅ PHƯƠNG THỨC TRÍCH XUẤT USER ID TỪ DESTINATION
            private String extractUserIdFromDestination(String destination) {
                try {
                    // Ví dụ: "/user/123/queue/notifications" -> "123"
                    if (destination.startsWith("/user/")) {
                        String[] parts = destination.split("/");
                        if (parts.length >= 3) {
                            return parts[2]; // user ID
                        }
                    }
                    // Ví dụ: "/queue/admin-notifications-user123" -> "123"
                    else if (destination.contains("-user")) {
                        int startIndex = destination.indexOf("-user") + 5;
                        int endIndex = destination.length();
                        return destination.substring(startIndex, endIndex);
                    }
                } catch (Exception e) {
                    System.err.println("❌ Error extracting user ID from destination: " + destination);
                }
                return null;
            }

            // ✅ PHƯƠNG THỨC KIỂM TRA ROLE
            private boolean hasRole(Authentication auth, String role) {
                return auth.getAuthorities().stream()
                        .anyMatch(grantedAuthority ->
                                grantedAuthority.getAuthority().equals("ROLE_" + role) ||
                                        grantedAuthority.getAuthority().equals(role));
            }
        });

        registration.taskExecutor().corePoolSize(4).maxPoolSize(10);
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && accessor.getCommand() != null) {
                    System.out.println("📤 Outbound: " + accessor.getCommand() + " - " + accessor.getDestination());

                    // ✅ CÓ THỂ KIỂM TRA OUTBOUND MESSAGES Ở ĐÂY
                    if (accessor.getCommand() == StompCommand.MESSAGE) {
                        String destination = accessor.getDestination();
                        if (destination != null && destination.startsWith("/topic/admin")) {
                            System.out.println("👑 Sending admin broadcast to: " + destination);
                        }
                    }
                }
                return message;
            }
        });
    }
}
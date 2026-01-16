package com.example.travelgo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketAuthorizationConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
//                // ✅ CHO PHÉP KẾT NỐI WEBSOCKET MÀ KHÔNG CẦN AUTH
//                .simpTypeMatchers(
//                        org.springframework.messaging.simp.stomp.StompHeaders.CONNECT,
//                        org.springframework.messaging.simp.stomp.StompHeaders.DISCONNECT
//                ).permitAll()

                .simpDestMatchers("/topic/public/**", "/topic/chat/**").permitAll()

                .simpDestMatchers("/topic/admin/**", "/queue/admin/**").hasAuthority("ADMIN")

                .simpDestMatchers("/user/queue/**", "/queue/notifications").authenticated()

                .simpDestMatchers("/app/chat.send").authenticated()

                .anyMessage().permitAll();
    }

    @Override
    protected boolean sameOriginDisabled() {
        return true; // ✅ CHO PHÉP CORS CHO WEBSOCKET
    }
}
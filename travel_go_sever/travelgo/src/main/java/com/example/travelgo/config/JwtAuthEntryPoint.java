package com.example.travelgo.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // Nếu request là /api/auth/login thì KHÔNG ghi đè response
        if (request.getRequestURI().contains("/api/auth/login")) {
            return; // để controller handle
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String json = "{\"error\": \"Unauthorized\", \"message\": \"Token invalid or expired\"}";
        response.getWriter().write(json);
    }
}
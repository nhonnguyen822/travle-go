package com.example.travelgo.config;

import com.example.travelgo.filter.JwtAuthenticationFilter;
import com.example.travelgo.oauth2.CustomOAuth2SuccessHandler;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    @Order(3)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**",
                                "/api/tours/**", "/api/payment/vn-pay-callback","/api/regions/**",
                                "/api/tours/region/**","/api/mail/**","/api/geo/**","/api/upload/**",
                                "/api/schedules/**","/api/service-tour/**","/api/policies/**","/ws/**",
                                "/topic/**", "/queue/**", "/user/**", "/app/**").permitAll()
                        .requestMatchers("/api/user/**", "/api/transactions","/api/bookings/**").hasAnyAuthority("USER", "ADMIN")
                        .requestMatchers("/api/admin/**","/api/notifications/**").hasAuthority("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(jwtAuthEntryPoint))

                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, resp, auth) -> {
                            Cookie cookie = new Cookie("jwt", "");
                            cookie.setMaxAge(0);
                            cookie.setHttpOnly(true);
                            cookie.setPath("/");
                            resp.addCookie(cookie);
                            resp.setStatus(HttpServletResponse.SC_OK);
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ✅ Cấu hình CORS cho phép frontend gửi cookie JWT
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(frontendUrl)); // domain frontend// domain frontend
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true); // <--- QUAN TRỌNG
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    @Order(1) // ⚠️ Ưu tiên cao hơn filter chain mặc định (JWT)
    public SecurityFilterChain oauth2LoginFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/oauth2/authorization/**", "/login/oauth2/code/**")
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())

                // ⚙️ Cấu hình OAuth2 login
                .oauth2Login(oauth -> oauth
                        .successHandler(customOAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            String errorMessage = "oauth_error";
                            if (exception instanceof OAuth2AuthenticationException) {
                                errorMessage = "cancelled"; // user cancel login
                            }
                            response.sendRedirect(frontendUrl + "/login?error=" + errorMessage);
                        })
                );

        return http.build();
    }

}

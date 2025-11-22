package com.example.travelgo.controller.auth;


import com.example.travelgo.entity.Role;
import com.example.travelgo.entity.User;
import com.example.travelgo.entity.UserToken;
import com.example.travelgo.jwt.request.LoginRequest;
import com.example.travelgo.jwt.request.RegisterRequest;
import com.example.travelgo.jwt.service.JwtService;
import com.example.travelgo.service.IRoleService;
import com.example.travelgo.service.IUserService;
import com.example.travelgo.service.IUserTokenService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final IUserService userService;
    private final IRoleService roleService;
    private final IUserTokenService userTokenService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;


    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userService.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email này đã được sử dụng"));
        }
        Role userRole = roleService.findByName("USER")
                .orElseGet(() -> roleService.save(new Role(null, "USER")));
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        user.setName(req.getName());
        user.setStatus(true);
        user.setRole(userRole);
        user.setEmailVerification(false);
        userService.register(user);

        return ResponseEntity.ok(Map.of("message", "Đăng ký thành công"));
    }

    @GetMapping("/email-verification")
    public ResponseEntity<?> emailVerification(@RequestParam("token") String token) {
        Optional<UserToken> userTokenOpt = userTokenService.findByToken(token);
        if (userTokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Token không tồn tại"));
        }
        UserToken userToken = userTokenOpt.get();

        if (!userToken.getStatus() || userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Token đã hết hạn hoặc không hợp lệ"));
        }

        try {
            User user = userToken.getUser();
            user.setEmailVerification(true);

            // Vô hiệu hoá token sau khi sử dụng
            userToken.setStatus(false);
            userTokenService.save(userToken);

            return ResponseEntity.ok(Map.of("success", true, "message", "Xác nhận kích hoạt tài khoản thành công"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Có lỗi xảy ra khi kích hoạt tài khoản"));
        }
    }

    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestParam String token) {
        Optional<UserToken> userToken = userTokenService.findByToken(token);

        if (userToken.isEmpty() || !userToken.get().getStatus() || userToken.get().getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.ok(Map.of("valid", false));
        }

        return ResponseEntity.ok(Map.of("valid", true));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            // Bước 1: Xác thực email + password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            User user = (User) authentication.getPrincipal();

            // Bước 2: Kiểm tra trạng thái tài khoản
            if (!Boolean.TRUE.equals(user.getEmailVerification())
                    && !"ADMIN".equals(user.getRole().getName())) {
                userService.resendEmailVerification(user);
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "error", "EMAIL_NOT_VERIFIED"));
            }

            if (!Boolean.TRUE.equals(user.getStatus())) { // status = false => bị admin khóa
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "error", "ACCOUNT_DISABLED"));
            }


//         Bước 3: Sinh JWT + Cookie
            long maxAge = loginRequest.getRememberMe() ? 30 * 24 * 60 * 60 : 3600;
            String token = jwtService.generateToken(user);

            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    //.secure(true) // bật khi deploy HTTPS
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(maxAge)
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("success", true);
            userInfo.put("email", user.getEmail());
            userInfo.put("fullName", user.getName());
            userInfo.put("avatar", user.getAvatar());
            userInfo.put("role", user.getRole().getName());

            return ResponseEntity.ok(userInfo);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "error", "INVALID_CREDENTIALS"));
        } catch (DisabledException e) {
            // Trường hợp này chỉ xảy ra nếu user.getStatus() = false ngay từ isEnabled()
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "error", "ACCOUNT_DISABLED"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", "SERVER_ERROR"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        System.out.println(auth);
        if (auth == null) return ResponseEntity.status(401).body(Map.of("success", false));
        User user = (User) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("email", user.getEmail());
        response.put("fullName", user.getName());
        response.put("avatar", user.getAvatar());
        response.put("role", user.getRole().getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/google")
    public void googleLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/google");
    }

    @GetMapping("/users/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        try {
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            System.out.println(userOpt.get());
            return new ResponseEntity<>(userOpt.get(), HttpStatus.OK);

        } catch (Exception e) {
            log.error("❌ Lỗi khi tìm user với email {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "Lỗi server khi tìm kiếm user: " + e.getMessage()
                    ));
        }
    }

}

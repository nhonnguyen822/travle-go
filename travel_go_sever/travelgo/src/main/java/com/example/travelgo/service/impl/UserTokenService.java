package com.example.travelgo.service.impl;

import com.example.travelgo.entity.User;
import com.example.travelgo.entity.UserToken;
import com.example.travelgo.enums.TokenType;
import com.example.travelgo.repository.IUserTokenRepository;
import com.example.travelgo.service.IUserTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserTokenService implements IUserTokenService {
    private final IUserTokenRepository userTokenRepository;

    @Override
    public String generateToken(User user, TokenType tokenType) {
        // Hủy những Token cũ nếu đang true
        List<UserToken> activeTokens = userTokenRepository.findAllByUserAndTokenTypeAndStatusIsTrue(user, tokenType);
        for (UserToken token : activeTokens) {
            token.setStatus(false);
        }
        userTokenRepository.saveAll(activeTokens);

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        UserToken userToken = new UserToken();
        // HashToken lưu trong DB
        userToken.setTokenHash(tokenHash);
        userToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        userToken.setStatus(true);
        userToken.setTokenType(tokenType);
        userToken.setUser(user);

        userTokenRepository.save(userToken);

        // RawToken được hiển thị trên url
        return rawToken;
    }

    @Override
    public Optional<UserToken> findByUserAndType(User user, TokenType tokenType) {
        return userTokenRepository.findByUserAndType(user, tokenType);
    }


    @Override
    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Lỗi khi hash token: ", e);
        }
    }
    @Override
    public UserToken save(UserToken userToken) {
        return userTokenRepository.save(userToken);
    }

    @Override
    public Optional<UserToken> findByToken(String token) {
        return userTokenRepository.findByTokenHash(hashToken(token));
    }
}

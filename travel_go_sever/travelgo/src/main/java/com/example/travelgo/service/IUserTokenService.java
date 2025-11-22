package com.example.travelgo.service;

import com.example.travelgo.entity.User;
import com.example.travelgo.entity.UserToken;
import com.example.travelgo.enums.TokenType;

import java.util.Optional;

public interface IUserTokenService {
    UserToken save(UserToken userToken);

    Optional<UserToken> findByToken(String token);

    String hashToken(String token);

    String generateToken(User user, TokenType tokenType);

    Optional<UserToken> findByUserAndType(User user, TokenType tokenType);
}

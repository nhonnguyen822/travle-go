package com.example.travelgo.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class VNPayConfig {
    @Value("${pay.url}")
    private String vnpUrl;

    @Value("${pay.return-url}")
    private String vnpReturnUrl;

    @Value("${pay.tmn-code}")
    private String vnpTmnCode;

    @Value("${pay.secret-key}")
    private String vnpHashSecret;

    @Value("${pay.version}")
    private String vnpVersion;

    @Value("${pay.command}")
    private String vnpCommand;

    @Value("${pay.order-type}")
    private String vnpOrderType;
}

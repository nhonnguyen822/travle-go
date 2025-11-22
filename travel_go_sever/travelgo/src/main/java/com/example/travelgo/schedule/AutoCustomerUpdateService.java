package com.example.travelgo.schedule;

import com.example.travelgo.entity.User;
import com.example.travelgo.enums.CustomerType;
import com.example.travelgo.repository.IBookingRepository;
import com.example.travelgo.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoCustomerUpdateService {

    private final IUserRepository userRepository;
    private final IBookingRepository bookingRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void autoUpdateAllCustomersDaily() {
        List<User> users = userRepository.findAll();
        int updatedCount = 0;
        for (User user : users) {
            BigDecimal totalAmountSpent = bookingRepository.getTotalSpentByUser(user.getId());
            long totalSpentValue = totalAmountSpent != null ? totalAmountSpent.longValue() : 0L;
            CustomerType newCustomerType = determineCustomerType(totalSpentValue);
            CustomerType oldCustomerType = user.getCustomerType();
            if (!oldCustomerType.equals(newCustomerType)) {
                user.setCustomerType(newCustomerType);
                updatedCount++;
                log.info("🎉 Updated user {} from {} to {} (Total spent: {} VND)",
                        user.getName(), oldCustomerType, newCustomerType,
                        String.format("%,d", totalSpentValue));
            }
        }
        userRepository.saveAll(users);
    }

    private int getSpendingLevel(long totalAmountSpent) {
        if (totalAmountSpent >= CustomerType.DIAMOND.getMinTotalSpent()) return 7;
        if (totalAmountSpent >= CustomerType.PLATINUM.getMinTotalSpent()) return 6;
        if (totalAmountSpent >= CustomerType.VIP.getMinTotalSpent()) return 5;
        if (totalAmountSpent >= CustomerType.GOLD.getMinTotalSpent()) return 4;
        if (totalAmountSpent >= CustomerType.SILVER.getMinTotalSpent()) return 3;
        if (totalAmountSpent >= CustomerType.REGULAR.getMinTotalSpent()) return 2;
        return 1;
    }

    private CustomerType determineCustomerType(long totalAmountSpent) {
        return switch (getSpendingLevel(totalAmountSpent)) {
            case 7 -> CustomerType.DIAMOND;
            case 6 -> CustomerType.PLATINUM;
            case 5 -> CustomerType.VIP;
            case 4 -> CustomerType.GOLD;
            case 3 -> CustomerType.SILVER;
            case 2 -> CustomerType.REGULAR;
            case 1 -> CustomerType.NEW;
            default -> CustomerType.NEW;
        };
    }
}

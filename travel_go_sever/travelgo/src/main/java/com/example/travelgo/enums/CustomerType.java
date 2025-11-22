package com.example.travelgo.enums;

public enum CustomerType {
    NEW(0, 0),
    REGULAR(10, 5000000),
    SILVER(15, 20000000),
    GOLD(20, 50000000),
    VIP(25, 100000000),
    PLATINUM(30, 200000000),
    DIAMOND(35, 500000000);

    private final int discountRate;
    private final long minTotalSpent;

    CustomerType(int discountRate, long minTotalSpent) {
        this.discountRate = discountRate;
        this.minTotalSpent = minTotalSpent;
    }

    public int getDiscountRate() { return discountRate; }
    public long getMinTotalSpent() { return minTotalSpent; }
}
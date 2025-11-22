package com.example.travelgo.enums;

public enum NotificationType {
    INFO,
    SUCCESS,
    WARNING,
    ERROR,

    // Payment
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    PAYMENT_REFUND,

    // Booking
    BOOKING_CREATED,
    BOOKING_CONFIRMED,
    BOOKING_CANCELLED,
    BOOKING_UPDATED,

    // Tour
    TOUR_CREATED,
    TOUR_UPDATED,
    TOUR_DELETED,

    // User
    USER_REGISTERED,
    PROFILE_UPDATED}

package com.example.travelgo.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PolicyType {
    CHILDREN, CANCELLATION;

    @JsonCreator
    public static PolicyType from(String value) {
        if (value == null) return null;
        return PolicyType.valueOf(value.toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}

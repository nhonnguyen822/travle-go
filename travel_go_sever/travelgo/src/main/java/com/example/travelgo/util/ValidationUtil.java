package com.example.travelgo.util;

import com.example.travelgo.dto.ItineraryDayDTO;

import java.util.List;

public class ValidationUtil {

    public static boolean isValidDayIndexes(List<ItineraryDayDTO> itineraryDays, Integer duration) {
        if (itineraryDays == null) return true;

        // Kiểm tra dayIndex có trong khoảng 1 đến duration không
        return itineraryDays.stream()
                .allMatch(day -> day.getDayIndex() != null &&
                        day.getDayIndex() >= 1 &&
                        day.getDayIndex() <= duration);
    }
}

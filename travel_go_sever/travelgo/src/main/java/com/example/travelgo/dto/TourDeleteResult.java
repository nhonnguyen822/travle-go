package com.example.travelgo.dto;

import com.example.travelgo.entity.Tour;
import com.example.travelgo.entity.TourSchedule;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourDeleteResult {
    private boolean success;
    private String message;
    private Tour deletedTour;
    private DeleteStatus status;
    private Long activeScheduleCount;
    private List<TourSchedule> activeSchedules;

    public enum DeleteStatus {
        SUCCESS, NOT_FOUND, ALREADY_DELETED, HAS_ACTIVE_SCHEDULES, FAILED
    }

    // Factory methods
    public static TourDeleteResult success(Tour tour) {
        return new TourDeleteResult(true, "Xóa tour thành công", tour, DeleteStatus.SUCCESS, 0L, null);
    }

    public static TourDeleteResult notFound() {
        return new TourDeleteResult(false, "Không tìm thấy tour", null, DeleteStatus.NOT_FOUND, 0L, null);
    }

    public static TourDeleteResult alreadyDeleted() {
        return new TourDeleteResult(false, "Tour đã bị xóa trước đó", null, DeleteStatus.ALREADY_DELETED, 0L, null);
    }

    public static TourDeleteResult hasActiveSchedules(Long scheduleCount, List<TourSchedule> activeSchedules) {
        String message = scheduleCount > 1
                ? String.format("Không thể xóa tour vì đang có %d lịch trình đang hoạt động", scheduleCount)
                : "Không thể xóa tour vì đang có lịch trình đang hoạt động";

        return new TourDeleteResult(false, message, null, DeleteStatus.HAS_ACTIVE_SCHEDULES, scheduleCount, activeSchedules);
    }

    public static TourDeleteResult failed() {
        return new TourDeleteResult(false, "Xóa tour thất bại", null, DeleteStatus.FAILED, 0L, null);
    }
}
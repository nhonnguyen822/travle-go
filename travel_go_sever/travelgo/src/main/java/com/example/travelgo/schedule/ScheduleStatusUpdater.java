package com.example.travelgo.schedule;

import com.example.travelgo.service.ITourScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduleStatusUpdater {
    private final ITourScheduleService tourScheduleService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void updateTourScheduleStatuses() {
        try {
            tourScheduleService.updateScheduleStatusAutomatically();
        } catch (Exception e) {
            log.error("❌ Lỗi khi cập nhật trạng thái tour schedule: {}", e.getMessage(), e);
        }
    }
}

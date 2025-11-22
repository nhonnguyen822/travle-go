package com.example.travelgo.controller;

import com.example.travelgo.dto.TourDetailResponse;
import com.example.travelgo.dto.TourRequest;
import com.example.travelgo.entity.Tour;
import com.example.travelgo.service.ITourService;
import com.example.travelgo.util.ValidationUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tours")
@RequiredArgsConstructor
public class TourController {
    private final ITourService tourService;

    // Lấy chi tiết tour theo ID
    @GetMapping("/{tourId}")
    public ResponseEntity<TourDetailResponse> getTourDetail(@PathVariable Long tourId) {
        TourDetailResponse tourDetail = tourService.getTourDetail(tourId);
        if (tourDetail == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(tourDetail, HttpStatus.OK);
    }

    @GetMapping("/region/{regionId}")
    public ResponseEntity<?> getToursByRegion(@PathVariable Long regionId) {
        List<Tour> toursByRegion = tourService.getToursByRegion(regionId);
        if (toursByRegion.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(toursByRegion, HttpStatus.OK);
    }


    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createTour(@Valid @RequestBody TourRequest request,
                                        BindingResult bindingResult) throws IOException {

        // Kiểm tra lỗi validation cơ bản
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error ->
                    errors.put(error.getField(), error.getDefaultMessage()));
            return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
        }

        // Validate business logic: số ngày itinerary không vượt quá duration
        if (request.getItineraryDays() != null && request.getDuration() != null) {
            if (request.getItineraryDays().size() > request.getDuration()) {
                Map<String, String> error = new HashMap<>();
                error.put("itineraryDays", "Số ngày trong lịch trình không được vượt quá thời lượng tour");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }

            // Validate dayIndex có liên tục và hợp lệ không
            if (!ValidationUtil.isValidDayIndexes(request.getItineraryDays(), request.getDuration())) {
                Map<String, String> error = new HashMap<>();
                error.put("dayIndex", "Thứ tự ngày phải liên tục và hợp lệ");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
        }

        try {
            TourDetailResponse saved = tourService.createTour(request);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping
    public ResponseEntity<?> getAllTour() {
        List<Tour> tourList = tourService.getAllTours();
        if (tourList.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(tourList, HttpStatus.OK);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateTour(
            @PathVariable Long id,
            @Valid @RequestBody TourRequest tourRequest,
            BindingResult bindingResult
    ) {
        try {
            if (bindingResult.hasErrors()) {
                Map<String, String> errors = new HashMap<>();
                bindingResult.getFieldErrors().forEach(error ->
                        errors.put(error.getField(), error.getDefaultMessage()));
                return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
            }

            // Validate business logic: số ngày itinerary không vượt quá duration
            if (tourRequest.getItineraryDays() != null && tourRequest.getDuration() != null) {
                if (tourRequest.getItineraryDays().size() > tourRequest.getDuration()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("itineraryDays", "Số ngày trong lịch trình không được vượt quá thời lượng tour");
                    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
                }

                // Validate dayIndex có liên tục và hợp lệ không
                if (!ValidationUtil.isValidDayIndexes(tourRequest.getItineraryDays(), tourRequest.getDuration())) {
                    Map<String, String> error = new HashMap<>();
                    error.put("dayIndex", "Thứ tự ngày phải liên tục và hợp lệ");
                    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
                }
            }

            TourDetailResponse updatedTour = tourService.updateTour(id, tourRequest);
            if (updatedTour == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Tour với id " + id + " không tồn tại");
            }
            return ResponseEntity.ok(updatedTour);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra khi cập nhật tour: " + e.getMessage());
        }
    }


    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getTours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String status
    ) {
        Page<Tour> tourPage = tourService.searchTours(page, size, title, destination, minPrice, maxPrice, status);

        Map<String, Object> response = new HashMap<>();
        response.put("content", tourPage.getContent());
        response.put("currentPage", tourPage.getNumber());
        response.put("totalPages", tourPage.getTotalPages());
        response.put("totalElements", tourPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/most_popular")
    public ResponseEntity<?> getMostPopularTour() {
        List<Tour> tourList = tourService.getMostPopularTour();
        if (tourList.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(tourList, HttpStatus.OK);
    }


    @PatchMapping("/delete/{id}")
    public ResponseEntity<?> deleteTour(@PathVariable Long id) {
        Optional<Tour> tour = tourService.getTourById(id);

        if (tour.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy tour với ID: " + id));
        }
        int activeScheduleCount = tourService.countActiveTourSchedules(id);
        if (activeScheduleCount > 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Không thể xóa tour vì còn " + activeScheduleCount + " lịch trình đang hoạt động"));
        }

        Optional<Tour> tourDelete = tourService.softDeleteAndGetTour(id);
        if (tourDelete.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy tour với ID: " + id));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Đã xóa tour thành công",
                "tour", tourDelete.get()
        ));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveTours() {
        try {
            List<Tour> activeTours = tourService.getActiveTours();
            if (activeTours.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(activeTours, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi lấy danh sách tour: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

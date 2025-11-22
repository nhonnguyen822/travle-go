package com.example.travelgo.service.impl;

import com.example.travelgo.dto.*;
import com.example.travelgo.entity.*;
import com.example.travelgo.enums.TourStatus;
import com.example.travelgo.repository.*;
import com.example.travelgo.service.GeoLocationService;
import com.example.travelgo.service.ITourService;
import com.example.travelgo.util.CloudinaryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class TourService implements ITourService {
    private final ITourRepository tourRepository;
    private final ITourImageRepository imageRepository;
    private final ITourScheduleRepository scheduleRepository;
    private final IItineraryDayRepository itineraryDayRepository;
    private final IItineraryActivityRepository activityRepository;
    private final ITourPolicyRepository tourPolicyRepository;
    private final ITourServiceRepository tourServiceRepository;
    private final GeoLocationService geoLocationService;
    private final ITourImageRepository tourImageRepository;
    private final CloudinaryService cloudinaryService;
    private final IRegionRepository regionRepository;
    private final IPolicyRepository policyRepository;
    private final IServiceItemRepository serviceItemRepository;


    @Override
    public List<Tour> getToursByRegion(Long regionId) {
        return tourRepository.findByRegionId(regionId);
    }


    @Override
    public TourDetailResponse getTourDetail(Long tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        List<TourImageDTO> images = imageRepository.findImagesByTourId(tourId);
        List<TourScheduleDTO> schedules = scheduleRepository.findSchedulesByTourId(tourId);

        List<ItineraryDayDTO> itineraryDays = itineraryDayRepository.findDaysByTourId(tourId)
                .stream()
                .map(day -> {
                    List<ActivityDTO> activities = activityRepository.findActivitiesByDayId((day.getId()));
                    return ItineraryDayDTO.builder()
                            .id(day.getId())
                            .dayIndex(day.getDayIndex())
                            .title(day.getTitle())
                            .description(day.getDescription())
                            .activities(activities)
                            .build();
                }).toList();
        List<ServiceDTO> serviceList = tourServiceRepository.findServicesByTourId(tourId);
        List<PolicyDTO> policyList = tourPolicyRepository.findPoliciesByTourId(tourId);

        return TourDetailResponse.builder()
                .id(tour.getId())
                .name(tour.getTitle())
                .durationDays(Integer.parseInt(tour.getDuration()))
                .image(tour.getImage())
                .description(tour.getDescription())
                .highLight(tour.getHighLight())
                .destination(tour.getDestination())
                .basePrice(tour.getBasePrice())
                .regionId(tour.getRegion().getId())
                .images(images)
                .itineraryDays(itineraryDays)
                .schedules(schedules)
                .latitude(tour.getLatitude())
                .longitude(tour.getLongitude())
                .policies(policyList)
                .services(serviceList)
                .build();
    }


    @Override
    @Transactional
    public TourDetailResponse updateTour(Long id, TourRequest request) {
        Tour tour = tourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        // --- Map field cơ bản ---
        tour.setTitle(request.getTitle());
        tour.setDestination(request.getDestination());
        tour.setDescription(request.getDescription());
        tour.setHighLight(request.getHighLight());
        if (request.getBasePrice() != null) {
            tour.setBasePrice(BigDecimal.valueOf(request.getBasePrice()));
        }
        tour.setStatus(TourStatus.valueOf(request.getStatus()));

        // --- Region ---
        tour.setRegion(regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new RuntimeException("Region not found")));

        // --- Ảnh cover ---
        if (request.getImage() != null) {
            tour.setImage(request.getImage());
        }

        // --- Ảnh gallery ---
        if (request.getImages() != null) {
            List<TourImage> existingImages = new ArrayList<>(tour.getImages());
            List<TourImageDTO> newImages = request.getImages();

            // --- 1️⃣ Xóa ảnh cũ không còn trong request ---
            List<TourImage> toRemove = existingImages.stream()
                    .filter(img -> newImages.stream().noneMatch(dto -> dto.getId() != null && dto.getId().equals(img.getId())))
                    .collect(Collectors.toList());
            toRemove.forEach(img -> {
                existingImages.remove(img);
                imageRepository.deleteById(img.getId());
            });

            // --- 2️⃣ Cập nhật ảnh cũ (thay đổi URL nếu cần) & thêm ảnh mới ---
            for (TourImageDTO dto : newImages) {
                if (dto.getId() != null) {
                    // Cập nhật URL cho ảnh cũ nếu bị thay đổi
                    existingImages.stream()
                            .filter(img -> img.getId().equals(dto.getId()))
                            .findFirst()
                            .ifPresent(img -> img.setImageUrl(dto.getImageUrl()));
                } else {
                    // Ảnh mới → thêm vào danh sách
                    TourImage newImg = new TourImage();
                    newImg.setId(null);
                    newImg.setImageUrl(dto.getImageUrl());
                    newImg.setTour(tour);
                    existingImages.add(newImg);
                }
            }

            // --- 3️⃣ Gán lại danh sách ảnh đã cập nhật ---
            tour.setImages(existingImages);
        }


        // --- ItineraryDays + Activities ---
        if (request.getItineraryDays() != null) {
            List<ItineraryDay> existingDays = new ArrayList<>(tour.getItineraryDays());

            // 1️⃣ Xóa những day không còn trong request
            List<ItineraryDay> toRemove = existingDays.stream()
                    .filter(d -> request.getItineraryDays().stream()
                            .noneMatch(dto -> dto.getId() != null && dto.getId().equals(d.getId())))
                    .collect(Collectors.toList());
            toRemove.forEach(day -> {
                existingDays.remove(day);
                itineraryDayRepository.deleteById(day.getId());
            });

            // 2️⃣ Cập nhật hoặc thêm mới
            for (ItineraryDayDTO dto : request.getItineraryDays()) {
                ItineraryDay day;
                if (dto.getId() != null) {
                    // Cập nhật day cũ
                    day = existingDays.stream()
                            .filter(d -> d.getId().equals(dto.getId()))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("ItineraryDay not found: " + dto.getId()));

                    day.setDayIndex(dto.getDayIndex());
                    day.setTitle(dto.getTitle());
                    day.setDescription(dto.getDescription());
                } else {
                    // Tạo mới
                    day = new ItineraryDay();
                    day.setDayIndex(dto.getDayIndex());
                    day.setTitle(dto.getTitle());
                    day.setDescription(dto.getDescription());
                    day.setTour(tour);
                    existingDays.add(day);
                }

                // 3️⃣ Cập nhật Activities trong mỗi Day
                List<ItineraryActivity> existingActs = new ArrayList<>(day.getActivities());

                // Xóa activity không còn trong request
                List<ItineraryActivity> toRemoveAct = existingActs.stream()
                        .filter(a -> dto.getActivities().stream()
                                .noneMatch(req -> req.getId() != null && req.getId().equals(a.getId())))
                        .collect(Collectors.toList());
                toRemoveAct.forEach(a -> {
                    existingActs.remove(a);
                    activityRepository.deleteById(a.getId());
                });

                // Cập nhật hoặc thêm mới activity
                for (ActivityDTO a : dto.getActivities()) {
                    ItineraryActivity act;
                    if (a.getId() != null) {
                        act = existingActs.stream()
                                .filter(ex -> ex.getId().equals(a.getId()))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Activity not found: " + a.getId()));
                        act.setTitle(a.getTitle());
                        act.setTime(a.getTime());
                        act.setDetails(a.getDetails());
                        act.setPosition(a.getPosition());
                        act.setImageUrl(a.getImageUrl());
                    } else {
                        act = new ItineraryActivity();
                        act.setTitle(a.getTitle());
                        act.setTime(a.getTime());
                        act.setDetails(a.getDetails());
                        act.setPosition(a.getPosition());
                        act.setImageUrl(a.getImageUrl());
                        act.setItineraryDay(day);
                        existingActs.add(act);
                    }
                }

                day.setActivities(existingActs);
            }

            // 4️⃣ Gán lại danh sách sau khi cập nhật
            tour.setItineraryDays(existingDays);
        }


        // --- Services ---
        if (request.getServices() != null) {
            // 1️⃣ Xóa toàn bộ liên kết cũ của tour trong bảng trung gian
            tourServiceRepository.deleteAllByTourId(tour.getId());

            // 2️⃣ Tạo lại danh sách mới
            List<TourServices> newServices = request.getServices().stream().map(dto -> {
                ServiceItem si;
                if (dto.getId() != null) {
                    si = serviceItemRepository.findById(dto.getId())
                            .orElseThrow(() -> new RuntimeException("ServiceItem not found: " + dto.getId()));
                } else {
                    si = new ServiceItem();
                    si.setName(dto.getName());
                    si.setType(dto.getType());
                    si = serviceItemRepository.save(si);
                }

                TourServices ts = new TourServices();
                ts.setTour(tour);
                ts.setServiceItem(si);
                return ts;
            }).collect(Collectors.toList());

            tour.setServices(newServices);
        }

        // --- Cập nhật tọa độ nếu cần ---
        setCoordinatesIfNeeded(tour);

        // --- Lưu lại tour ---
        Tour saved = tourRepository.save(tour);

        // --- Ép load tránh lazy loading ---
        saved.getImages().size();
        saved.getItineraryDays().forEach(d -> d.getActivities().size());
        saved.getServices().size();
        saved.getPolicies().size();

        // --- Trả về DTO ---
        return mapToTourDetailResponse(saved);
    }


    // --- Hàm map lại Tour -> TourDetailResponse ---
    private TourDetailResponse mapToTourDetailResponse(Tour saved) {
        TourDetailResponse response = new TourDetailResponse();
        response.setId(saved.getId());
        response.setName(saved.getTitle());
        response.setDescription(saved.getDescription());
        response.setDestination(saved.getDestination());
        response.setBasePrice(saved.getBasePrice());
        response.setLongitude(saved.getLongitude());
        response.setLatitude(saved.getLatitude());
        response.setHighLight(saved.getHighLight());
        response.setDurationDays(saved.getItineraryDays().size());

        List<TourImageDTO> imageDTOs = new ArrayList<>();
        for (TourImage img : saved.getImages()) {
            imageDTOs.add(new TourImageDTO(img.getId(), img.getImageUrl()));
        }
        response.setImages(imageDTOs);

        List<ItineraryDayDTO> dayDTOs = new ArrayList<>();
        for (ItineraryDay day : saved.getItineraryDays()) {
            List<ActivityDTO> activities = new ArrayList<>();
            for (ItineraryActivity act : day.getActivities()) {
                ActivityDTO actDto = new ActivityDTO();
                actDto.setTime(act.getTime());
                actDto.setTitle(act.getTitle());
                actDto.setDetails(act.getDetails());
                actDto.setImageUrl(act.getImageUrl() != null ? act.getImageUrl() : "");
                actDto.setPosition(act.getPosition() != null ? act.getPosition() : 1);
                activities.add(actDto);
            }
            ItineraryDayDTO dayDto = new ItineraryDayDTO();
            dayDto.setId(day.getId());
            dayDto.setDayIndex(day.getDayIndex());
            dayDto.setTitle(day.getTitle());
            dayDto.setDescription(day.getDescription());
            dayDto.setActivities(activities);
            dayDTOs.add(dayDto);
        }
        response.setItineraryDays(dayDTOs);

        List<ServiceDTO> serviceDTOs = new ArrayList<>();
        for (TourServices ts : saved.getServices()) {
            ServiceDTO dto = new ServiceDTO();
            dto.setId(ts.getServiceItem().getId());
            dto.setName(ts.getServiceItem().getName());
            dto.setType(ts.getServiceItem().getType());
            serviceDTOs.add(dto);
        }
        response.setServices(serviceDTOs);

        List<PolicyDTO> policyDTOs = new ArrayList<>();
        for (TourPolicy tp : saved.getPolicies()) {
            PolicyDTO dto = new PolicyDTO();
            dto.setId(tp.getPolicy().getId());
            dto.setName(tp.getPolicy().getName());
            dto.setType(tp.getPolicy().getType());
            policyDTOs.add(dto);
        }
        response.setPolicies(policyDTOs);

        return response;
    }

    @Override
    public Page<Tour> searchTours(int page, int size, String title, String destination, Double minPrice, Double maxPrice, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return tourRepository.filterTours(title, destination, minPrice, maxPrice, status, pageable);
    }


    @Override
    public TourDetailResponse createTour(TourRequest request) {
        // 1️⃣ Tạo Tour entity
        Tour tour = new Tour();
        tour.setTitle(request.getTitle());
        tour.setDestination(request.getDestination());
        tour.setDuration(String.valueOf(request.getDuration()));
        tour.setDescription(request.getDescription());
        tour.setHighLight(request.getHighLight());
        tour.setBasePrice(BigDecimal.valueOf(request.getBasePrice()));
        tour.setStatus(TourStatus.valueOf(request.getStatus()));
        tour.setRegion(regionRepository.findById(request.getRegionId()).orElseThrow());
        tour.setImage(request.getImage());

        // 2️⃣ Lưu Tour trước để lấy ID
        tourRepository.save(tour);

        // 3️⃣ Lưu ảnh phụ
        List<TourImage> images = request.getImages() != null
                ? request.getImages().stream()
                .map(dto -> {
                    TourImage img = new TourImage();
                    img.setId(dto.getId()); // null nếu mới
                    img.setImageUrl(dto.getImageUrl());
                    img.setTour(tour);
                    return img;
                })
                .collect(Collectors.toList())
                : new ArrayList<>();
        tour.setImages(images);

        // 4️⃣ Lịch trình + hoạt động
        List<ItineraryDay> itineraryDays = request.getItineraryDays() != null
                ? request.getItineraryDays().stream().map(dto -> {
            ItineraryDay day = new ItineraryDay();
            day.setDayIndex(dto.getDayIndex());
            day.setTitle(dto.getTitle());
            day.setDescription(dto.getDescription());
            day.setTour(tour);

            List<ItineraryActivity> activities = dto.getActivities() != null
                    ? dto.getActivities().stream().map(aDto -> {
                ItineraryActivity act = new ItineraryActivity();
                act.setTime(aDto.getTime());
                act.setTitle(aDto.getTitle());
                act.setDetails(aDto.getDetails());
                act.setImageUrl(aDto.getImageUrl() != null ? aDto.getImageUrl() : "");
                act.setPosition(aDto.getPosition() != null ? aDto.getPosition() : 1);
                act.setItineraryDay(day);
                return act;
            }).collect(Collectors.toList())
                    : new ArrayList<>();

            day.setActivities(activities);
            return day;
        }).collect(Collectors.toList())
                : new ArrayList<>();
        tour.setItineraryDays(itineraryDays);

        // 5️⃣ Dịch vụ
        List<TourServices> tourServices = request.getServices() != null
                ? request.getServices().stream().map(dto -> {
            ServiceItem si;
            if (dto.getId() != null) {
                si = serviceItemRepository.findById(dto.getId())
                        .orElseThrow(() -> new RuntimeException("ServiceItem not found: " + dto.getId()));
            } else {
                si = new ServiceItem();
                si.setName(dto.getName());
                si.setType(dto.getType());
                si = serviceItemRepository.save(si);
            }
            TourServices ts = new TourServices();
            ts.setTour(tour);
            ts.setServiceItem(si);
            return ts;
        }).collect(Collectors.toList())
                : new ArrayList<>();
        tour.setServices(tourServices);

        // 6️⃣ Chính sách
        List<Policy> policies = policyRepository.findAll();

        List<TourPolicy> tourPolicies = policies.stream()
                .map(policy -> {
                    TourPolicy tp = new TourPolicy();
                    tp.setPolicy(policy);
                    tp.setTour(tour);
                    return tp;
                })
                .collect(Collectors.toList());

        tour.setPolicies(tourPolicies);

        setCoordinatesIfNeeded(tour);

        System.out.println(tour);
        System.out.println(tour);
        // 7️⃣ Lưu tất cả
        Tour saved = tourRepository.save(tour);

        // 9️⃣ Tạo DTO thủ công
        TourDetailResponse response = new TourDetailResponse();
        response.setId(saved.getId());
        response.setName(saved.getTitle());
        response.setDescription(saved.getDescription());
        response.setDestination(saved.getDestination());
        response.setBasePrice(saved.getBasePrice());
        response.setLongitude(saved.getLongitude());
        response.setLatitude(saved.getLatitude());
        response.setHighLight(saved.getHighLight());
        response.setDurationDays(saved.getItineraryDays().size());

        // Images
        List<TourImageDTO> imageDTOs = new ArrayList<>();
        for (TourImage img : saved.getImages()) {
            imageDTOs.add(new TourImageDTO(img.getId(), img.getImageUrl()));
        }
        response.setImages(imageDTOs);

        // ItineraryDays + Activities
        List<ItineraryDayDTO> dayDTOs = new ArrayList<>();
        for (ItineraryDay day : saved.getItineraryDays()) {
            List<ActivityDTO> activities = new ArrayList<>();
            for (ItineraryActivity act : day.getActivities()) {
                ActivityDTO actDto = new ActivityDTO();
                actDto.setTime(act.getTime());
                actDto.setTitle(act.getTitle());
                actDto.setDetails(act.getDetails());
                actDto.setImageUrl(act.getImageUrl() != null ? act.getImageUrl() : "");
                actDto.setPosition(act.getPosition() != null ? act.getPosition() : 1);
                activities.add(actDto);
            }
            ItineraryDayDTO dayDto = new ItineraryDayDTO();
            dayDto.setId(day.getId());
            dayDto.setDayIndex(day.getDayIndex());
            dayDto.setTitle(day.getTitle());
            dayDto.setDescription(day.getDescription());
            dayDto.setActivities(activities);
            dayDTOs.add(dayDto);
        }
        response.setItineraryDays(dayDTOs);

        // Services
        List<ServiceDTO> serviceDTOs = new ArrayList<>();
        for (TourServices ts : saved.getServices()) {
            ServiceDTO dto = new ServiceDTO();
            dto.setId(ts.getServiceItem().getId());
            dto.setName(ts.getServiceItem().getName());
            dto.setType(ts.getServiceItem().getType());
            serviceDTOs.add(dto);
        }
        response.setServices(serviceDTOs);

        // Policies
        List<PolicyDTO> policyDTOs = new ArrayList<>();
        for (TourPolicy tp : saved.getPolicies()) {
            PolicyDTO dto = new PolicyDTO();
            dto.setId(tp.getPolicy().getId());
            dto.setName(tp.getPolicy().getName());
            dto.setType(tp.getPolicy().getType());
            policyDTOs.add(dto);
        }
        response.setPolicies(policyDTOs);
        return response;
    }

    @Override
    public List<Tour> getMostPopularTour() {
        return tourRepository.getMostPopularTour();
    }

    @Override
    public Optional<Tour> softDeleteAndGetTour(Long id) {
        return tourRepository.softDeleteAndReturn(id);
    }

    @Override
    public boolean restoreTour(Long id) {
        int updatedRows = tourRepository.restore(id);
        return updatedRows > 0;
    }

    @Override
    public int countActiveTourSchedules(Long tourId) {
        return tourRepository.countActiveTourSchedules(tourId);
    }

    @Override
    public List<Tour> getActiveTours() {
        return tourRepository.findByStatusNotDeletedAndActiveWithFutureSchedules();
    }

    @Override
    public List<Tour> getAllTours() {
        return tourRepository.findAll();
    }

    @Override
    public Optional<Tour> getTourById(Long id) {
        return tourRepository.findById(id);
    }


    private void setCoordinatesIfNeeded(Tour tour) {
        // Ưu tiên destination, nếu null thì dùng title
        String locationName = (tour.getDestination() != null && !tour.getDestination().isBlank())
                ? tour.getDestination()
                : tour.getTitle();

        if (locationName != null && !locationName.isBlank()
                && (tour.getLatitude() == null || tour.getLongitude() == null)) {

            // 🧠 Tách địa điểm đầu tiên nếu có nhiều nơi
            String mainLocation = locationName.split(",")[0].trim();

            double[] coords = geoLocationService.getCoordinates(mainLocation);
            if (coords != null) {
                tour.setLatitude(coords[0]);
                tour.setLongitude(coords[1]);
                System.out.println("✅ Đã tự động cập nhật toạ độ cho: " + mainLocation);
            } else {
                System.out.println("⚠️ Không tìm thấy toạ độ cho: " + mainLocation);
            }
        }
    }
}

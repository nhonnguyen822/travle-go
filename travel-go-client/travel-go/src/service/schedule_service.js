import axios from "axios";
import api from "../context/api";

const BACK_END_URL = "http://localhost:8080/api";


export const getSchedulesByTourId = async (tourId) => {
    console.log(tourId)
    try {
        const res = await axios.get(`${BACK_END_URL}/schedules/tours/${tourId}`);
        return res.data;
    } catch (err) {

        return [];
    }
};

export const createSchedule = async (tourId, scheduleData) => {
    try {
        console.log("📤 Gửi request tạo schedule:", { tourId, scheduleData });
        const res = await api.post(`/schedules/${tourId}`, scheduleData, {
            headers: { "Content-Type": "application/json" }
        });
        return res.data;
    } catch (err) {
        console.error("❌ Lỗi tạo schedule:", err);
        throw err;
    }
};

export const updateSchedule = async (scheduleId, scheduleData) => {
    try {
        console.log("📤 Gửi request cập nhật schedule:", { scheduleId, scheduleData });
        const res = await api.patch(`/schedules/${scheduleId}`, scheduleData, {
            headers: { "Content-Type": "application/json" }
        });
        return res.data;
    } catch (err) {
        console.error("❌ Lỗi cập nhật schedule:", err);
        throw err;
    }
};

export const deleteSchedule = async (scheduleId) => {
    try {
        // Sử dụng api thay vì axios trực tiếp để có authentication
        const res = await api.patch(`${BACK_END_URL}/schedules/delete/${scheduleId}`);
        return res.data;
    } catch (err) {
        throw err;
    }
};

export const getAllSchedules = async () => {
    try {
        const res = await axios.get(`${BACK_END_URL}/schedules`);
        return res.data;
    } catch (err) {
        return [];
    }
};


export const getFutureSchedulesByTour = async (tourId) => {
    try {
        const res = await axios.get(`${BACK_END_URL}/schedules/tour/${tourId}/future`);
        return res.data;
    } catch (err) {
        return [];
    }
};


export const getScheduleByBookingId = async (bookingId) => {
    try {
        const res = await axios.get(`${BACK_END_URL}/schedules/booking/${bookingId}`);
        return res.data;
    } catch (err) {
        throw err;
    }
};


import axios from "axios";
import api from "../context/api"

const BACK_END_URL = "http://localhost:8080/api"

export const getMostPopularTour = async () => {
    try {
        const res = await axios.get(`${BACK_END_URL}/tours/most_popular`);
        return res.data;
    } catch (e) {
        return [];
    }
}

export const findListTourByRegionId = async (regionId) => {
    try {
        const res = await axios.get(`${BACK_END_URL}/tours/region/${regionId}`,);
        return res.data;
    } catch (e) {
        return [];
    }
};

export const findTourById = async (id) => {
    try {
        console.log(id)
        const res = await axios.get(`${BACK_END_URL}/tours/${id}`);
        return res.data;
    } catch (e) {
        return null;
    }
};

export const createTour = async (tourData) => {
    console.log(tourData)
    const res = await axios.post(`${BACK_END_URL}/tours`, tourData, {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    });

    return res.data;
};

export const getPagedTours = async ({
                                        page = 0,
                                        size = 10,
                                        title = "",
                                        destination = "",
                                        minPrice = "",
                                        maxPrice = "",
                                        status = ""
                                    }) => {
    const params = new URLSearchParams({
        page,
        size,
        title,
        destination,
        minPrice,
        maxPrice,
        status,
    });

    const res = await axios.get(`${BACK_END_URL}/tours/admin?${params.toString()}`);
    return res.data;
};

export const updateTour = async (id, tourData) => {

    const res = await axios.patch(`${BACK_END_URL}/tours/${id}`, tourData, {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    });
    return res.data;
};


export const deleteTourById = async (tourId) => {
    try {
        const response = await axios.patch(`${BACK_END_URL}/tours/delete/${tourId}`);
        return response.data;
    } catch (error) {
        if (error.response) {

            throw error;
        } else if (error.request) {
            throw new Error('Không thể kết nối đến server. Vui lòng thử lại.');
        } else {
            throw new Error('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    }
};

export const getActiveTours = async () => {
    try {
        const res = await axios.get(`${BACK_END_URL}/tours/active`);
        return res.data;
    } catch (e) {
        console.error("❌ Lỗi khi lấy danh sách tour active:", e);
        return [];
    }
};
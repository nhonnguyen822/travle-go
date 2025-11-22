import axios from "axios";

const BASE_URL = "http://localhost:8080/api/payment";

export const createPayment = async (data) => {
    try {
        const res = await axios.post(`${BASE_URL}/create`, data, { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Payment API Error:", error.response?.data || error.message);
        throw error;
    }
};
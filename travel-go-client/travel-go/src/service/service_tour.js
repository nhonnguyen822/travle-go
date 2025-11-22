import axios from "axios";
const BACK_END_URL = "http://localhost:8080/api"
export const getAllServiceTour = async () => {
    try {
        const res = await axios.get(`${BACK_END_URL}/service-tour`);
        return res.data;
    } catch (e) {
        console.log("loi ket noi db")
        return [];
    }
}
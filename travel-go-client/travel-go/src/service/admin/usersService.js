import api from "../../context/api";

export const getAllCustomers=async ( page = 0, size = 10, search, customerType, status)=> {
    try {
        const response = await api.get("/admin/customers", {
            params: {
                page,
                size,
                search,
                customerType,
                status
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const getCustomerById=async (id)=> {
    try {
        const response = await api.get(`/admin/customers/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}



export const updateCustomerStatus=async (id, status)=> {
    try {
        const response = await api.patch(`/admin/customers/${id}/status`, null, {
            params: { status }
        });
        console.log(response.data)
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const updateCustomerType=async (id, customerType)=> {
    try {
        const response = await api.patch(`/admin/customers/${id}/type`, null, {
            params: { customerType }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}

export const getCustomerStats=async ()=> {
    try {
        const response = await api.get("/admin/customers/stats");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}


const BACK_END_URL = "http://localhost:8080/api"
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(BACK_END_URL+"/upload", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Upload thất bại");
    const data = await res.json();
    return data.url; // backend trả về URL
};
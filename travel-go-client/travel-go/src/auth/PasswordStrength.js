const PasswordStrength = ({ password, message }) => {
    // Hàm tính strength
    const getPasswordStrength = (password) => {
        let score = 0;
        if (!password)
            return {
                score,
                label: "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số",
            };

        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        let label = "Rất yếu";
        if (score <= 2) label = "Yếu";
        else if (score === 3) label = "Trung bình";
        else if (score === 4) label = "Khá mạnh";
        else if (score >= 5) label = "Mạnh";

        return { score, label };
    };

    const { score, label } = getPasswordStrength(password);

    // màu cho progress bar
    const colors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-yellow-500",
        "bg-blue-500",
        "bg-green-500",
    ];
    const width = `${(score / 5) * 100}%`;

    return (
        <div className="mt-2">
            <div className="w-full h-2 bg-gray-200 rounded">
                <div
                    className={`h-2 rounded ${colors[score - 1] || "bg-gray-200"}`}
                    style={{ width }}
                ></div>
            </div>

            {message ? (
                <p className="text-sm mt-1 text-red-600">{message}</p>
            ) : (
                <p className="text-sm mt-1 text-gray-600">{label}</p>
            )}
        </div>
    );
};

export default PasswordStrength;

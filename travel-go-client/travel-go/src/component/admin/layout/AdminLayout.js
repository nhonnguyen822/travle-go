import React, {useState} from "react";
import PropTypes from "prop-types";
import AdminHeaderComponent from "./AdminHeaderComponent";
import AdminSidebarComponent from "./AdminSidebarComponent";

const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex bg-gray-50 min-h-screen text-gray-800">
            {/* Sidebar */}
            <AdminSidebarComponent collapsed={collapsed} />

            {/* Main area */}
            <div
                className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
                    collapsed ? "ml-16" : "ml-64"
                }`}
            >
                {/* Header */}
                <AdminHeaderComponent
                    onToggleSidebar={() => setCollapsed((prev) => !prev)}
                />

                {/* Nội dung chính */}
                <main className="flex-1 p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};

AdminLayout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AdminLayout;

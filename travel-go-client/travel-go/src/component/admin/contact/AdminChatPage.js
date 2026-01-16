import React, { useState, useEffect } from 'react';
import { Users, Search, MessageCircle, Mail, Clock, Eye, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from "../../../context/AuthContext";
import AdminChatModal from "./AdminChatModal";
import chatAPI from "../../../service/ChatAPI";
import AdminLayout from "../layout/AdminLayout";

const AdminChatPage = () => {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'unassigned', 'assigned'
    const { user, isAuthenticated } = useAuth();

    // Load rooms
    useEffect(() => {
        if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPPORT')) {
            loadRooms();

            // Auto refresh every 30 seconds
            const interval = setInterval(loadRooms, 30000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [isAuthenticated, user]);

    const loadRooms = async () => {
        try {
            setIsLoading(true);
            const response = await chatAPI.getAllRooms();

            if (response && response.data) {
                const roomsData = Array.isArray(response.data) ? response.data : [];
                setRooms(roomsData);
            }
        } catch (error) {
            console.error('❌ Error loading rooms:', error);
            setRooms([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openChatModal = (room) => {
        setSelectedRoom(room);
        setIsChatModalOpen(true);
    };

    const closeChatModal = () => {
        setIsChatModalOpen(false);
        setSelectedRoom(null);
    };

    const handleRoomUpdate = (roomId, isActive) => {
        setRooms(prev => prev.map(room =>
            room.id === roomId ? { ...room, isActive } : room
        ));

        if (selectedRoom && selectedRoom.id === roomId && !isActive) {
            closeChatModal();
        }
    };

    const assignToMe = async (roomId, e) => {
        e.stopPropagation();
        try {
            await chatAPI.assignRoom(roomId);
            loadRooms(); // Refresh rooms list

            // If this room is currently selected, update it
            if (selectedRoom && selectedRoom.id === roomId) {
                const updatedRooms = await chatAPI.getAllRooms();
                const updatedRoom = updatedRooms.data?.find(r => r.id === roomId);
                if (updatedRoom) {
                    setSelectedRoom(updatedRoom);
                }
            }
        } catch (error) {
            console.error('❌ Error assigning room:', error);
            alert('Lỗi khi nhận phòng chat');
        }
    };

    // Filter rooms based on search and filter
    const filteredRooms = rooms.filter(room => {
        // Search filter
        const matchesSearch =
            (room.customerName && room.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (room.customerEmail && room.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (room.id && room.id.toString().includes(searchTerm));

        // Status filter
        const matchesFilter = () => {
            switch (filter) {
                case 'active':
                    return room.isActive;
                case 'unassigned':
                    return room.isActive && !room.adminId;
                case 'assigned':
                    return room.isActive && room.adminId;
                case 'closed':
                    return !room.isActive;
                default:
                    return true;
            }
        };

        return matchesSearch && matchesFilter();
    });

    // Calculate stats
    const stats = {
        total: rooms.length,
        active: rooms.filter(r => r.isActive).length,
        unassigned: rooms.filter(r => r.isActive && !r.adminId).length,
        assigned: rooms.filter(r => r.isActive && r.adminId).length,
        closed: rooms.filter(r => !r.isActive).length
    };

    const formatLastActivity = (timestamp) => {
        if (!timestamp) return 'Chưa có hoạt động';

        try {
            return formatDistanceToNow(new Date(timestamp), {
                locale: vi,
                addSuffix: true
            });
        } catch {
            return 'Chưa có hoạt động';
        }
    };

    if (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-4">⚠️ Truy cập bị từ chối</div>
                    <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout  children={<div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Chat Hỗ trợ</h1>
                    <p className="text-gray-600">Quản lý và hỗ trợ khách hàng qua chat trực tuyến</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-5 shadow border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tổng phòng</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <MessageCircle className="w-10 h-10 text-green-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Chờ hỗ trợ</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.unassigned}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500 opacity-80" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow border">
                        <button
                            onClick={loadRooms}
                            disabled={isLoading}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="text-sm font-medium">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên khách hàng, email hoặc ID phòng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all', label: 'Tất cả', color: 'gray' },
                                    { key: 'active', label: 'Đang hoạt động', color: 'green' },
                                    { key: 'unassigned', label: 'Chờ hỗ trợ', color: 'yellow' },
                                    { key: 'assigned', label: 'Đã nhận', color: 'blue' },
                                    { key: 'closed', label: 'Đã đóng', color: 'gray' }
                                ].map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setFilter(item.key)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            filter === item.key
                                                ? `bg-${item.color}-100 text-${item.color}-700 border border-${item.color}-300`
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rooms Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách phòng chat</h2>
                            <p className="text-sm text-gray-600">
                                Hiển thị {filteredRooms.length} trong tổng số {rooms.length} phòng
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thông tin liên hệ
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRooms.map((room) => {
                                const isActive = room.isActive;
                                const hasAdmin = room.adminId;

                                return (
                                    <tr
                                        key={room.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => openChatModal(room)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                                    isActive
                                                        ? hasAdmin ? 'bg-green-500' : 'bg-yellow-500'
                                                        : 'bg-gray-400'
                                                }`} />
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {room.customerName || 'Khách hàng'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: #{room.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className={!room.customerEmail ? 'text-gray-400 italic' : 'text-gray-700'}>
                                                            {room.customerEmail || 'Chưa có email'}
                                                        </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {formatLastActivity(room.lastMessageTime || room.createdAt)}
                                                </div>
                                                {room.lastMessage && (
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        "{room.lastMessage}"
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        isActive
                                                            ? hasAdmin
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {isActive
                                                            ? hasAdmin
                                                                ? 'Đã nhận hỗ trợ'
                                                                : 'Chờ hỗ trợ'
                                                            : 'Đã đóng'}
                                                    </span>
                                                {(room.adminUnread > 0 || room.customerUnread > 0) && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                                            {room.adminUnread || room.customerUnread} tin nhắn mới
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                {isActive && !hasAdmin && (
                                                    <button
                                                        onClick={(e) => assignToMe(room.id, e)}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                                    >
                                                        Nhận phòng
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => openChatModal(room)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                                >
                                                    <Eye size={14} />
                                                    Mở chat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {filteredRooms.length === 0 && !isLoading && (
                            <div className="text-center py-16">
                                <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                                <p className="text-xl font-medium text-gray-500 mb-2">
                                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có phòng chat nào'}
                                </p>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    {searchTerm
                                        ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc'
                                        : 'Khách hàng sẽ xuất hiện ở đây khi họ bắt đầu chat'}
                                </p>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center gap-3 text-gray-500">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span className="text-lg">Đang tải danh sách phòng chat...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            {selectedRoom && (
                <AdminChatModal
                    room={selectedRoom}
                    isOpen={isChatModalOpen}
                    onClose={closeChatModal}
                    onRoomUpdate={handleRoomUpdate}
                    position="bottom-right"
                />
            )}
        </div>}/>
    );
};

export default AdminChatPage;
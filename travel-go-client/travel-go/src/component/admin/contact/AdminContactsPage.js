import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Mail,
    Phone,
    Clock,
    Search,
    Filter,
    Eye,
    Trash2,
    RefreshCw,
    CheckCircle,
    User,
    Calendar,
    FileText,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AdminLayout from '../layout/AdminLayout';
import ContactDetailModal from './ContactDetailModal';
import ContactNoteModal from './ContactNoteModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { contactService } from "../../../service/contactService";

const AdminContactsPage = () => {
    // State management
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'NEW', 'RESPONDED'
    const [dateFilter, setDateFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Modal states
    const [selectedContact, setSelectedContact] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Tính số thứ tự bắt đầu
    const startIndex = useMemo(() => {
        return (currentPage - 1) * itemsPerPage;
    }, [currentPage, itemsPerPage]);

    // Load contacts on component mount
    useEffect(() => {
        loadContacts();
    }, [currentPage, itemsPerPage]);

    // Apply filters whenever dependencies change
    useEffect(() => {
        applyFilters();
    }, [contacts, searchTerm, statusFilter, dateFilter, sortConfig]);

    const loadContacts = async () => {
        try {
            setIsLoading(true);
            const response = await contactService.getAllContacts({
                page: currentPage - 1,
                size: itemsPerPage,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                keyword: searchTerm || undefined
            });

            if (response && response.success) {
                const contactsData = response.data?.content || [];
                setContacts(contactsData);
                setTotalItems(response.data?.totalElements || 0);
                applyFiltersToData(contactsData);
            } else {
                setContacts([]);
                setFilteredContacts([]);
            }
        } catch (error) {
            console.error('❌ Error loading contacts:', error);
            toast.error('Không thể tải danh sách liên hệ');
            setContacts([]);
            setFilteredContacts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to apply filters
    const applyFiltersToData = (data) => {
        let filtered = [...data];

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(contact =>
                (contact.name && contact.name.toLowerCase().includes(term)) ||
                (contact.email && contact.email.toLowerCase().includes(term)) ||
                (contact.phone && contact.phone.includes(searchTerm)) ||
                (contact.message && contact.message.toLowerCase().includes(term))
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(contact => contact.status === statusFilter);
        }

        // Apply date filter
        const now = new Date();
        if (dateFilter !== 'all') {
            filtered = filtered.filter(contact => {
                if (!contact.createdAt) return false;
                const contactDate = new Date(contact.createdAt);
                const diffTime = now - contactDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                switch (dateFilter) {
                    case 'today':
                        return diffDays < 1;
                    case 'week':
                        return diffDays < 7;
                    case 'month':
                        return diffDays < 30;
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';

            if (sortConfig.key === 'createdAt' || sortConfig.key === 'respondedAt') {
                return sortConfig.direction === 'asc'
                    ? new Date(aValue) - new Date(bValue)
                    : new Date(bValue) - new Date(aValue);
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return 0;
        });

        setFilteredContacts(filtered);
    };

    const applyFilters = useCallback(() => {
        applyFiltersToData(contacts);
    }, [contacts, searchTerm, statusFilter, dateFilter, sortConfig]);

    // Sort handler
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Handlers
    const handleViewDetail = (contact) => {
        setSelectedContact(contact);
        setIsDetailModalOpen(true);
    };

    const handleAddNote = (contact) => {
        setSelectedContact(contact);
        setIsNoteModalOpen(true);
    };

    // Chuyển từ NEW sang RESPONDED (một chiều)
    const handleMarkAsResponded = async (contactId) => {
        try {
            await contactService.markAsResponded(contactId, { note: 'Đã phản hồi khách hàng' });
            toast.success('Đã chuyển trạng thái thành ĐÃ PHẢN HỒI');
            loadContacts();

            // Cập nhật selected contact nếu đang mở modal
            if (selectedContact && selectedContact.id === contactId) {
                setSelectedContact(prev => ({
                    ...prev,
                    status: 'RESPONDED',
                    respondedAt: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('❌ Error marking as responded:', error);
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    // Không cho phép chuyển ngược từ RESPONDED sang NEW
    const handleStatusChange = async (contactId, newStatus) => {
        if (newStatus === 'RESPONDED') {
            await handleMarkAsResponded(contactId);
        }
        // Không xử lý chuyển từ RESPONDED sang NEW
    };

    const handleDelete = async (contactId) => {
        try {
            await contactService.deleteContact(contactId);
            toast.success('Đã xóa liên hệ thành công');
            loadContacts();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('❌ Error deleting contact:', error);
            toast.error('Không thể xóa liên hệ');
        }
    };

    // Calculate statistics - Cập nhật theo status mới
    const stats = useMemo(() => {
        const total = contacts.length;
        const newContacts = contacts.filter(c => c.status === 'NEW').length;
        const responded = contacts.filter(c => c.status === 'RESPONDED').length;
        const today = contacts.filter(c => {
            if (!c.createdAt) return false;
            const contactDate = new Date(c.createdAt);
            const todayDate = new Date();
            return contactDate.toDateString() === todayDate.toDateString();
        }).length;

        return { total, new: newContacts, responded, today };
    }, [contacts]);

    // Format date for display
    const formatDateDisplay = (dateString) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            return format(date, 'dd/MM/yy', { locale: vi });
        } catch {
            return '';
        }
    };

    // Format full date
    const formatFullDate = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch {
            return 'N/A';
        }
    };

    // Get status badge style - Cập nhật theo NEW/RESPONDED
    const getStatusBadge = (status, contact) => {
        const styles = {
            NEW: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                icon: <Clock className="w-3 h-3" />,
                label: 'MỚI',
                canChange: true,
                actionText: 'Đánh dấu đã phản hồi'
            },
            RESPONDED: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                icon: <CheckCircle className="w-3 h-3" />,
                label: 'ĐÃ PHẢN HỒI',
                canChange: false,
                actionText: 'Đã phản hồi'
            }
        };

        const style = styles[status] || {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: null,
            label: status || 'KHÔNG XÁC ĐỊNH',
            canChange: false,
            actionText: ''
        };

        return (
            <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                    {style.icon}
                    {style.label}
                </span>
            </div>
        );
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronDown className="w-3 h-3 opacity-30" />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />;
    };

    // Pagination component
    const Pagination = () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
                <div className="text-xs text-gray-600">
                    Hiển thị {startItem} - {endItem} của {totalItems}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Số lượng:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="10">10 / trang</option>
                            <option value="20">20 / trang</option>
                            <option value="50">50 / trang</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || totalItems === 0}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            title="Trang trước"
                        >
                            ←
                        </button>

                        {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 flex items-center justify-center rounded text-xs ${
                                        currentPage === pageNum
                                            ? 'bg-blue-500 text-white font-medium'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalItems === 0}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            title="Trang sau"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Danh sách liên hệ</h1>
                        <p className="text-gray-600 text-sm">Quản lý và phản hồi các yêu cầu liên hệ từ khách hàng</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Tổng liên hệ</p>
                                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <Mail className="w-8 h-8 text-blue-500 opacity-80" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Liên hệ mới</p>
                                    <p className="text-xl font-bold text-blue-600">{stats.new}</p>
                                </div>
                                <Clock className="w-8 h-8 text-blue-500 opacity-80" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Đã phản hồi</p>
                                    <p className="text-xl font-bold text-green-600">{stats.responded}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500 opacity-80" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <button
                                onClick={loadContacts}
                                disabled={isLoading}
                                className="w-full h-full flex flex-col items-center justify-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-xs font-medium">{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-lg shadow-sm border p-3 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm tên, email, SĐT..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1">
                                    <Filter className="w-3 h-3 text-gray-500" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="NEW">Mới</option>
                                        <option value="RESPONDED">Đã phản hồi</option>
                                    </select>
                                </div>

                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    <option value="today">Hôm nay</option>
                                    <option value="week">7 ngày qua</option>
                                    <option value="month">30 ngày qua</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contacts Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {/* Table Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-base font-semibold text-gray-900">Danh sách liên hệ</h2>
                                <span className="text-xs text-gray-600">
                                    {filteredContacts.length} kết quả
                                </span>
                            </div>
                        </div>

                        {/* Table - 5 Columns với STT */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-12">
                                        STT
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 hover:text-gray-700"
                                        >
                                            Tên
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số điện thoại
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                        Trạng thái
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                        Hành động
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map((contact, index) => {
                                        const stt = startIndex + index + 1;
                                        const isNewContact = contact.status === 'NEW';

                                        return (
                                            <tr
                                                key={contact.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* STT Column */}
                                                <td className="px-3 py-2 text-center">
                                                    <div className="text-sm text-gray-700 font-medium">
                                                        {stt}
                                                    </div>
                                                </td>

                                                {/* Name Column */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center min-w-0">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                                                            isNewContact ? 'bg-blue-100' : 'bg-green-100'
                                                        }`}>
                                                            <User className={`w-4 h-4 ${
                                                                isNewContact ? 'text-blue-600' : 'text-green-600'
                                                            }`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div
                                                                className="font-medium text-gray-900 truncate max-w-[150px] text-sm"
                                                                title={contact.name || 'Khách hàng'}
                                                            >
                                                                {contact.name || 'Khách hàng'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email Column */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center min-w-0">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                                                        <span
                                                            className="text-sm text-gray-700 truncate max-w-[180px]"
                                                            title={contact.email}
                                                        >
                                                            {contact.email || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Phone Column */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center min-w-0">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700">
                                                            {contact.phone || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status Column */}
                                                <td className="px-3 py-2">
                                                    {getStatusBadge(contact.status, contact)}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleViewDetail(contact)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>


                                                        <button
                                                            onClick={() => handleAddNote(contact)}
                                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                            title="Thêm ghi chú"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setSelectedContact(contact);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-12 text-center">
                                            <Mail className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                            <p className="text-base font-medium text-gray-500 mb-1">
                                                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có liên hệ nào'}
                                            </p>
                                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                                {searchTerm
                                                    ? 'Thử thay đổi từ khóa tìm kiếm'
                                                    : 'Khách hàng sẽ xuất hiện khi họ gửi liên hệ'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            {/* Loading State */}
                            {isLoading && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 text-gray-500">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Đang tải danh sách...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalItems > 0 && <Pagination />}
                    </div>
                </div>

                {/* Modals */}
                {selectedContact && (
                    <>
                        <ContactDetailModal
                            isOpen={isDetailModalOpen}
                            onClose={() => setIsDetailModalOpen(false)}
                            contact={selectedContact}
                            onUpdate={loadContacts}
                            onStatusChange={handleStatusChange}
                        />

                        <ContactNoteModal
                            isOpen={isNoteModalOpen}
                            onClose={() => setIsNoteModalOpen(false)}
                            contactId={selectedContact.id}
                            onSuccess={loadContacts}
                        />

                        {/* Delete Confirmation Modal */}
                        {isDeleteModalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg p-5 max-w-sm w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">Xóa liên hệ</h3>
                                            <p className="text-gray-600 text-sm">Bạn có chắc chắn muốn xóa?</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <p className="font-medium text-gray-900 text-sm">{selectedContact.name}</p>
                                        <p className="text-gray-600 text-xs mt-1">{selectedContact.email}</p>
                                        <p className="text-gray-600 text-xs mt-1">Trạng thái: {selectedContact.status === 'NEW' ? 'Mới' : 'Đã phản hồi'}</p>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 text-sm hover:bg-gray-50"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedContact.id)}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminContactsPage;
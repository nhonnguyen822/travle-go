import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, MessageSquare, User, CheckCircle, Clock, Send, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import contactAPI from "../../../service/contactAPI";

const ContactDetailModal = ({ isOpen, onClose, contact, onUpdate }) => {
    const [isResponding, setIsResponding] = useState(false);
    const [responseNote, setResponseNote] = useState('');
    const [latestNote, setLatestNote] = useState(null);
    const [loadingNote, setLoadingNote] = useState(false);

    useEffect(() => {
        if (isOpen && contact?.id) {
            if (contact.respondedAt) {
                fetchLatestNote();
            } else {
                setLatestNote(null); // Reset nếu chưa phản hồi
            }
        }
    }, [isOpen, contact?.id, contact?.respondedAt]);

    const fetchLatestNote = async () => {
        try {
            setLoadingNote(true);
            const response = await contactAPI.getLatestNote(contact.id);
            console.log(response.data)
            setLatestNote(response.data); // response.data là ContactNote object
        } catch (error) {
            console.error('Error fetching latest note:', error);
            setLatestNote(null);
        } finally {
            setLoadingNote(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch {
            return 'N/A';
        }
    };

    const formatShortDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy', { locale: vi });
        } catch {
            return '';
        }
    };

    const handleRespond = async () => {
        if (!responseNote.trim()) {
            toast.warning('Vui lòng nhập ghi chú phản hồi');
            return;
        }

        try {
            setIsResponding(true);
            await contactAPI.markAsResponded(contact.id, { note: responseNote });
            toast.success('Đã đánh dấu đã phản hồi');
            onUpdate(); // Cập nhật danh sách
            fetchLatestNote(); // Load lại ghi chú mới
            // KHÔNG đóng modal ngay để user thấy kết quả
            // onClose();
        } catch (error) {
            console.error('❌ Error responding:', error);
            toast.error('Không thể gửi phản hồi');
        } finally {
            setIsResponding(false);
        }
    };

    const isNotResponded = !contact.respondedAt;

    if (!isOpen || !contact) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            isNotResponded ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                        }`}>
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Chi tiết liên hệ</h2>
                            <p className="text-sm text-gray-500">
                                {formatShortDate(contact.createdAt)} • {formatDate(contact.createdAt).split(' ')[1]}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                        {/* Left Column - Customer Info */}
                        <div className="lg:col-span-1 border-r border-gray-200 p-6 bg-gray-50">
                            <div className="space-y-6">
                                {/* Customer Avatar & Status */}
                                <div className="flex flex-col items-center text-center pb-4 border-b border-gray-200">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                                        isNotResponded ? 'bg-yellow-100' : 'bg-green-100'
                                    }`}>
                                        <User className={`w-8 h-8 ${
                                            isNotResponded ? 'text-yellow-600' : 'text-green-600'
                                        }`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{contact.name || 'Khách hàng'}</h3>
                                    <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium mt-2 ${
                                        isNotResponded ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {isNotResponded ? (
                                            <>
                                                <Clock className="w-3.5 h-3.5" />
                                                Chưa phản hồi
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Đã phản hồi
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">
                                        Thông tin liên hệ
                                    </h4>

                                    <div className="space-y-3">
                                        {contact.email && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                    <Mail className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="text-gray-900 font-medium">{contact.email}</p>
                                                </div>
                                            </div>
                                        )}

                                        {contact.phone && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Số điện thoại</p>
                                                    <p className="text-gray-900 font-medium">{contact.phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Thời gian gửi</p>
                                                <p className="text-gray-900 font-medium">{formatDate(contact.createdAt)}</p>
                                            </div>
                                        </div>

                                        {contact.tourInterest && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Tour quan tâm</p>
                                                <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 inline-block">
                                                    <p className="text-blue-600 font-medium">{contact.tourInterest}</p>
                                                </div>
                                            </div>
                                        )}

                                        {contact.preferredContact && (
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Ưu tiên liên hệ</p>
                                                <p className="text-gray-900 font-medium">{contact.preferredContact}</p>
                                            </div>
                                        )}

                                        {/* Thời gian phản hồi nếu đã phản hồi */}
                                        {!isNotResponded && contact.respondedAt && (
                                            <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                                                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Phản hồi lúc</p>
                                                    <p className="text-green-700 font-medium">{formatDate(contact.respondedAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Message & Response */}
                        <div className="lg:col-span-2 p-6">
                            <div className="space-y-6">
                                {/* Message Content */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-bold text-gray-900">Nội dung liên hệ</h3>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {contact.message || 'Không có nội dung'}
                                        </p>
                                    </div>
                                </div>

                                {/* Response Section */}
                                {isNotResponded ? (
                                    <div className="border border-yellow-200 rounded-lg p-5 bg-yellow-50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                <Send className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Phản hồi khách hàng</h3>
                                                <p className="text-sm text-gray-600">
                                                    Liên hệ này chưa được phản hồi. Hãy nhập nội dung phản hồi và xác nhận.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nội dung phản hồi <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={responseNote}
                                                    onChange={(e) => setResponseNote(e.target.value)}
                                                    placeholder="Nhập nội dung phản hồi (ví dụ: Đã gọi điện tư vấn tour, gửi email báo giá, cập nhật thông tin...)"
                                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                                                    rows="4"
                                                />
                                                <div className="text-xs text-gray-500 mt-2">
                                                    <p>Ghi chú này sẽ được lưu làm nội dung phản hồi</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-yellow-100">
                                                <button
                                                    onClick={onClose}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleRespond}
                                                    disabled={isResponding || !responseNote.trim()}
                                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                                                >
                                                    {isResponding ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Đang xử lý...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Xác nhận đã phản hồi
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-green-200 rounded-lg p-5 bg-green-50">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Đã phản hồi khách hàng</h3>
                                                <p className="text-sm text-gray-600">
                                                    Liên hệ đã được xử lý thành công
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Thông tin phản hồi */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-lg border border-green-100">
                                                    <p className="text-sm text-gray-500 mb-1">Thời gian phản hồi</p>
                                                    <p className="text-gray-900 font-medium">
                                                        {formatDate(contact.respondedAt)}
                                                    </p>
                                                </div>

                                                <div className="bg-white p-3 rounded-lg border border-green-100">
                                                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                                        <CheckCircle className="w-3 h-3" />
                                                        ĐÃ HOÀN TẤT
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hiển thị ghi chú phản hồi */}
                                            {loadingNote ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="ml-2 text-gray-600">Đang tải nội dung phản hồi...</span>
                                                </div>
                                            ) : latestNote ? (
                                                <div className="bg-white p-4 rounded-lg border border-green-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-green-600" />
                                                            <h4 className="font-medium text-gray-900">Nội dung ghi chú</h4>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                            {latestNote.content || latestNote.note}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-yellow-600" />
                                                        <p className="text-yellow-700">
                                                            Không có nội dung phản hồi được lưu
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Thông báo không thể sửa */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-sm text-blue-700">
                                                    <span className="font-medium">Lưu ý:</span> Liên hệ đã hoàn tất.
                                                    Nếu cần thêm thông tin, hãy sử dụng chức năng thêm ghi chú mới.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer với nút đóng */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactDetailModal;
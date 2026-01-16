import React, { useState } from 'react';
import { X, FileText, Send } from 'lucide-react';
import contactAPI from '../../../service/contactAPI';
import { toast } from 'react-toastify';

const ContactNoteModal = ({ isOpen, onClose, contactId, onSuccess }) => {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!note.trim()) {
            toast.warning('Vui lòng nhập nội dung ghi chú');
            return;
        }

        try {
            setIsSubmitting(true);
            await contactAPI.addNote(contactId, { content: note });
            toast.success('Đã thêm ghi chú thành công');
            setNote('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('❌ Error adding note:', error);
            toast.error('Không thể thêm ghi chú');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Thêm ghi chú</h2>
                            <p className="text-sm text-gray-600">ID: #{contactId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung ghi chú
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập ghi chú về liên hệ này..."
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows="5"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Ghi chú chỉ hiển thị với quản trị viên, không gửi cho khách hàng
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !note.trim()}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Đang lưu...' : 'Lưu ghi chú'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactNoteModal;
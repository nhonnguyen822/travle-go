package com.example.travelgo.service;

import com.example.travelgo.entity.ChatRoom;
import com.example.travelgo.repository.IChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminChatService implements IAdminChatService {

    private final IChatRoomRepository chatRoomRepository;
    private final ChatService chatService;

    @Override
    public List<ChatRoom> getAllChatRooms() {
        return chatRoomRepository.findAll();
    }

    @Override
    public List<ChatRoom> getActiveChatRooms() {
        return List.of();
    }

    @Override
    public List<ChatRoom> getClosedChatRooms() {
        return List.of();
    }

    @Override
    public Optional<ChatRoom> getRoomById(String roomId) {
        return Optional.empty();
    }

    @Override
    public boolean closeChatRoom(String roomId) {
        return false;
    }

    @Override
    public long getActiveRoomCount() {
        return 0;
    }

//    @Override
//    public List<ChatRoom> getActiveChatRooms() {
//        return chatRoomRepository.findActiveRooms();
//    }
//
//    @Override
//    public List<ChatRoom> getClosedChatRooms() {
//        return chatRoomRepository.findByIsActiveOrderByLastActivityDesc(false);
//    }
//
//    @Override
//    public Optional<ChatRoom> getRoomById(String roomId) {
//        return chatRoomRepository.findByRoomId(Long.valueOf(roomId));
//    }
//
//    @Transactional
//    @Override
//    public boolean closeChatRoom(String roomId) {
//        return chatService.closeRoom(roomId);
//    }
//
//    @Override
//    public long getActiveRoomCount() {
//        return chatRoomRepository.countActiveRooms();
//    }

    @Override
    public long getTotalRoomCount() {
        return chatRoomRepository.count();
    }
}
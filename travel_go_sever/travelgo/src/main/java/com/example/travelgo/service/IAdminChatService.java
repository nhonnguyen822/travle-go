package com.example.travelgo.service;

import com.example.travelgo.entity.ChatRoom;

import java.util.List;
import java.util.Optional;

public interface IAdminChatService {
    List<ChatRoom> getAllChatRooms();
    List<ChatRoom> getActiveChatRooms();
    List<ChatRoom> getClosedChatRooms();
    Optional<ChatRoom> getRoomById(String roomId);
    boolean closeChatRoom(String roomId);
    long getActiveRoomCount();
    long getTotalRoomCount();
}

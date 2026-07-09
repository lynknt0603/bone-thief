package com.bonethief.config;

import com.bonethief.domain.model.Player;
import com.bonethief.domain.model.Room;
import com.bonethief.repository.RoomRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Principal;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final RoomRepository roomRepository;

    public WebSocketAuthInterceptor(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            validateConnect(accessor);
        }
        return message;
    }

    private void validateConnect(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        String roomCode = accessor.getFirstNativeHeader("roomCode");
        String playerId = accessor.getFirstNativeHeader("playerId");
        String playerToken = accessor.getFirstNativeHeader("playerToken");
        if (principal == null || playerId == null || !principal.getName().equals(playerId) || !isValidPlayerSession(roomCode, playerId, playerToken)) {
            throw new IllegalArgumentException("Invalid WebSocket player session.");
        }
    }

    private boolean isValidPlayerSession(String roomCode, String playerId, String playerToken) {
        if (roomCode == null || roomCode.isBlank() || playerId == null || playerId.isBlank()) {
            return false;
        }
        return roomRepository.findByCode(roomCode.trim().toUpperCase())
                .map(room -> hasValidPlayerSession(room, playerId, playerToken))
                .orElse(false);
    }

    private boolean hasValidPlayerSession(Room room, String playerId, String playerToken) {
        synchronized (room) {
            Player player = room.getPlayers().get(playerId);
            return player != null && tokensMatch(player.getSessionToken(), playerToken);
        }
    }

    private boolean tokensMatch(String expected, String candidate) {
        if (expected == null || candidate == null || candidate.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), candidate.getBytes(StandardCharsets.UTF_8));
    }
}

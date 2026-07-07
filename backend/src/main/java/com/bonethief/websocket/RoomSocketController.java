package com.bonethief.websocket;

import com.bonethief.dto.ChatDto;
import com.bonethief.dto.GameDto;
import com.bonethief.dto.RoomDto;
import com.bonethief.exception.BadRequestException;
import com.bonethief.service.RoomService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class RoomSocketController {
    private final RoomService roomService;

    public RoomSocketController(RoomService roomService) {
        this.roomService = roomService;
    }

    @MessageMapping("/rooms/{roomCode}/ready")
    public void ready(@DestinationVariable String roomCode, @Payload RoomDto.ReadyRequest request, Principal principal) {
        try {
            String playerId = resolvePlayerId(request.playerId(), principal);
            roomService.setReady(roomCode, new RoomDto.ReadyRequest(playerId, request.ready()));
        } catch (RuntimeException exception) {
            roomService.sendError(principalName(principal), exception.getMessage());
        }
    }

    @MessageMapping("/rooms/{roomCode}/start")
    public void start(@DestinationVariable String roomCode, @Payload RoomDto.PlayerRequest request, Principal principal) {
        try {
            roomService.startGame(roomCode, new RoomDto.PlayerRequest(resolvePlayerId(request.playerId(), principal)));
        } catch (RuntimeException exception) {
            roomService.sendError(principalName(principal), exception.getMessage());
        }
    }

    @MessageMapping("/rooms/{roomCode}/action")
    public void action(@DestinationVariable String roomCode, @Payload GameDto.PlayerActionRequest request, Principal principal) {
        try {
            String playerId = resolvePlayerId(request.playerId(), principal);
            roomService.handleAction(roomCode, new GameDto.PlayerActionRequest(playerId, request.type(), request.targetPlayerId(), request.targetPlayerIds(), request.selectedWakeTime()));
        } catch (RuntimeException exception) {
            roomService.sendError(principalName(principal), exception.getMessage());
        }
    }

    @MessageMapping("/rooms/{roomCode}/chat")
    public void chat(@DestinationVariable String roomCode, @Payload ChatDto.MessageRequest request, Principal principal) {
        try {
            String playerId = resolvePlayerId(request.playerId(), principal);
            roomService.sendChatMessage(roomCode, new ChatDto.MessageRequest(playerId, request.message()));
        } catch (RuntimeException exception) {
            roomService.sendError(principalName(principal), exception.getMessage());
        }
    }

    private String resolvePlayerId(String requestPlayerId, Principal principal) {
        String principalName = principalName(principal);
        if (requestPlayerId != null && !requestPlayerId.isBlank() && !requestPlayerId.equals(principalName)) {
            throw new BadRequestException("WebSocket playerId không khớp phiên hiện tại.");
        }
        if (principalName == null || principalName.isBlank()) {
            throw new BadRequestException("Thiếu playerId trong kết nối WebSocket.");
        }
        return principalName;
    }

    private String principalName(Principal principal) {
        return principal == null ? null : principal.getName();
    }
}

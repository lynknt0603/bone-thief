package com.bonethief.controller;

import com.bonethief.dto.GameDto;
import com.bonethief.dto.RoomDto;
import com.bonethief.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public RoomDto.JoinResponse createRoom(@RequestBody(required = false) RoomDto.CreateRequest request) {
        return roomService.createRoom(request == null ? new RoomDto.CreateRequest(null, null, null, null) : request);
    }

    @PostMapping("/{roomCode}/join")
    public RoomDto.JoinResponse joinRoom(@PathVariable String roomCode, @RequestBody(required = false) RoomDto.JoinRequest request) {
        return roomService.joinRoom(roomCode, request == null ? new RoomDto.JoinRequest(null, null) : request);
    }

    @GetMapping("/{roomCode}")
    public RoomDto.PublicRoom getRoom(@PathVariable String roomCode) {
        return roomService.getPublicRoom(roomCode);
    }

    @GetMapping("/{roomCode}/players/{playerId}/private-state")
    public GameDto.PrivateState getPrivateState(@PathVariable String roomCode, @PathVariable String playerId) {
        return roomService.getPrivateState(roomCode, playerId);
    }

    @PostMapping("/{roomCode}/settings")
    public RoomDto.PublicRoom updateSettings(@PathVariable String roomCode, @RequestBody RoomDto.SettingsRequest request) {
        return roomService.updateSettings(roomCode, request);
    }

    @PostMapping("/{roomCode}/display-name")
    public RoomDto.PublicRoom updateDisplayName(@PathVariable String roomCode, @RequestBody RoomDto.UpdateDisplayNameRequest request) {
        return roomService.updateDisplayName(roomCode, request);
    }

    @PostMapping("/{roomCode}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable String roomCode, @RequestBody RoomDto.PlayerRequest request) {
        roomService.leaveRoom(roomCode, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roomCode}/kick")
    public RoomDto.PublicRoom kickPlayer(@PathVariable String roomCode, @RequestBody RoomDto.KickPlayerRequest request) {
        return roomService.kickPlayer(roomCode, request);
    }

    @PostMapping("/{roomCode}/start")
    public RoomDto.PublicRoom startGame(@PathVariable String roomCode, @RequestBody RoomDto.PlayerRequest request) {
        return roomService.startGame(roomCode, request);
    }

    @PostMapping("/{roomCode}/restart")
    public RoomDto.PublicRoom restartGame(@PathVariable String roomCode, @RequestBody RoomDto.PlayerRequest request) {
        return roomService.restartGame(roomCode, request);
    }
}

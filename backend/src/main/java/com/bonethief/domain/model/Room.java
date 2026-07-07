package com.bonethief.domain.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Room {
    private final String roomCode;
    private final Instant createdAt;
    private final Map<String, Player> players = new LinkedHashMap<>();
    private final List<ChatMessage> chatMessages = new ArrayList<>();
    private RoomSettings settings;
    private GameState gameState;

    public Room(String roomCode, RoomSettings settings) {
        this.roomCode = roomCode;
        this.settings = settings;
        this.gameState = new GameState();
        this.createdAt = Instant.now();
    }

    public String getRoomCode() {
        return roomCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Map<String, Player> getPlayers() {
        return players;
    }

    public List<ChatMessage> getChatMessages() {
        return chatMessages;
    }

    public RoomSettings getSettings() {
        return settings;
    }

    public void setSettings(RoomSettings settings) {
        this.settings = settings;
    }

    public GameState getGameState() {
        return gameState;
    }

    public void setGameState(GameState gameState) {
        this.gameState = gameState;
    }
}

package com.bonethief.dto;

public class ChatDto {
    public record MessageRequest(String playerId, String message) {
    }

    public record Message(String id, String senderPlayerId, String senderNickname, String message, Long sentAtEpochMs) {
    }
}

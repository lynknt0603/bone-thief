package com.bonethief.domain.model;

public record ChatMessage(String id, String playerId, String senderPlayerId, String senderNickname, String message,
                          long sentAtEpochMs) {
}

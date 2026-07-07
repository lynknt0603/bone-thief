package com.bonethief.domain.model;

import java.util.List;

public record PeekResult(String targetPlayerId, String targetNickname, List<Integer> wakeTimes) {
    public PeekResult(String targetPlayerId, String targetNickname, List<Integer> wakeTimes) {
        this.targetPlayerId = targetPlayerId;
        this.targetNickname = targetNickname;
        this.wakeTimes = List.copyOf(wakeTimes);
    }
}

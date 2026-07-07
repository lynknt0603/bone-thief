package com.bonethief.domain.model;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

public record GameResult(WinningPack winningPack, Set<String> revealedPlayerIds, String boneThiefPlayerId,
                         Set<String> packmatePlayerIds, Map<String, String> votes, Map<String, Role> finalRoles) {
    public GameResult(WinningPack winningPack, Set<String> revealedPlayerIds, String boneThiefPlayerId, Set<String> packmatePlayerIds, Map<String, String> votes, Map<String, Role> finalRoles) {
        this.winningPack = winningPack;
        this.revealedPlayerIds = new LinkedHashSet<>(revealedPlayerIds);
        this.boneThiefPlayerId = boneThiefPlayerId;
        this.packmatePlayerIds = new LinkedHashSet<>(packmatePlayerIds);
        this.votes = new LinkedHashMap<>(votes);
        this.finalRoles = new LinkedHashMap<>(finalRoles);
    }
}

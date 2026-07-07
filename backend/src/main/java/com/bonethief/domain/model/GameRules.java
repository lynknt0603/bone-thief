package com.bonethief.domain.model;

public final class GameRules {
    private GameRules() {
    }

    public static int plannedPackmateCount(int maxPlayers) {
        return switch (maxPlayers) {
            case 5, 6 -> 1;
            case 7, 8 -> 2;
            default -> 0;
        };
    }

    public static int maxAwakeTogether(int maxPlayers) {
        return maxPlayers - plannedPackmateCount(maxPlayers) - 1;
    }

    public static boolean isYardSideAwakeRole(Role role) {
        return role == Role.YARD_DOG || role == Role.WHITE_DOG;
    }

    public static boolean isThiefAlignedPlayer(GameState state, String playerId, Role role) {
        return role == Role.PACKMATE || state.getPackmates().contains(playerId);
    }
}

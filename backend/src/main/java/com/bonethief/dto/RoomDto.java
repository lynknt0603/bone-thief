package com.bonethief.dto;

import com.bonethief.domain.model.GamePhase;
import com.bonethief.domain.model.RoomLanguage;

import java.util.List;

public class RoomDto {
    public record CreateRequest(String nickname, Integer maxPlayers, String password, RoomLanguage language) {
    }

    public record JoinRequest(String nickname, String password) {
    }

    public record JoinResponse(String playerId, PublicRoom room, GameDto.PrivateState privateState) {
    }

    public record KickPlayerRequest(String playerId, String targetPlayerId) {
    }

    public record PlayerRequest(String playerId) {
    }

    public record ReadyRequest(String playerId, boolean ready) {
    }

    public record UpdateDisplayNameRequest(String playerId, String nickname) {
    }

    public record SettingsRequest(String playerId, Integer maxPlayers, Integer nightSeconds,
                                  Integer packSelectionSeconds, RoomLanguage language, String password,
                                  Boolean whiteDogEnabled) {
    }

    public record Settings(int maxPlayers, int nightSeconds, int packSelectionSeconds, int discussionSeconds,
                           int votingSeconds, RoomLanguage language, boolean passwordProtected,
                           boolean whiteDogEnabled) {
    }

    public record PublicPlayer(String id, String nickname, boolean host, boolean ready, boolean hasVoted) {
    }

    public record PublicRoom(String roomCode, GamePhase phase, Integer currentHour, Long serverTimeEpochMs,
                             Long phaseDeadlineEpochMs, boolean boneMissing, String hostPlayerId, Settings settings,
                             List<PublicPlayer> players, int roundNumber, int requiredPackmateCount,
                             GameDto.GameResult result, List<ChatDto.Message> chatMessages) {
    }
}

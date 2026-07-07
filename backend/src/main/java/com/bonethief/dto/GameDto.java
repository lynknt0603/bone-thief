package com.bonethief.dto;

import com.bonethief.domain.model.PlayerActionType;
import com.bonethief.domain.model.Role;
import com.bonethief.domain.model.WinningPack;

import java.util.List;

public class GameDto {
    public record PlayerActionRequest(String playerId, PlayerActionType type, String targetPlayerId,
                                      List<String> targetPlayerIds, Integer selectedWakeTime) {
    }

    public record PrivateState(String playerId, String publicPlayerId, Role role, List<Integer> wakeTimes,
                               List<Integer> diceRolls, boolean awake, List<PlayerHint> awakePlayers,
                               List<PlayerActionType> allowedActions, List<PeekResult> peekResults,
                               List<CoAwakeRecord> coAwakeRecords, List<Integer> witnessedBoneTakenHours,
                               List<WitnessedBoneTheft> witnessedBoneThefts, List<PlayerHint> knownPackmates,
                               PlayerHint knownBoneThief, List<PlayerHint> selectablePlayers,
                               int requiredSelectionCount, String message) {
    }

    public record PlayerHint(String id, String nickname) {
    }

    public record CoAwakeRecord(int hour, List<PlayerHint> players) {
    }

    public record PeekResult(String targetPlayerId, String targetNickname, List<Integer> wakeTimes) {
    }

    public record WitnessedBoneTheft(int hour, PlayerHint thief) {
    }

    public record GameResult(WinningPack winningPack, List<PlayerRole> revealedPlayers, PlayerRole boneThief,
                             List<PlayerRole> packmates, List<VoteResult> votes, List<PlayerRole> finalRoles) {
    }

    public record PlayerRole(String playerId, String nickname, Role role) {
    }

    public record VoteResult(String voterId, String voterNickname, String targetId, String targetNickname) {
    }
}

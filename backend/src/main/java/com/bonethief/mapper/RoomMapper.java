package com.bonethief.mapper;

import com.bonethief.domain.model.*;
import com.bonethief.dto.ChatDto;
import com.bonethief.dto.GameDto;
import com.bonethief.dto.RoomDto;
import com.bonethief.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static com.bonethief.domain.model.GameRules.isThiefAlignedPlayer;
import static com.bonethief.domain.model.GameRules.isYardSideAwakeRole;

@Component
public class RoomMapper {
    private static final int VOTING_SECONDS = 60;

    public RoomDto.PublicRoom toPublicRoom(Room room) {
        GameState state = room.getGameState();
        String hostId = room.getPlayers().values().stream().filter(Player::isHost).map(Player::getPublicId).findFirst().orElse(null);
        GamePhase publicPhase = publicPhase(state);
        boolean showVotes = state.getPhase() == GamePhase.VOTING || state.getPhase() == GamePhase.RESULT;
        List<RoomDto.PublicPlayer> players = room.getPlayers().values().stream().map(player -> new RoomDto.PublicPlayer(player.getPublicId(), player.getNickname(), player.isHost(), player.isReady(), showVotes && state.getVotes().containsKey(player.getId()))).toList();
        boolean boneMissing = (state.getPhase() == GamePhase.DISCUSSION || state.getPhase() == GamePhase.VOTING || state.getPhase() == GamePhase.RESULT) && state.isBoneTaken();
        Integer currentHour = publicPhase == GamePhase.NIGHT_HOUR ? state.getCurrentHour() : null;
        int requiredPackmateCount = publicPhase == GamePhase.PACK_SELECTION ? state.getPendingPackCount() : 0;
        GameDto.GameResult result = state.getPhase() == GamePhase.RESULT ? toGameResultDto(room, state.getResult()) : null;
        return new RoomDto.PublicRoom(room.getRoomCode(), publicPhase, currentHour, Instant.now().toEpochMilli(), state.getPhaseDeadlineEpochMs(), boneMissing, hostId, new RoomDto.Settings(room.getSettings().getMaxPlayers(), room.getSettings().getNightSeconds(), room.getSettings().getPackSelectionSeconds(), discussionSeconds(room), VOTING_SECONDS, room.getSettings().getLanguage(), room.getSettings().isPasswordProtected(), room.getSettings().isWhiteDogEnabled()), players, state.getRoundNumber(), requiredPackmateCount, result, room.getChatMessages().stream().map(this::toChatDto).toList());
    }

    public GameDto.PrivateState toPrivateState(Room room, String playerId) {
        GameState state = room.getGameState();
        Player player = room.getPlayers().get(playerId);
        if (player == null) {
            throw new BadRequestException("Player không thuộc phòng này.");
        }
        Role role = state.getRoles().get(playerId);
        boolean awake = state.isPlayerAwakeNow(playerId);
        List<GameDto.PlayerHint> awakePlayers = awake ? state.awakePlayerIds().stream().filter(id -> !id.equals(playerId)).sorted(byJoinOrder(room)).map(id -> toHint(room, id)).toList() : List.of();
        List<GameDto.PlayerHint> knownPackmates = knownPackmates(room, playerId, role);
        GameDto.PlayerHint knownBoneThief = knownBoneThief(room, playerId, role);
        List<GameDto.PlayerHint> selectablePlayers = selectablePlayers(room, playerId, role);
        return new GameDto.PrivateState(
                player.getId(),
                player.getPublicId(),
                role,
                state.wakeTimesFor(playerId),
                state.getDiceRolls().getOrDefault(playerId, List.of()),
                awake,
                awakePlayers,
                allowedActions(room, playerId, role, awake),
                state.getPeekResults().getOrDefault(playerId, List.of()).stream().map(result -> {
                    Player target = room.getPlayers().get(result.targetPlayerId());
                    String publicId = target == null ? result.targetPlayerId() : target.getPublicId();
                    return new GameDto.PeekResult(publicId, result.targetNickname(), result.wakeTimes());
                }).toList(),
                coAwakeRecords(room, playerId),
                state.getWitnessedBoneTakenHours().getOrDefault(playerId, List.of()),
                witnessedBoneThefts(room, playerId),
                state.getObservedBonePresentHours().getOrDefault(playerId, List.of()),
                state.getObservedBoneMissingHours().getOrDefault(playerId, List.of()),
                knownPackmates,
                knownBoneThief,
                selectablePlayers,
                state.getPhase() == GamePhase.PACK_SELECTION && role == Role.BONE_THIEF ? state.getPendingPackCount() : 0,
                privateMessage(room, playerId, role, awake)
        );
    }

    public ChatDto.Message toChatDto(ChatMessage message) {
        return new ChatDto.Message(message.id(), message.senderPlayerId(), message.senderNickname(), message.message(), message.sentAtEpochMs());
    }

    private GamePhase publicPhase(GameState state) {
        if (state.getPhase() == GamePhase.PACK_SELECTION && state.getPackSelectionMode() == PackSelectionMode.WITNESS) {
            return GamePhase.NIGHT_HOUR;
        }
        return state.getPhase();
    }

    private int discussionSeconds(Room room) {
        return Math.max(1, room.getPlayers().size() - 1) * 60;
    }

    private Comparator<String> byJoinOrder(Room room) {
        List<String> joinOrder = new ArrayList<>(room.getPlayers().keySet());
        return Comparator.comparingInt(joinOrder::indexOf);
    }

    private List<GameDto.CoAwakeRecord> coAwakeRecords(Room room, String playerId) {
        return room.getGameState().getCoAwakePlayerIds().getOrDefault(playerId, Map.of()).entrySet().stream().sorted(Map.Entry.comparingByKey()).map(entry -> new GameDto.CoAwakeRecord(entry.getKey(), entry.getValue().stream().sorted(byJoinOrder(room)).map(id -> toHint(room, id)).toList())).toList();
    }

    private List<GameDto.WitnessedBoneTheft> witnessedBoneThefts(Room room, String playerId) {
        GameState state = room.getGameState();
        List<Integer> witnessedHours = state.getWitnessedBoneTakenHours().getOrDefault(playerId, List.of());
        if (witnessedHours.isEmpty()) {
            return List.of();
        }
        GameDto.PlayerHint thief = toHint(room, findBoneThiefId(state));
        return witnessedHours.stream().map(hour -> new GameDto.WitnessedBoneTheft(hour, thief)).toList();
    }

    private List<PlayerActionType> allowedActions(Room room, String playerId, Role role, boolean awake) {
        GameState state = room.getGameState();
        if (state.getPhase() == GamePhase.WAKE_SELECTION && isYardSideAwakeRole(role) && !state.hasSelectedWakeTime(playerId)) {
            return List.of(PlayerActionType.SELECT_WAKE_TIME);
        }
        if (state.getPhase() == GamePhase.NIGHT_HOUR && awake) {
            if (state.hasPlayerCompletedCurrentHour(playerId)) {
                return List.of();
            }
            if (role == Role.BONE_THIEF && !state.isBoneTaken()) {
                if (canThiefDelay(room, playerId)) {
                    return List.of(PlayerActionType.TAKE_BONE, PlayerActionType.WAIT);
                }
                return List.of(PlayerActionType.TAKE_BONE);
            }
            if (canPeek(room, playerId)) {
                return List.of(PlayerActionType.PEEK_WAKE_TIME, PlayerActionType.WAIT);
            }
            return List.of(PlayerActionType.WAIT);
        }
        if (state.getPhase() == GamePhase.PACK_SELECTION && role == Role.BONE_THIEF) {
            return List.of(PlayerActionType.SELECT_PACKMATE);
        }
        if (state.getPhase() == GamePhase.DISCUSSION && room.getPlayers().get(playerId).isHost()) {
            return List.of(PlayerActionType.START_VOTE);
        }
        if (state.getPhase() == GamePhase.VOTING && !state.getVotes().containsKey(playerId)) {
            return List.of(PlayerActionType.VOTE);
        }
        return List.of();
    }

    private List<GameDto.PlayerHint> knownPackmates(Room room, String playerId, Role role) {
        GameState state = room.getGameState();
        if (role == Role.BONE_THIEF) {
            return state.getPackmates().stream().sorted(byJoinOrder(room)).map(id -> toHint(room, id)).toList();
        }
        if (isThiefAlignedPlayer(state, playerId, role)) {
            return state.getPackmates().stream().filter(id -> !id.equals(playerId)).sorted(byJoinOrder(room)).map(id -> toHint(room, id)).toList();
        }
        return List.of();
    }

    private GameDto.PlayerHint knownBoneThief(Room room, String playerId, Role role) {
        if (!isThiefAlignedPlayer(room.getGameState(), playerId, role) || room.getSettings().getMaxPlayers() == 7) {
            return null;
        }
        return toHint(room, findBoneThiefId(room.getGameState()));
    }

    private List<GameDto.PlayerHint> selectablePlayers(Room room, String playerId, Role role) {
        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.PACK_SELECTION || role != Role.BONE_THIEF) {
            return List.of();
        }
        return state.getPendingPackCandidates().stream().filter(id -> !id.equals(playerId)).sorted(byJoinOrder(room)).map(id -> toHint(room, id)).toList();
    }

    private String privateMessage(Room room, String playerId, Role role, boolean awake) {
        GameState state = room.getGameState();
        if (state.getPhase() == GamePhase.LOBBY) {
            return text(room, "Đợi đủ Dog rồi host sẽ bắt đầu ván.", "Wait for the pack to gather. The host will start the game.");
        }
        if (state.getPhase() == GamePhase.WAKE_SELECTION) {
            if (isYardSideAwakeRole(role) && !state.hasSelectedWakeTime(playerId)) {
                return text(room, "Chọn 1 trong 2 giờ thức bí mật. Bạn chỉ hành động ở giờ đã chọn.", "Choose 1 of your 2 secret wake times. You only act on the chosen hour.");
            }
            return text(room, "Đợi các Dog Canh Sân chọn giờ thức bí mật.", "Wait for the Yard Dogs to choose their secret wake time.");
        }
        if (state.getPhase() == GamePhase.NIGHT_HOUR) {
            if (!awake) {
                return text(room, "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình.", "You are asleep in your kennel. Keep your secret and wait.");
            }
            if (state.hasPlayerCompletedCurrentHour(playerId)) {
                return text(room, "Bạn đã xong lượt ở canh giờ này. Chờ tiếng gọi giờ tiếp theo.", "You are done for this hour. Wait for the next wake call.");
            }
            if (role == Role.BONE_THIEF && !state.isBoneTaken()) {
                return text(room, "Bạn đang thức. Hãy lấy xương thật gọn.", "You are awake. Take the bone quietly.");
            }
            if (canPeek(room, playerId)) {
                return text(room, "Bạn thức một mình. Có thể xem dấu vết giờ thức của một Dog khác.", "You are awake alone. You may peek at another Dog's wake time.");
            }
            return text(room, "Bạn đang thức. Không có dấu vết riêng để xem ở giờ này.", "You are awake. There is no private clue to peek at this hour.");
        }
        if (state.getPhase() == GamePhase.PACK_SELECTION) {
            if (role == Role.BONE_THIEF && state.getPackSelectionMode() == PackSelectionMode.WITNESS) {
                return text(room, "Bạn vừa bị nhìn thấy. Chọn 1 nhân chứng sẽ đứng về phía mình.", "You were seen. Choose 1 witness to join your side.");
            }
            if (role == Role.BONE_THIEF) {
                return text(room, "Chọn Dog sẽ đứng về phía bạn.", "Choose the Dog who will join your side.");
            }
            if (state.getPackSelectionMode() == PackSelectionMode.WITNESS && state.getPendingPackCandidates().contains(playerId)) {
                return text(room, "Bạn vừa thấy xương bị lấy. Đợi một nhịp để xử lý lựa chọn bí mật, sau đó bạn sẽ tiếp tục canh giờ này.", "You saw the bone being taken. Wait for a secret choice to finish, then this hour will continue.");
            }
            return text(room, "Đợi lựa chọn bí mật hoàn tất.", "Wait for the secret choice to finish.");
        }
        if (state.getPhase() == GamePhase.DISCUSSION) {
            if (role == Role.BONE_THIEF) {
                return text(room, "Hãy cố gắng tránh bị đàn chó phát hiện và buộc tội.", "Try to avoid being detected and accused by the pack.");
            } else if (role == Role.WHITE_DOG && state.getPackmates().contains(playerId)) {
                return text(room, "Bạn là Chó Trắng đã vào bầy trộm. Bạn vẫn thắng một mình nếu bị vote treo cổ, hoặc thắng chung nếu Chó Trộm Xương không bị phát hiện.", "You are the White Dog recruited into the thief pack. You still win alone if voted out, or win with the thief pack if the Bone Thief escapes.");
            } else if (isThiefAlignedPlayer(state, playerId, role)) {
                return text(room, "Hãy bảo vệ cho chó trộm xương không bị phát hiện.", "Protect the bone thief from being detected.");
            } else if (role == Role.WHITE_DOG) {
                return text(room, "Bạn là Chó Trắng. Nếu bị cả đàn vote treo cổ, bạn thắng một mình.", "You are the White Dog. If the pack votes you out, you win alone.");
            } else {
                return text(room, "Hãy cùng đàn chó truy tìm kẻ trộm xương.", "Join the pack in searching for the bone thief.");
            }
        }
        if (state.getPhase() == GamePhase.VOTING) {
            return state.getVotes().containsKey(playerId) ? text(room, "Bạn đã vote. Chờ các Dog còn lại.", "You have voted. Wait for the other Dogs.") : text(room, "Chọn Dog bạn nghi đã lấy xương.", "Choose the Dog you suspect took the bone.");
        }
        if (state.getPhase() == GamePhase.RESULT) {
            return text(room, "Ván đã có kết quả.", "The game has ended.");
        }
        return "";
    }

    private boolean canPeek(Room room, String playerId) {
        GameState state = room.getGameState();
        return state.awakePlayerIds().size() == 1 && state.isPlayerAwakeNow(playerId) && !state.getPackmates().contains(playerId) && isYardSideAwakeRole(state.getRoles().get(playerId));
    }

    private boolean canThiefDelay(Room room, String playerId) {
        GameState state = room.getGameState();
        if (room.getSettings().getMaxPlayers() != 4 || state.getRoles().get(playerId) != Role.BONE_THIEF) {
            return false;
        }
        return state.wakeTimesFor(playerId).stream().anyMatch(hour -> hour > state.getCurrentHour());
    }

    private GameDto.PlayerHint toHint(Room room, String playerId) {
        Player player = room.getPlayers().get(playerId);
        return new GameDto.PlayerHint(player == null ? playerId : player.getPublicId(), player == null ? "Dog" : player.getNickname());
    }

    private GameDto.GameResult toGameResultDto(Room room, GameResult result) {
        if (result == null) {
            return null;
        }
        return new GameDto.GameResult(result.winningPack(), result.revealedPlayerIds().stream().map(id -> toRoleDto(room, id, result.finalRoles())).toList(), toRoleDto(room, result.boneThiefPlayerId(), result.finalRoles()), result.packmatePlayerIds().stream().map(id -> toRoleDto(room, id, result.finalRoles())).toList(), room.getPlayers().keySet().stream().map(voterId -> {
            GameDto.PlayerHint voter = toHint(room, voterId);
            String targetId = result.votes().get(voterId);
            GameDto.PlayerHint target = targetId == null ? null : toHint(room, targetId);
            return new GameDto.VoteResult(voter.id(), voter.nickname(), target == null ? null : target.id(), target == null ? text(room, "Phiếu trống", "Blank vote") : target.nickname());
        }).toList(), result.finalRoles().keySet().stream().sorted(byJoinOrder(room)).map(id -> toRoleDto(room, id, result.finalRoles())).toList());
    }

    private GameDto.PlayerRole toRoleDto(Room room, String playerId, Map<String, Role> finalRoles) {
        GameDto.PlayerHint hint = toHint(room, playerId);
        return new GameDto.PlayerRole(hint.id(), hint.nickname(), finalRoles.get(playerId));
    }

    private String findBoneThiefId(GameState state) {
        return state.getRoles().entrySet().stream().filter(entry -> entry.getValue() == Role.BONE_THIEF).map(Map.Entry::getKey).findFirst().orElseThrow(() -> new BadRequestException("Chưa có Chó Trộm Xương."));
    }

    private String text(Room room, String vi, String en) {
        return room.getSettings().getLanguage() == RoomLanguage.EN ? en : vi;
    }
}

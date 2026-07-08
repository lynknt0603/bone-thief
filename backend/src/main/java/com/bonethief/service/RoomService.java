package com.bonethief.service;

import com.bonethief.domain.model.*;
import com.bonethief.dto.ChatDto;
import com.bonethief.dto.GameDto;
import com.bonethief.dto.RoomDto;
import com.bonethief.exception.BadRequestException;
import com.bonethief.exception.NotFoundException;
import com.bonethief.mapper.RoomMapper;
import com.bonethief.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.bonethief.domain.model.GameRules.*;

@Service
public class RoomService {
    private static final int MIN_PLAYERS = 4;
    private static final int MAX_PLAYERS = 8;
    private static final int MIN_TIMER_SECONDS = 5;
    private static final int MAX_TIMER_SECONDS = 30;
    private static final int VOTING_SECONDS = 60;
    private static final int MAX_CHAT_MESSAGE_LENGTH = 240;
    private static final int CHAT_HISTORY_LIMIT = 100;
    private static final String ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TaskScheduler taskScheduler;
    private final RoomMapper roomMapper;
    private final SecureRandom random = new SecureRandom();

    public RoomService(RoomRepository roomRepository, SimpMessagingTemplate messagingTemplate, @Qualifier("gameTaskScheduler") TaskScheduler taskScheduler, RoomMapper roomMapper) {
        this.roomRepository = roomRepository;
        this.messagingTemplate = messagingTemplate;
        this.taskScheduler = taskScheduler;
        this.roomMapper = roomMapper;
    }

    public RoomDto.JoinResponse createRoom(RoomDto.CreateRequest request) {
        int maxPlayers = sanitizeMaxPlayers(Optional.ofNullable(request.maxPlayers()).orElse(5));
        String roomCode = nextRoomCode();
        Room room = new Room(roomCode, new RoomSettings(maxPlayers));
        room.getSettings().setPassword(sanitizePassword(request.password()));
        if (request.language() != null) {
            room.getSettings().setLanguage(request.language());
        }
        Player host = new Player(UUID.randomUUID().toString(), nextPublicPlayerId(room), uniqueNickname(room, request.nickname(), null), true);
        room.getPlayers().put(host.getId(), host);
        roomRepository.save(room);
        return new RoomDto.JoinResponse(host.getId(), roomMapper.toPublicRoom(room), roomMapper.toPrivateState(room, host.getId()));
    }

    public RoomDto.JoinResponse joinRoom(String roomCode, RoomDto.JoinRequest request) {
        Room room = requireRoom(roomCode);
        String playerId;
        synchronized (room) {
            ensurePhase(room, GamePhase.LOBBY, "Chỉ có thể vào phòng khi ván chưa bắt đầu.");
            requirePassword(room, request.password());
            if (room.getPlayers().size() >= room.getSettings().getMaxPlayers()) {
                throw new BadRequestException("Phòng đã đủ Dog.");
            }
            Player player = new Player(UUID.randomUUID().toString(), nextPublicPlayerId(room), uniqueNickname(room, request.nickname(), null), false);
            player.setReady(false);
            room.getPlayers().put(player.getId(), player);
            playerId = player.getId();
        }
        publishRoom(room);
        return new RoomDto.JoinResponse(playerId, roomMapper.toPublicRoom(room), roomMapper.toPrivateState(room, playerId));
    }

    public RoomDto.PublicRoom getPublicRoom(String roomCode) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            return roomMapper.toPublicRoom(room);
        }
    }

    public GameDto.PrivateState getPrivateState(String roomCode, String playerId) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requirePlayer(room, playerId);
            return roomMapper.toPrivateState(room, playerId);
        }
    }

    public RoomDto.PublicRoom updateSettings(String roomCode, RoomDto.SettingsRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requireHost(room, request.playerId());
            boolean hasLobbyOnlyChanges = request.maxPlayers() != null || request.nightSeconds() != null || request.packSelectionSeconds() != null || request.password() != null || request.whiteDogEnabled() != null;
            if (hasLobbyOnlyChanges) {
                ensurePhase(room, GamePhase.LOBBY, "Chỉ host được đổi cấu hình trước khi bắt đầu.");
            }
            if (request.maxPlayers() != null) {
                int maxPlayers = sanitizeMaxPlayers(request.maxPlayers());
                if (maxPlayers < room.getPlayers().size()) {
                    throw new BadRequestException("Số Dog tối đa không thể nhỏ hơn số Dog đang trong phòng.");
                }
                room.getSettings().setMaxPlayers(maxPlayers);
            }
            if (request.nightSeconds() != null) {
                room.getSettings().setNightSeconds(sanitizeTimerSeconds(request.nightSeconds(), "Thời gian mỗi canh giờ"));
            }
            if (request.packSelectionSeconds() != null) {
                room.getSettings().setPackSelectionSeconds(sanitizeTimerSeconds(request.packSelectionSeconds(), "Thời gian chọn đồng bọn"));
            }
            if (request.language() != null) {
                room.getSettings().setLanguage(request.language());
            }
            if (request.password() != null) {
                room.getSettings().setPassword(sanitizePassword(request.password()));
            }
            if (request.whiteDogEnabled() != null) {
                room.getSettings().setWhiteDogEnabled(request.whiteDogEnabled());
            }
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public RoomDto.PublicRoom updateDisplayName(String roomCode, RoomDto.UpdateDisplayNameRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            Player player = requirePlayer(room, request.playerId());
            player.setNickname(uniqueNickname(room, request.nickname(), player.getId()));
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public void leaveRoom(String roomCode, RoomDto.PlayerRequest request) {
        Room room = requireRoom(roomCode);
        boolean roomDeleted;
        synchronized (room) {
            Player player = requirePlayer(room, request.playerId());
            ensurePhase(room, GamePhase.LOBBY, "Chỉ có thể rời phòng khi ván chưa bắt đầu.");
            removeLobbyPlayer(room, player.getId());
            roomDeleted = room.getPlayers().isEmpty();
            if (roomDeleted) {
                roomRepository.deleteByCode(room.getRoomCode());
            }
        }
        if (!roomDeleted) {
            publishRoom(room);
        }
    }

    public RoomDto.PublicRoom kickPlayer(String roomCode, RoomDto.KickPlayerRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requireHost(room, request.playerId());
            ensurePhase(room, GamePhase.LOBBY, "Chỉ có thể đuổi Dog khi ván chưa bắt đầu.");
            Player target = requirePlayerByPublicId(room, request.targetPlayerId());
            if (target.isHost()) {
                throw new BadRequestException("Không thể đuổi host khỏi phòng.");
            }
            removeLobbyPlayer(room, target.getId());
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public RoomDto.PublicRoom setReady(String roomCode, RoomDto.ReadyRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            ensurePhase(room, GamePhase.LOBBY, "Chỉ có thể sẵn sàng trong lobby.");
            Player player = requirePlayer(room, request.playerId());
            player.setReady(request.ready());
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public RoomDto.PublicRoom startGame(String roomCode, RoomDto.PlayerRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requireHost(room, request.playerId());
            ensurePhase(room, GamePhase.LOBBY, "Ván đã bắt đầu.");
            if (room.getPlayers().size() != room.getSettings().getMaxPlayers()) {
                throw new BadRequestException("Cần đúng " + room.getSettings().getMaxPlayers() + " Dog để bắt đầu.");
            }
            boolean everyoneReady = room.getPlayers().values().stream().allMatch(Player::isReady);
            if (!everyoneReady) {
                throw new BadRequestException("Vẫn còn Dog chưa sẵn sàng.");
            }
            dealNewRound(room);
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public RoomDto.PublicRoom restartGame(String roomCode, RoomDto.PlayerRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requireHost(room, request.playerId());
            ensurePhase(room, GamePhase.RESULT, "Chỉ có thể chơi lại sau khi có kết quả.");
            room.getGameState().resetForLobby();
            room.getPlayers().values().forEach(player -> player.setReady(player.isHost()));
            room.getChatMessages().clear();
        }
        publishRoom(room);
        return getPublicRoom(roomCode);
    }

    public void handleAction(String roomCode, GameDto.PlayerActionRequest request) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            requirePlayer(room, request.playerId());
            if (request.type() == null) {
                throw new BadRequestException("Thiếu loại hành động.");
            }
            switch (request.type()) {
                case SELECT_WAKE_TIME -> selectWakeTime(room, request.playerId(), request.selectedWakeTime());
                case TAKE_BONE -> takeBone(room, request.playerId());
                case PEEK_WAKE_TIME -> peekWakeTime(room, request.playerId(), request.targetPlayerId());
                case WAIT -> waitForHour(room, request.playerId());
                case SELECT_PACKMATE -> selectPackmates(room, request.playerId(), request);
                case START_VOTE -> startVote(room, request.playerId());
                case VOTE -> vote(room, request.playerId(), request.targetPlayerId());
            }
        }
        publishRoom(room);
    }

    public ChatDto.Message sendChatMessage(String roomCode, ChatDto.MessageRequest request) {
        Room room = requireRoom(roomCode);
        ChatDto.Message chatMessage;
        synchronized (room) {
            Player player = requirePlayer(room, request.playerId());
            ensureChatAllowed(room);
            String cleanMessage = sanitizeChatMessage(request.message());
            ChatMessage message = new ChatMessage(UUID.randomUUID().toString(), player.getId(), player.getPublicId(), player.getNickname(), cleanMessage, Instant.now().toEpochMilli());
            room.getChatMessages().add(message);
            trimChatHistory(room);
            chatMessage = roomMapper.toChatDto(message);
        }
        messagingTemplate.convertAndSend("/topic/rooms/" + room.getRoomCode() + "/chat", chatMessage);
        return chatMessage;
    }

    public void sendError(String playerId, String message) {
        if (playerId != null && !playerId.isBlank()) {
            messagingTemplate.convertAndSendToUser(playerId, "/queue/errors", Map.of("message", message));
        }
    }

    public void handleDeadline(String roomCode, int expectedTimerVersion) {
        Room room = requireRoom(roomCode);
        synchronized (room) {
            GameState state = room.getGameState();
            if (state.getTimerVersion() != expectedTimerVersion) {
                return;
            }
            switch (state.getPhase()) {
                case NIGHT_HOUR -> timeoutNightHour(room);
                case PACK_SELECTION -> timeoutPackSelection(room);
                case DISCUSSION -> {
                    state.getVotes().clear();
                    state.setPhase(GamePhase.VOTING);
                    setDeadline(room, VOTING_SECONDS);
                }
                case VOTING -> resolveVotes(room);
                default -> clearDeadline(room);
            }
        }
        publishRoom(room);
    }

    private void timeoutNightHour(Room room) {
        GameState state = room.getGameState();
        Set<String> awakeIds = state.awakePlayerIds();
        String awakeThiefId = awakeIds.stream().filter(id -> state.getRoles().get(id) == Role.BONE_THIEF).findFirst().orElse(null);

        if (awakeThiefId != null && !state.isBoneTaken() && !canThiefDelay(room, awakeThiefId)) {
            int timeoutHour = state.getCurrentHour();
            takeBone(room, awakeThiefId);
            if (state.getPhase() != GamePhase.NIGHT_HOUR || state.getCurrentHour() != timeoutHour) {
                return;
            }
        }

        state.markAllAwakePlayersDone();
        if (state.getPhase() == GamePhase.NIGHT_HOUR) {
            advanceNightHour(room);
        }
    }

    private void timeoutPackSelection(Room room) {
        GameState state = room.getGameState();
        PackSelectionMode mode = state.getPackSelectionMode();
        List<String> candidates = new ArrayList<>(state.getPendingPackCandidates());
        Collections.shuffle(candidates, random);
        List<String> selected = candidates.stream().limit(state.getPendingPackCount()).toList();
        applyPackmates(state, selected);
        state.getPendingPackCandidates().clear();
        state.setPendingPackCount(0);
        state.setPackSelectionMode(null);

        if (mode == PackSelectionMode.WITNESS) {
            resumeNightAfterWitnessSelection(room, true);
        } else {
            enterDiscussion(room);
        }
    }

    private void setDeadline(Room room, int secondsFromNow) {
        setDeadlineAt(room, Instant.now().toEpochMilli() + secondsFromNow * 1000L);
    }

    private void setDeadlineAt(Room room, long deadlineEpochMs) {
        GameState state = room.getGameState();
        int timerVersion = state.nextTimerVersion();
        state.setPhaseDeadlineEpochMs(deadlineEpochMs);
        taskScheduler.schedule(() -> handleDeadline(room.getRoomCode(), timerVersion), Instant.ofEpochMilli(deadlineEpochMs));
    }

    private void clearDeadline(Room room) {
        GameState state = room.getGameState();
        state.nextTimerVersion();
        state.setPhaseDeadlineEpochMs(null);
    }

    private void dealNewRound(Room room) {
        GameState state = room.getGameState();
        state.resetForNewRound();
        List<String> playerIds = new ArrayList<>(room.getPlayers().keySet());
        Collections.shuffle(playerIds, random);
        String thiefId = playerIds.get(0);
        String whiteDogId = room.getSettings().isWhiteDogEnabled() && playerIds.size() > 1 ? playerIds.get(1) : null;
        Map<String, List<Integer>> diceRollsByPlayer = randomWakeSchedule(room.getSettings().getMaxPlayers(), playerIds);
        for (String playerId : playerIds) {
            Role role = playerId.equals(thiefId) ? Role.BONE_THIEF : playerId.equals(whiteDogId) ? Role.WHITE_DOG : Role.YARD_DOG;
            List<Integer> diceRolls = diceRollsByPlayer.getOrDefault(playerId, List.of());
            state.getRoles().put(playerId, role);
            state.getDiceRolls().put(playerId, diceRolls);
            if (room.getSettings().getMaxPlayers() == 4 && isYardSideAwakeRole(role)) {
                state.getWakeTimes().put(playerId, List.of());
            } else {
                state.getWakeTimes().put(playerId, effectiveWakeTimes(diceRolls));
            }
        }
        if (room.getSettings().getMaxPlayers() == 4) {
            state.setPhase(GamePhase.WAKE_SELECTION);
            clearDeadline(room);
            return;
        }
        advanceNightHour(room, 10);
    }

    private Map<String, List<Integer>> randomWakeSchedule(int maxPlayers, List<String> playerIds) {
        int maxAwakeTogether = maxAwakeTogether(maxPlayers);
        int diceCount = maxPlayers == 4 ? 2 : 1;
        Map<String, List<Integer>> schedule = new LinkedHashMap<>();
        Map<Integer, Integer> possibleAwakeByHour = new LinkedHashMap<>();

        for (String playerId : playerIds) {
            List<Integer> diceRolls = new ArrayList<>();
            for (int die = 0; die < diceCount; die++) {
                int hour = randomAllowedWakeHour(diceRolls, possibleAwakeByHour, maxAwakeTogether);
                diceRolls.add(hour);
                if (!diceRolls.subList(0, diceRolls.size() - 1).contains(hour)) {
                    possibleAwakeByHour.merge(hour, 1, Integer::sum);
                }
            }
            schedule.put(playerId, diceRolls);
        }
        return schedule;
    }

    private int randomAllowedWakeHour(List<Integer> currentPlayerDice, Map<Integer, Integer> possibleAwakeByHour, int maxAwakeTogether) {
        List<Integer> candidates = new ArrayList<>();
        for (int hour = 1; hour <= 6; hour++) {
            if (currentPlayerDice.contains(hour) || possibleAwakeByHour.getOrDefault(hour, 0) < maxAwakeTogether) {
                candidates.add(hour);
            }
        }
        if (candidates.isEmpty()) {
            throw new BadRequestException("Không thể tạo lịch thức cân bằng cho phòng này.");
        }
        return candidates.get(random.nextInt(candidates.size()));
    }

    private List<Integer> effectiveWakeTimes(List<Integer> diceRolls) {
        return diceRolls.stream().distinct().sorted().toList();
    }

    private void selectWakeTime(Room room, String playerId, Integer selectedWakeTime) {
        GameState state = room.getGameState();
        ensurePhase(room, GamePhase.WAKE_SELECTION, "Chưa đến lượt chọn giờ thức.");
        if (!isYardSideAwakeRole(state.getRoles().get(playerId))) {
            throw new BadRequestException("Chỉ Chó Canh Sân cần chọn 1 giờ thức.");
        }
        if (selectedWakeTime == null || selectedWakeTime < 1 || selectedWakeTime > 6) {
            throw new BadRequestException("Giờ thức không hợp lệ.");
        }
        List<Integer> diceRolls = state.getDiceRolls().getOrDefault(playerId, List.of());
        if (!diceRolls.contains(selectedWakeTime)) {
            throw new BadRequestException("Chỉ được chọn một trong hai xúc xắc bí mật.");
        }
        if (state.hasSelectedWakeTime(playerId)) {
            throw new BadRequestException("Dog này đã chọn giờ thức rồi.");
        }

        state.getWakeTimes().put(playerId, List.of(selectedWakeTime));
        if (allYardDogsSelectedWakeTime(room)) {
            state.setPhase(GamePhase.NIGHT_HOUR);
            state.setCurrentHour(0);
            state.clearCurrentHourDone();
            advanceNightHour(room);
        }
    }

    private void takeBone(Room room, String playerId) {
        GameState state = room.getGameState();
        ensureNightAwake(room, playerId);
        ensureHourActionAvailable(state, playerId);
        if (state.getRoles().get(playerId) != Role.BONE_THIEF) {
            throw new BadRequestException("Chỉ Chó Trộm Xương mới có thể lấy xương.");
        }
        if (state.isBoneTaken()) {
            throw new BadRequestException("Xương đã được lấy rồi.");
        }

        state.setBoneTaken(true);
        state.setBoneTakenHour(state.getCurrentHour());
        Set<String> awakeIds = state.awakePlayerIds();
        state.markCurrentHourDone(playerId);
        recordBoneWitnesses(state, awakeIds, playerId);

        if (room.getSettings().getMaxPlayers() == 5) {
            List<String> witnesses = awakeIds.stream().filter(id -> !id.equals(playerId)).filter(id -> state.getRoles().get(id) != Role.BONE_THIEF).sorted(byJoinOrder(room)).toList();
            if (witnesses.size() == 1) {
                applyPackmates(state, witnesses);
            } else if (witnesses.size() > 1) {
                openPackSelection(room, witnesses, 1, PackSelectionMode.WITNESS);
            }
        }

        // Taking the bone records the action, but the current hour still lasts its full timer.
    }

    private void peekWakeTime(Room room, String playerId, String targetPlayerId) {
        GameState state = room.getGameState();
        ensureNightAwake(room, playerId);
        ensureHourActionAvailable(state, playerId);
        if (!canPeek(room, playerId)) {
            throw new BadRequestException("Dog này không thể xem dấu vết ở giờ hiện tại.");
        }
        Player target = requirePlayerByPublicId(room, targetPlayerId);
        if (Objects.equals(playerId, target.getId())) {
            throw new BadRequestException("Không thể tự xem dấu vết của chính mình.");
        }
        List<Integer> targetWakeClue = state.getDiceRolls().getOrDefault(target.getId(), state.wakeTimesFor(target.getId()));
        state.getPeekResultsFor(playerId).add(new PeekResult(target.getId(), target.getNickname(), targetWakeClue));
        state.markCurrentHourDone(playerId);
    }

    private void waitForHour(Room room, String playerId) {
        GameState state = room.getGameState();
        ensureNightAwake(room, playerId);
        ensureHourActionAvailable(state, playerId);
        if (state.getRoles().get(playerId) == Role.BONE_THIEF && !state.isBoneTaken() && !canThiefDelay(room, playerId)) {
            throw new BadRequestException("Chó Trộm Xương cần lấy xương khi đang thức.");
        }
        state.markCurrentHourDone(playerId);
    }

    private void selectPackmates(Room room, String playerId, GameDto.PlayerActionRequest request) {
        GameState state = room.getGameState();
        ensurePhase(room, GamePhase.PACK_SELECTION, "Chưa đến lượt chọn đồng bọn.");
        if (state.getRoles().get(playerId) != Role.BONE_THIEF) {
            throw new BadRequestException("Chỉ Chó Trộm Xương được chọn đồng bọn.");
        }

        List<String> selectedPublicIds = normalizedTargetIds(request);
        if (selectedPublicIds.size() != state.getPendingPackCount()) {
            throw new BadRequestException("Cần chọn đúng " + state.getPendingPackCount() + " Dog.");
        }
        if (new LinkedHashSet<>(selectedPublicIds).size() != selectedPublicIds.size()) {
            throw new BadRequestException("Không được chọn trùng Dog.");
        }
        List<String> selected = selectedPublicIds.stream().map(publicId -> requirePlayerByPublicId(room, publicId).getId()).toList();
        for (String targetId : selected) {
            if (!state.getPendingPackCandidates().contains(targetId)) {
                throw new BadRequestException("Dog được chọn không hợp lệ.");
            }
        }

        PackSelectionMode mode = state.getPackSelectionMode();
        applyPackmates(state, selected);
        state.getPendingPackCandidates().clear();
        state.setPendingPackCount(0);
        state.setPackSelectionMode(null);

        if (mode == PackSelectionMode.WITNESS) {
            resumeNightAfterWitnessSelection(room, false);
        } else {
            enterDiscussion(room);
        }
    }

    private void startVote(Room room, String playerId) {
        ensurePhase(room, GamePhase.DISCUSSION, "Chỉ có thể bắt đầu bỏ phiếu sau phần thảo luận.");
        requireHost(room, playerId);
        room.getGameState().getVotes().clear();
        room.getGameState().setPhase(GamePhase.VOTING);
        setDeadline(room, VOTING_SECONDS);
    }

    private void vote(Room room, String playerId, String targetPlayerId) {
        GameState state = room.getGameState();
        ensurePhase(room, GamePhase.VOTING, "Chưa đến phase bỏ phiếu.");
        Player target = requirePlayerByPublicId(room, targetPlayerId);
        if (Objects.equals(playerId, target.getId())) {
            throw new BadRequestException("Không thể vote cho chính mình.");
        }
        if (state.getVotes().containsKey(playerId)) {
            throw new BadRequestException("Dog này đã vote rồi.");
        }
        state.getVotes().put(playerId, target.getId());
        if (state.getVotes().size() == room.getPlayers().size()) {
            resolveVotes(room);
        }
    }

    private void resolveVotes(Room room) {
        GameState state = room.getGameState();
        Map<String, Long> counts = state.getVotes().values().stream().collect(Collectors.groupingBy(id -> id, LinkedHashMap::new, Collectors.counting()));
        long maxVotes = counts.values().stream().mapToLong(Long::longValue).max().orElse(0);
        Set<String> revealed = counts.entrySet().stream().filter(entry -> entry.getValue() == maxVotes).map(Map.Entry::getKey).collect(Collectors.toCollection(LinkedHashSet::new));
        String thiefId = findBoneThiefId(state);
        Optional<String> whiteDogId = findWhiteDogId(state);
        WinningPack winningPack = whiteDogId.filter(revealed::contains).map(ignored -> WinningPack.WHITE_DOG).orElse(revealed.contains(thiefId) ? WinningPack.YARD_PACK : WinningPack.THIEF_PACK);
        state.setResult(new GameResult(winningPack, revealed, thiefId, state.getPackmates(), state.getVotes(), state.getRoles()));
        state.setPhase(GamePhase.RESULT);
        clearDeadline(room);
    }

    private void advanceNightHour(Room room) {
        advanceNightHour(room, 0);
    }

    private void advanceNightHour(Room room, int extraSeconds) {
        GameState state = room.getGameState();
        state.clearCurrentHourDone();
        if (state.getPhase() != GamePhase.NIGHT_HOUR) {
            return;
        }
        state.setCurrentHour(state.getCurrentHour() + 1);
        if (state.getCurrentHour() > 6) {
            finishNight(room);
            return;
        }
        recordBoneStatusObservers(room);
        recordCoAwakePlayers(room);
        setDeadline(room, room.getSettings().getNightSeconds() + extraSeconds);
    }

    private void finishNight(Room room) {
        GameState state = room.getGameState();
        state.setCurrentHour(0);
        state.clearCurrentHourDone();
        if (!state.isBoneTaken()) {
            state.setBoneTaken(true);
            state.setBoneTakenHour(6);
        }
        int maxPlayers = room.getSettings().getMaxPlayers();
        int remainingPackmateCount = plannedPackmateCount(maxPlayers) - state.getPackmates().size();
        if (maxPlayers >= 6 && remainingPackmateCount > 0) {
            String thiefId = findBoneThiefId(state);
            List<String> candidates = room.getPlayers().keySet().stream().filter(id -> !id.equals(thiefId)).filter(id -> !state.getPackmates().contains(id)).sorted(byJoinOrder(room)).toList();
            openPackSelection(room, candidates, remainingPackmateCount, PackSelectionMode.POST_NIGHT);
        } else {
            enterDiscussion(room);
        }
    }

    private void openPackSelection(Room room, List<String> candidates, int count, PackSelectionMode mode) {
        GameState state = room.getGameState();
        if (candidates.size() < count) {
            throw new BadRequestException("Không đủ Dog hợp lệ để chọn đồng bọn.");
        }
        Long currentNightDeadline = state.getPhaseDeadlineEpochMs();
        state.getPendingPackCandidates().clear();
        state.getPendingPackCandidates().addAll(candidates);
        state.setPendingPackCount(count);
        state.setPackSelectionMode(mode);
        state.setPhase(GamePhase.PACK_SELECTION);
        if (mode == PackSelectionMode.WITNESS && currentNightDeadline != null) {
            setDeadlineAt(room, currentNightDeadline);
        } else {
            setDeadline(room, room.getSettings().getPackSelectionSeconds());
        }
    }

    private void enterDiscussion(Room room) {
        GameState state = room.getGameState();
        state.setCurrentHour(0);
        state.setPhase(GamePhase.DISCUSSION);
        setDeadline(room, discussionSeconds(room));
    }

    private void applyPackmates(GameState state, List<String> selected) {
        for (String playerId : selected) {
            state.getPackmates().add(playerId);
            if (state.getRoles().get(playerId) != Role.WHITE_DOG) {
                state.getRoles().put(playerId, Role.PACKMATE);
            }
        }
    }

    private void resumeNightAfterWitnessSelection(Room room, boolean advanceNow) {
        GameState state = room.getGameState();
        state.setPhase(GamePhase.NIGHT_HOUR);
        if (advanceNow) {
            advanceNightHour(room);
        }
    }

    private void recordBoneWitnesses(GameState state, Set<String> awakeIds, String thiefId) {
        for (String awakeId : awakeIds) {
            if (!awakeId.equals(thiefId)) {
                state.getWitnessedBoneTakenHoursFor(awakeId).add(state.getCurrentHour());
            }
        }
    }

    private void recordBoneStatusObservers(Room room) {
        GameState state = room.getGameState();
        if (!state.isBoneTaken()) {
            state.awakePlayerIds().stream()
                    .filter(id -> state.getRoles().get(id) != Role.BONE_THIEF)
                    .forEach(id -> {
                        List<Integer> observedHours = state.getObservedBonePresentHoursFor(id);
                        if (!observedHours.contains(state.getCurrentHour())) {
                            observedHours.add(state.getCurrentHour());
                        }
                    });
            return;
        }

        Integer boneTakenHour = state.getBoneTakenHour();
        if (boneTakenHour == null || boneTakenHour >= state.getCurrentHour()) {
            return;
        }
        state.awakePlayerIds().stream()
                .filter(id -> state.getRoles().get(id) != Role.BONE_THIEF)
                .forEach(id -> {
                    List<Integer> observedHours = state.getObservedBoneMissingHoursFor(id);
                    if (!observedHours.contains(state.getCurrentHour())) {
                        observedHours.add(state.getCurrentHour());
                    }
                });
    }

    private void recordCoAwakePlayers(Room room) {
        GameState state = room.getGameState();
        Set<String> awakeIds = state.awakePlayerIds();
        if (awakeIds.size() < 2) {
            return;
        }
        for (String awakeId : awakeIds) {
            Set<String> peers = state.getCoAwakePlayerIdsFor(awakeId).computeIfAbsent(state.getCurrentHour(), ignored -> new LinkedHashSet<>());
            awakeIds.stream().filter(id -> !id.equals(awakeId)).forEach(peers::add);
        }
    }

    private boolean allYardDogsSelectedWakeTime(Room room) {
        GameState state = room.getGameState();
        return state.getRoles().entrySet().stream().filter(entry -> isYardSideAwakeRole(entry.getValue())).allMatch(entry -> state.hasSelectedWakeTime(entry.getKey()));
    }

    private boolean allAwakePlayersDone(Room room) {
        return room.getGameState().allAwakePlayersDone();
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

    private void ensureNightAwake(Room room, String playerId) {
        ensurePhase(room, GamePhase.NIGHT_HOUR, "Chỉ có thể làm hành động này trong đêm.");
        if (!room.getGameState().isPlayerAwakeNow(playerId)) {
            throw new BadRequestException("Dog này đang ngủ ở giờ hiện tại.");
        }
    }

    private void ensureHourActionAvailable(GameState state, String playerId) {
        if (state.hasPlayerCompletedCurrentHour(playerId)) {
            throw new BadRequestException("Dog này đã xong lượt ở canh giờ hiện tại.");
        }
    }

    private void ensurePhase(Room room, GamePhase expected, String message) {
        if (room.getGameState().getPhase() != expected) {
            throw new BadRequestException(message);
        }
    }

    private Player requireHost(Room room, String playerId) {
        Player player = requirePlayer(room, playerId);
        if (!player.isHost()) {
            throw new BadRequestException("Chỉ host được thực hiện hành động này.");
        }
        return player;
    }

    private Player requirePlayer(Room room, String playerId) {
        if (playerId == null || playerId.isBlank()) {
            throw new BadRequestException("Thiếu playerId.");
        }
        Player player = room.getPlayers().get(playerId);
        if (player == null) {
            throw new BadRequestException("Player không thuộc phòng này.");
        }
        return player;
    }

    private Player requirePlayerByPublicId(Room room, String publicId) {
        if (publicId == null || publicId.isBlank()) {
            throw new BadRequestException("Thiếu Dog mục tiêu.");
        }
        return room.getPlayers().values().stream()
                .filter(player -> player.getPublicId().equals(publicId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Dog mục tiêu không hợp lệ."));
    }

    private void removeLobbyPlayer(Room room, String playerId) {
        Player removed = room.getPlayers().remove(playerId);
        if (removed == null || !removed.isHost() || room.getPlayers().isEmpty()) {
            return;
        }
        Player nextHost = room.getPlayers().values().iterator().next();
        nextHost.setHost(true);
        nextHost.setReady(true);
    }

    private void requirePassword(Room room, String password) {
        if (!room.getSettings().isPasswordProtected()) {
            return;
        }
        String candidate = password == null ? "" : password;
        if (!room.getSettings().getPassword().equals(candidate)) {
            throw new BadRequestException("Password phòng không đúng.");
        }
    }

    private Room requireRoom(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new NotFoundException("Thiếu mã phòng.");
        }
        return roomRepository.findByCode(roomCode.trim().toUpperCase()).orElseThrow(() -> new NotFoundException("Không tìm thấy phòng."));
    }

    private String nextRoomCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < 5; i++) {
                builder.append(ROOM_CODE_ALPHABET.charAt(random.nextInt(ROOM_CODE_ALPHABET.length())));
            }
            code = builder.toString();
        } while (roomRepository.existsByCode(code));
        return code;
    }

    private int sanitizeMaxPlayers(Integer value) {
        if (value == null) {
            return 5;
        }
        if (value < MIN_PLAYERS || value > MAX_PLAYERS) {
            throw new BadRequestException("Số Dog phải từ 4 đến 8.");
        }
        return value;
    }

    private int sanitizeTimerSeconds(Integer value, String label) {
        if (value == null) {
            return 10;
        }
        if (value < MIN_TIMER_SECONDS || value > MAX_TIMER_SECONDS) {
            throw new BadRequestException(label + " phải từ " + MIN_TIMER_SECONDS + " đến " + MAX_TIMER_SECONDS + " giây.");
        }
        return value;
    }

    private static final List<String> DOG_ICONS = List.of("🐶", "🐕", "🦮", "🦁", "🐩", "🦊", "🐺", "🐾", "🦴");

    private String getRawNickname(String fullName) {
        if (fullName == null) {
            return "";
        }
        String trimmed = fullName.trim();
        for (String icon : DOG_ICONS) {
            if (trimmed.startsWith(icon)) {
                return trimmed.substring(icon.length()).trim();
            }
        }
        return trimmed;
    }

    private String sanitizeNickname(String nickname) {
        if (nickname == null) {
            nickname = "";
        }
        String clean = nickname.trim();
        String icon = "";
        String raw = clean;
        for (String dIcon : DOG_ICONS) {
            if (clean.startsWith(dIcon)) {
                icon = dIcon + " ";
                raw = clean.substring(dIcon.length()).trim();
                break;
            }
        }
        if (raw.isBlank()) {
            raw = "Dog " + (random.nextInt(90) + 10);
        }
        if (raw.length() > 12) {
            raw = raw.substring(0, 12).trim();
        }
        return icon + raw;
    }

    private String uniqueNickname(Room room, String nickname, String currentPlayerId) {
        String base = sanitizeNickname(nickname);
        String candidate = base;
        int suffix = 1;
        while (nicknameExists(room, candidate, currentPlayerId)) {
            String suffixText = " " + suffix;
            int maxBaseLength = Math.max(1, 24 - suffixText.length());
            String shortenedBase = base.length() > maxBaseLength ? base.substring(0, maxBaseLength).trim() : base;
            candidate = shortenedBase + suffixText;
            suffix++;
        }
        return candidate;
    }

    private boolean nicknameExists(Room room, String nickname, String currentPlayerId) {
        String rawCandidate = getRawNickname(nickname);
        return room.getPlayers().values().stream()
                .filter(player -> !player.getId().equals(currentPlayerId))
                .anyMatch(player -> getRawNickname(player.getNickname()).equalsIgnoreCase(rawCandidate));
    }

    private String sanitizePassword(String password) {
        if (password == null) {
            return null;
        }
        String clean = password.trim();
        if (clean.isBlank()) {
            return null;
        }
        if (clean.length() > 40) {
            throw new BadRequestException("Password tối đa 40 ký tự.");
        }
        return clean;
    }

    private String sanitizeChatMessage(String message) {
        String clean = message == null ? "" : message.trim().replaceAll("\s+", " ");
        if (clean.isBlank()) {
            throw new BadRequestException("Tin nhắn không được để trống.");
        }
        if (clean.length() > MAX_CHAT_MESSAGE_LENGTH) {
            throw new BadRequestException("Tin nhắn tối đa " + MAX_CHAT_MESSAGE_LENGTH + " ký tự.");
        }
        return clean;
    }

    private void ensureChatAllowed(Room room) {
        GamePhase phase = room.getGameState().getPhase();
        if (phase == GamePhase.NIGHT_HOUR || phase == GamePhase.PACK_SELECTION) {
            throw new BadRequestException("Không thể chat trong đêm gọi hoặc lúc chọn đồng bọn.");
        }
    }

    private void trimChatHistory(Room room) {
        while (room.getChatMessages().size() > CHAT_HISTORY_LIMIT) {
            room.getChatMessages().remove(0);
        }
    }

    private String nextPublicPlayerId(Room room) {
        int next = room.getPlayers().size() + 1;
        while (true) {
            String publicId = "DOG" + next;
            boolean exists = room.getPlayers().values().stream().anyMatch(player -> player.getPublicId().equals(publicId));
            if (!exists) {
                return publicId;
            }
            next++;
        }
    }

    private int discussionSeconds(Room room) {
        return Math.max(1, room.getPlayers().size() - 1) * 60;
    }

    private Comparator<String> byJoinOrder(Room room) {
        List<String> joinOrder = new ArrayList<>(room.getPlayers().keySet());
        return Comparator.comparingInt(joinOrder::indexOf);
    }

    private List<String> normalizedTargetIds(GameDto.PlayerActionRequest request) {
        if (request.targetPlayerIds() != null && !request.targetPlayerIds().isEmpty()) {
            return request.targetPlayerIds().stream().filter(Objects::nonNull).toList();
        }
        if (request.targetPlayerId() != null && !request.targetPlayerId().isBlank()) {
            return List.of(request.targetPlayerId());
        }
        return List.of();
    }

    private String findBoneThiefId(GameState state) {
        return state.getRoles().entrySet().stream().filter(entry -> entry.getValue() == Role.BONE_THIEF).map(Map.Entry::getKey).findFirst().orElseThrow(() -> new BadRequestException("Chưa có Chó Trộm Xương."));
    }

    private Optional<String> findWhiteDogId(GameState state) {
        return state.getRoles().entrySet().stream().filter(entry -> entry.getValue() == Role.WHITE_DOG).map(Map.Entry::getKey).findFirst();
    }

    private void publishRoom(Room room) {
        RoomDto.PublicRoom publicState;
        Map<String, GameDto.PrivateState> privateStates = new LinkedHashMap<>();
        synchronized (room) {
            publicState = roomMapper.toPublicRoom(room);
            for (String playerId : room.getPlayers().keySet()) {
                privateStates.put(playerId, roomMapper.toPrivateState(room, playerId));
            }
        }
        messagingTemplate.convertAndSend("/topic/rooms/" + room.getRoomCode(), publicState);
        privateStates.forEach((playerId, privateState) -> messagingTemplate.convertAndSendToUser(playerId, "/queue/private-state", privateState));
    }
}

package com.bonethief.domain.model;

import java.util.*;

public class GameState {
    private final Map<String, Role> roles = new LinkedHashMap<>();
    private final Map<String, List<Integer>> wakeTimes = new LinkedHashMap<>();
    private final Map<String, List<Integer>> diceRolls = new LinkedHashMap<>();
    private final Set<String> currentHourDone = new LinkedHashSet<>();
    private final Map<String, List<PeekResult>> peekResults = new HashMap<>();
    private final Map<String, Map<Integer, Set<String>>> coAwakePlayerIds = new HashMap<>();
    private final Map<String, List<Integer>> witnessedBoneTakenHours = new HashMap<>();
    private final Map<String, List<Integer>> observedBonePresentHours = new HashMap<>();
    private final Map<String, List<Integer>> observedBoneMissingHours = new HashMap<>();
    private final Set<String> packmates = new LinkedHashSet<>();
    private final Set<String> pendingPackCandidates = new LinkedHashSet<>();
    private final Map<String, String> votes = new LinkedHashMap<>();
    private GamePhase phase = GamePhase.LOBBY;
    private int roundNumber = 0;
    private int currentHour = 0;
    private boolean boneTaken = false;
    private Integer boneTakenHour;
    private int pendingPackCount = 0;
    private PackSelectionMode packSelectionMode;
    private GameResult result;
    private Long phaseDeadlineEpochMs;
    private int timerVersion = 0;

    public void resetForLobby() {
        phase = GamePhase.LOBBY;
        currentHour = 0;
        boneTaken = false;
        boneTakenHour = null;
        roles.clear();
        wakeTimes.clear();
        diceRolls.clear();
        currentHourDone.clear();
        peekResults.clear();
        coAwakePlayerIds.clear();
        witnessedBoneTakenHours.clear();
        observedBonePresentHours.clear();
        observedBoneMissingHours.clear();
        packmates.clear();
        pendingPackCandidates.clear();
        pendingPackCount = 0;
        packSelectionMode = null;
        votes.clear();
        result = null;
        phaseDeadlineEpochMs = null;
        timerVersion++;
    }

    public void resetForNewRound() {
        roundNumber++;
        phase = GamePhase.NIGHT_HOUR;
        currentHour = 0;
        boneTaken = false;
        boneTakenHour = null;
        roles.clear();
        wakeTimes.clear();
        diceRolls.clear();
        currentHourDone.clear();
        peekResults.clear();
        coAwakePlayerIds.clear();
        witnessedBoneTakenHours.clear();
        observedBonePresentHours.clear();
        observedBoneMissingHours.clear();
        packmates.clear();
        pendingPackCandidates.clear();
        pendingPackCount = 0;
        packSelectionMode = null;
        votes.clear();
        result = null;
        phaseDeadlineEpochMs = null;
        timerVersion++;
    }

    public GamePhase getPhase() {
        return phase;
    }

    public void setPhase(GamePhase phase) {
        this.phase = phase;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public int getCurrentHour() {
        return currentHour;
    }

    public void setCurrentHour(int currentHour) {
        this.currentHour = currentHour;
    }

    public boolean isBoneTaken() {
        return boneTaken;
    }

    public void setBoneTaken(boolean boneTaken) {
        this.boneTaken = boneTaken;
    }

    public Integer getBoneTakenHour() {
        return boneTakenHour;
    }

    public void setBoneTakenHour(Integer boneTakenHour) {
        this.boneTakenHour = boneTakenHour;
    }

    public Map<String, Role> getRoles() {
        return roles;
    }

    public Map<String, List<Integer>> getWakeTimes() {
        return wakeTimes;
    }

    public Map<String, List<Integer>> getDiceRolls() {
        return diceRolls;
    }

    public Set<String> getCurrentHourDone() {
        return currentHourDone;
    }

    public Map<String, List<PeekResult>> getPeekResults() {
        return peekResults;
    }

    public Map<String, Map<Integer, Set<String>>> getCoAwakePlayerIds() {
        return coAwakePlayerIds;
    }

    public Map<Integer, Set<String>> getCoAwakePlayerIdsFor(String playerId) {
        return coAwakePlayerIds.computeIfAbsent(playerId, ignored -> new LinkedHashMap<>());
    }

    public Map<String, List<Integer>> getWitnessedBoneTakenHours() {
        return witnessedBoneTakenHours;
    }

    public List<Integer> getWitnessedBoneTakenHoursFor(String playerId) {
        return witnessedBoneTakenHours.computeIfAbsent(playerId, ignored -> new ArrayList<>());
    }

    public Map<String, List<Integer>> getObservedBonePresentHours() {
        return observedBonePresentHours;
    }

    public List<Integer> getObservedBonePresentHoursFor(String playerId) {
        return observedBonePresentHours.computeIfAbsent(playerId, ignored -> new ArrayList<>());
    }

    public Map<String, List<Integer>> getObservedBoneMissingHours() {
        return observedBoneMissingHours;
    }

    public List<Integer> getObservedBoneMissingHoursFor(String playerId) {
        return observedBoneMissingHours.computeIfAbsent(playerId, ignored -> new ArrayList<>());
    }

    public List<PeekResult> getPeekResultsFor(String playerId) {
        return peekResults.computeIfAbsent(playerId, ignored -> new ArrayList<>());
    }

    public Set<String> getPackmates() {
        return packmates;
    }

    public Set<String> getPendingPackCandidates() {
        return pendingPackCandidates;
    }

    public int getPendingPackCount() {
        return pendingPackCount;
    }

    public void setPendingPackCount(int pendingPackCount) {
        this.pendingPackCount = pendingPackCount;
    }

    public PackSelectionMode getPackSelectionMode() {
        return packSelectionMode;
    }

    public void setPackSelectionMode(PackSelectionMode packSelectionMode) {
        this.packSelectionMode = packSelectionMode;
    }

    public Map<String, String> getVotes() {
        return votes;
    }

    public GameResult getResult() {
        return result;
    }

    public void setResult(GameResult result) {
        this.result = result;
    }

    public Long getPhaseDeadlineEpochMs() {
        return phaseDeadlineEpochMs;
    }

    public void setPhaseDeadlineEpochMs(Long phaseDeadlineEpochMs) {
        this.phaseDeadlineEpochMs = phaseDeadlineEpochMs;
    }

    public int getTimerVersion() {
        return timerVersion;
    }

    public int nextTimerVersion() {
        timerVersion++;
        return timerVersion;
    }

    public boolean isPlayerAwakeAt(String playerId, int hour) {
        return wakeTimes.getOrDefault(playerId, List.of()).contains(hour);
    }

    public boolean isPlayerAwakeNow(String playerId) {
        return phase == GamePhase.NIGHT_HOUR && isPlayerAwakeAt(playerId, currentHour);
    }

    public boolean hasSelectedWakeTime(String playerId) {
        return !wakeTimes.getOrDefault(playerId, List.of()).isEmpty();
    }

    public List<Integer> wakeTimesFor(String playerId) {
        return wakeTimes.getOrDefault(playerId, List.of());
    }

    public boolean hasPlayerCompletedCurrentHour(String playerId) {
        return currentHourDone.contains(playerId);
    }

    public void markCurrentHourDone(String playerId) {
        currentHourDone.add(playerId);
    }

    public void markAllAwakePlayersDone() {
        currentHourDone.addAll(awakePlayerIds());
    }

    public void clearCurrentHourDone() {
        currentHourDone.clear();
    }

    public boolean allAwakePlayersDone() {
        Set<String> awake = awakePlayerIds();
        return !awake.isEmpty() && currentHourDone.containsAll(awake);
    }

    public Set<String> awakePlayerIds() {
        if (phase != GamePhase.NIGHT_HOUR || currentHour < 1 || currentHour > 6) {
            return Set.of();
        }
        Set<String> awake = new HashSet<>();
        wakeTimes.forEach((playerId, times) -> {
            if (isPlayerAwakeAt(playerId, currentHour)) {
                awake.add(playerId);
            }
        });
        return awake;
    }
}

package com.bonethief.domain.model;

public class RoomSettings {
    private int maxPlayers;
    private int nightSeconds = 10;
    private int packSelectionSeconds = 10;
    private RoomLanguage language = RoomLanguage.VI;
    private String password;
    private boolean whiteDogEnabled;

    public RoomSettings(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public int getNightSeconds() {
        return nightSeconds;
    }

    public void setNightSeconds(int nightSeconds) {
        this.nightSeconds = nightSeconds;
    }

    public int getPackSelectionSeconds() {
        return packSelectionSeconds;
    }

    public void setPackSelectionSeconds(int packSelectionSeconds) {
        this.packSelectionSeconds = packSelectionSeconds;
    }

    public RoomLanguage getLanguage() {
        return language;
    }

    public void setLanguage(RoomLanguage language) {
        this.language = language;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isPasswordProtected() {
        return password != null && !password.isBlank();
    }

    public boolean isWhiteDogEnabled() {
        return whiteDogEnabled;
    }

    public void setWhiteDogEnabled(boolean whiteDogEnabled) {
        this.whiteDogEnabled = whiteDogEnabled;
    }
}

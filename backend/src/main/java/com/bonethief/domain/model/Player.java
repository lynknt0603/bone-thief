package com.bonethief.domain.model;

public class Player {
    private final String id;
    private final String publicId;
    private String nickname;
    private boolean host;
    private boolean ready;

    public Player(String id, String publicId, String nickname, boolean host) {
        this.id = id;
        this.publicId = publicId;
        this.nickname = nickname;
        this.host = host;
        this.ready = host;
    }

    public String getId() {
        return id;
    }

    public String getPublicId() {
        return publicId;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public boolean isHost() {
        return host;
    }

    public void setHost(boolean host) {
        this.host = host;
    }

    public boolean isReady() {
        return ready;
    }

    public void setReady(boolean ready) {
        this.ready = ready;
    }
}

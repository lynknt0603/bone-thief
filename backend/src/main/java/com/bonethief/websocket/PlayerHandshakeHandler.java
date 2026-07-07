package com.bonethief.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

public class PlayerHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String playerId = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams().getFirst("playerId");
        if (playerId == null || playerId.isBlank()) {
            playerId = UUID.randomUUID().toString();
        }
        return new StompPrincipal(playerId);
    }
}

package com.bonethief.repository;

import com.bonethief.domain.model.Room;

import java.util.Optional;

public interface RoomRepository {
    Room save(Room room);

    Optional<Room> findByCode(String roomCode);

    boolean existsByCode(String roomCode);

    void deleteByCode(String roomCode);
}

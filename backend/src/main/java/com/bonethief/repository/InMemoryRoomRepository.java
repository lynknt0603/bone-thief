package com.bonethief.repository;

import com.bonethief.domain.model.Room;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class InMemoryRoomRepository implements RoomRepository {
    private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();

    @Override
    public Room save(Room room) {
        rooms.put(room.getRoomCode(), room);
        return room;
    }

    @Override
    public Optional<Room> findByCode(String roomCode) {
        return Optional.ofNullable(rooms.get(roomCode.toUpperCase()));
    }

    @Override
    public boolean existsByCode(String roomCode) {
        return rooms.containsKey(roomCode.toUpperCase());
    }

    @Override
    public void deleteByCode(String roomCode) {
        rooms.remove(roomCode.toUpperCase());
    }
}

package cl.syncpass.bff.web;

public record TallerDto(
        String id,
        String name,
        String location,
        String date,
        int attendeesCount,
        int capacity,
        String status,
        String coordinatorName) {
}

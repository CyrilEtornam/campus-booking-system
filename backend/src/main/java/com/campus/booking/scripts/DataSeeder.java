package com.campus.booking.scripts;

import com.campus.booking.entity.Booking;
import com.campus.booking.entity.Facility;
import com.campus.booking.entity.User;
import com.campus.booking.entity.User.Role;
import com.campus.booking.repository.BookingRepository;
import com.campus.booking.repository.FacilityRepository;
import com.campus.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Activated with: --spring.profiles.active=seed
 * Clears and re-seeds the database with demo data matching seed.js.
 */
@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository     userRepository;
    private final FacilityRepository facilityRepository;
    private final BookingRepository  bookingRepository;
    private final PasswordEncoder    passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("▶  Seeding database...");

        // Clear in FK order
        bookingRepository.deleteAll();
        facilityRepository.deleteAll();
        userRepository.deleteAll();

        // ── Users ──────────────────────────────────────────────────────
        String adminPw   = passwordEncoder.encode("Admin1234");
        String facultyPw = passwordEncoder.encode("Faculty123");
        String studentPw = passwordEncoder.encode("Student123");

        User admin = save(user("Admin User",   "admin@campus.edu",          adminPw,   Role.ADMIN,   null,           "Administration"));
        User alice = save(user("Alice Johnson","alice@campus.edu",           facultyPw, Role.FACULTY, null,           "Engineering"));
        User bob   = save(user("Bob Smith",    "bob@campus.edu",             facultyPw, Role.FACULTY, null,           "Physics"));
        User carol = save(user("Carol Davis",  "carol@campus.edu",           facultyPw, Role.FACULTY, null,           "Mathematics"));
        User dave  = save(user("Dave Wilson",  "dave@student.edu",           studentPw, Role.STUDENT, "S2021001",     "Computer Science"));
        User eve   = save(user("Eve Martinez", "eve@student.edu",            studentPw, Role.STUDENT, "S2021002",     "Electrical Engineering"));
        User frank = save(user("Frank Lee",    "frank@student.edu",          studentPw, Role.STUDENT, "S2021003",     "Mechanical Engineering"));
        User grace = save(user("Grace Kim",    "grace@student.edu",          studentPw, Role.STUDENT, "S2021004",     "Civil Engineering"));

        // ── Facilities ────────────────────────────────────────────────
        Facility engLab  = saveFacility("Engineering Lab A",  "Block A, Room 101", 30,  "lab",         false, List.of("Computers","Projector","Whiteboard"));
        Facility mainAud = saveFacility("Main Auditorium",    "Central Building",  500, "auditorium",  true,  List.of("Stage","Microphone","Projector","Air Conditioning"));
        Facility study1  = saveFacility("Study Room 1",       "Library, Floor 2",  8,   "study_room",  false, List.of("Whiteboard","TV Screen"));
        Facility study2  = saveFacility("Study Room 2",       "Library, Floor 2",  6,   "study_room",  false, List.of("Whiteboard"));
        Facility sports  = saveFacility("Sports Hall",        "Sports Complex",    100, "sports",      true,  List.of("Basketball Court","Changing Rooms","Equipment Storage"));
        Facility seminar = saveFacility("Seminar Room B",     "Block B, Room 201", 40,  "room",        false, List.of("Projector","Whiteboard","Video Conferencing"));
        Facility resLab  = saveFacility("Research Lab 3",     "Block C, Room 301", 20,  "lab",         true,  List.of("Specialized Equipment","Fume Hood","Safety Cabinet"));
        Facility gym     = saveFacility("Fitness Centre",     "Sports Complex",    50,  "gym",         false, List.of("Cardio Machines","Free Weights","Changing Rooms"));

        // ── Bookings (relative to today) ──────────────────────────────
        LocalDate today = LocalDate.now();

        makeBooking(dave,  engLab,  today.plusDays(1),  "09:00","11:00", Booking.Status.CONFIRMED, "Lab project");
        makeBooking(eve,   study1,  today.plusDays(1),  "14:00","16:00", Booking.Status.CONFIRMED, "Group study");
        makeBooking(alice, seminar, today.plusDays(2),  "10:00","12:00", Booking.Status.CONFIRMED, "Faculty meeting");
        makeBooking(frank, mainAud, today.plusDays(2),  "13:00","17:00", Booking.Status.PENDING,   "Student presentation");
        makeBooking(dave,  study2,  today.plusDays(3),  "09:00","10:00", Booking.Status.CONFIRMED, "Study session");
        makeBooking(bob,   resLab,  today.plusDays(3),  "11:00","15:00", Booking.Status.PENDING,   "Research work");
        makeBooking(grace, engLab,  today.plusDays(5),  "14:00","16:00", Booking.Status.CONFIRMED, "Project work");
        makeBooking(carol, seminar, today.plusDays(5),  "10:00","12:00", Booking.Status.CONFIRMED, "Class prep");
        makeBooking(eve,   sports,  today.plusDays(7),  "08:00","10:00", Booking.Status.PENDING,   "Sports practice");
        makeBooking(frank, gym,     today.plusDays(7),  "17:00","19:00", Booking.Status.CONFIRMED, "Workout");
        makeBooking(alice, mainAud, today.plusDays(7),  "13:00","15:00", Booking.Status.CONFIRMED, "Seminar");
        // Past/cancelled booking
        makeBooking(dave,  study1,  today.minusDays(1), "10:00","11:00", Booking.Status.CANCELLED, "Cancelled session");

        log.info("✔  Seed complete: 8 users, 8 facilities, 12 bookings");
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private User user(String name, String email, String encodedPw,
                       Role role, String studentId, String dept) {
        return User.builder()
                .name(name).email(email).password(encodedPw)
                .role(role).studentId(studentId).department(dept)
                .isActive(true).build();
    }

    private User save(User u) { return userRepository.save(u); }

    private Facility saveFacility(String name, String location, int capacity,
                                   String type, boolean approval, List<String> amenities) {
        return facilityRepository.save(Facility.builder()
                .name(name).location(location).capacity(capacity)
                .facilityType(type).requiresApproval(approval)
                .amenities(amenities).isActive(true).build());
    }

    private void makeBooking(User user, Facility facility, LocalDate date,
                              String start, String end,
                              Booking.Status status, String purpose) {
        bookingRepository.save(Booking.builder()
                .user(user).facility(facility).date(date)
                .startTime(LocalTime.parse(start))
                .endTime(LocalTime.parse(end))
                .status(status).purpose(purpose)
                .build());
    }
}

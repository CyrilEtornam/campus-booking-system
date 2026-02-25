package com.campus.booking.service;

import com.campus.booking.entity.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendBookingConfirmation(Booking booking) {
        if (!enabled) return;

        String statusLabel  = booking.getStatus().name().equals("CONFIRMED")
                ? "Confirmed" : "Submitted (Pending Approval)";
        String subject = String.format("Booking #%d – %s | %s",
                booking.getId(), statusLabel, booking.getFacility().getName());

        String html = buildHtml(
                booking.getUser().getName(),
                subject,
                booking.getFacility().getName(),
                booking.getDate().format(DATE_FMT),
                booking.getStartTime().format(TIME_FMT),
                booking.getEndTime().format(TIME_FMT),
                booking.getStatus().name(),
                null,
                booking.getId()
        );

        send(booking.getUser().getEmail(), subject, html);
    }

    @Async
    public void sendStatusUpdate(Booking booking) {
        if (!enabled) return;

        String subject = String.format("Booking #%d Status Updated: %s | %s",
                booking.getId(), booking.getStatus().name(), booking.getFacility().getName());

        String html = buildHtml(
                booking.getUser().getName(),
                subject,
                booking.getFacility().getName(),
                booking.getDate().format(DATE_FMT),
                booking.getStartTime().format(TIME_FMT),
                booking.getEndTime().format(TIME_FMT),
                booking.getStatus().name(),
                booking.getAdminNotes(),
                booking.getId()
        );

        send(booking.getUser().getEmail(), subject, html);
    }

    @Async
    public void sendCancellationNotice(Booking booking) {
        if (!enabled) return;

        String subject = String.format("Booking #%d Cancelled | %s",
                booking.getId(), booking.getFacility().getName());

        String html = buildHtml(
                booking.getUser().getName(),
                subject,
                booking.getFacility().getName(),
                booking.getDate().format(DATE_FMT),
                booking.getStartTime().format(TIME_FMT),
                booking.getEndTime().format(TIME_FMT),
                "CANCELLED",
                null,
                booking.getId()
        );

        send(booking.getUser().getEmail(), subject, html);
    }

    // ── Internals ─────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String userName, String title, String facilityName,
                               String date, String startTime, String endTime,
                               String status, String adminNotes, Long bookingId) {

        String badgeColor = switch (status) {
            case "CONFIRMED" -> "#16a34a";
            case "PENDING"   -> "#d97706";
            case "CANCELLED" -> "#dc2626";
            case "REJECTED"  -> "#7c3aed";
            default          -> "#6b7280";
        };

        String notesHtml = adminNotes != null && !adminNotes.isBlank()
                ? "<p><strong>Admin notes:</strong> " + adminNotes + "</p>" : "";

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:24px">
              <div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;
                          padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                <h2 style="margin-top:0;color:#1e3a8a">Campus Booking System</h2>
                <p>Hi %s,</p>
                <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:16px 0">
                  <p style="margin:0 0 8px"><strong>Facility:</strong> %s</p>
                  <p style="margin:0 0 8px"><strong>Date:</strong> %s</p>
                  <p style="margin:0 0 8px"><strong>Time:</strong> %s – %s</p>
                  <p style="margin:0"><strong>Status:</strong>
                    <span style="background:%s;color:#fff;padding:2px 10px;
                                 border-radius:12px;font-size:12px">%s</span>
                  </p>
                </div>
                %s
                <p style="color:#6b7280;font-size:12px">Booking #%d</p>
              </div>
            </body>
            </html>
            """.formatted(userName, facilityName, date, startTime, endTime,
                    badgeColor, status, notesHtml, bookingId);
    }
}

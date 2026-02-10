package com.tws.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class MailService {
    private static final Logger logger = LoggerFactory.getLogger(MailService.class);
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String from;

    public MailService(JavaMailSender mailSender, TemplateEngine templateEngine,
                       @Value("${spring.mail.username:}") String from) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.from = from;
    }

    public void sendVerificationCode(String email, String name, String code) {
        if (email == null || email.isBlank()) {
            logger.warn("Skipping verification code send because email is blank");
            return;
        }

        Context context = new Context();
        context.setVariable("code", code);
        context.setVariable("name", (name == null || name.isBlank()) ? "Ola" : name);
        String html = templateEngine.process("mail/verification-code", context);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(email);
            if (from != null && !from.isBlank()) {
                helper.setFrom(from);
            }
            helper.setSubject("Codigo de verificacao");
            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Verification code sent to {}", email);
        } catch (MessagingException ex) {
            logger.error("Failed to send verification code to {}", email, ex);
            throw new IllegalStateException("Failed to send verification email");
        }
    }
}

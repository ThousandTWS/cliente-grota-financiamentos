package org.example.server.core.email;

import org.example.server.core.email.EmailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import jakarta.mail.MessagingException;

@Component
public class EmailMessageFactory {

    private final JavaMailSender mailSender;

    public EmailMessageFactory(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public MimeMessageHelper create(String to, String subject, String from) {
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mailSender.createMimeMessage(), "utf-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(from);
            helper.setText("", true);
            return helper;
        } catch (MessagingException e) {
            throw new EmailException("Não foi possível construir a mensagem de e-mail", e);
        }
    }
}



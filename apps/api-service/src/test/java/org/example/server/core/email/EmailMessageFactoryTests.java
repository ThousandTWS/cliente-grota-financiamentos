package org.example.server.core.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EmailMessageFactoryTests {

    @Test
    void buildsMimeMessageHelperWithRecipientAndSubject() throws MessagingException {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        EmailMessageFactory factory = new EmailMessageFactory(sender);

        var helper = factory.create("destino@teste.local", "Teste de assunto", "remetente@teste.local");
        MimeMessage message = helper.getMimeMessage();

        assertEquals("Teste de assunto", message.getSubject());
        assertEquals("remetente@teste.local", message.getFrom()[0].toString());
        assertEquals("destino@teste.local", message.getAllRecipients()[0].toString());
    }
}



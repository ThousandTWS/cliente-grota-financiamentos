package org.example.server.core.email;

import org.example.server.core.email.EmailException;
import org.example.server.modules.document.model.Document;
import org.example.server.core.email.EmailMessageFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine springTemplateEngine;
    private final EmailMessageFactory emailMessageFactory;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender, SpringTemplateEngine springTemplateEngine, EmailMessageFactory emailMessageFactory) {
        this.mailSender = mailSender;
        this.springTemplateEngine = springTemplateEngine;
        this.emailMessageFactory = emailMessageFactory;
    }

    @Async
    public void sendVerificationEmail(String to, String code){
        sendEmailWithTemplate(to, "Verificação de E-mail", "verification-email", code);
    }

    @Async
    public void sendPasswordResetEmail(String to, String code) {
        sendEmailWithTemplate(to, "Redefinição de Senha", "password-reset-email", code);
    }

    @Async
    public void sendPasswordToEmail(String to, String password){
        sendEmailWithTemplate(to, "Senha para login", "password-seller", password);
    }

    @Async
    public void sendReviewDocument(String to, Document document){
        try {
            Context ctx = new Context();
            ctx.setVariable("documentType", document.getDocumentType());
            ctx.setVariable("reviewStatus", document.getReviewStatus());
            ctx.setVariable("reviewComment", document.getReviewComment());

            String html = springTemplateEngine.process("document-review", ctx);

            MimeMessageHelper helper = emailMessageFactory.create(to, "Atualização no status do seu documento", fromEmail);
            helper.setText(html, true);
            mailSender.send(helper.getMimeMessage());

        } catch (Exception e) {
            throw new EmailException("Não foi possível enviar e-mail de revisão de documento", e);
        }
    }

    @Async
    protected void sendEmailWithTemplate(String to, String subject, String templateName, String code){
        try {
            Context ctx = new Context();
            ctx.setVariable("code", code);

            String html = springTemplateEngine.process(templateName, ctx);

            MimeMessageHelper helper = emailMessageFactory.create(to, subject, fromEmail);
            helper.setText(html, true);
            mailSender.send(helper.getMimeMessage());

        } catch (Exception e) {
            throw new EmailException("Não foi possível enviar e-mail", e);
        }
    }
}



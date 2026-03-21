package com.grota.backend.web.rest.errors;

import java.io.Serial;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;
import tech.jhipster.web.rest.errors.ProblemDetailWithCause.ProblemDetailWithCauseBuilder;

@SuppressWarnings("java:S110")
public class EmailAlreadyRegisteredException extends ErrorResponseException {

    @Serial
    private static final long serialVersionUID = 1L;

    public EmailAlreadyRegisteredException(String message) {
        super(
            HttpStatus.CONFLICT,
            ProblemDetailWithCauseBuilder.instance()
                .withStatus(HttpStatus.CONFLICT.value())
                .withType(URI.create("https://www.jhipster.tech/problem/problem-with-message"))
                .withTitle(message)
                .withDetail(message)
                .withProperty("message", "error.emailAlreadyRegistered")
                .withProperty("params", "financingUser")
                .build(),
            null
        );
    }
}

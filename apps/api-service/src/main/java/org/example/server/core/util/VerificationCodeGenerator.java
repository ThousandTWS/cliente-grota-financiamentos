package org.example.server.core.util;

import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class VerificationCodeGenerator {
    public String generate() {
        return String.format("%06d", new Random().nextInt(1_000_000));
    }
}



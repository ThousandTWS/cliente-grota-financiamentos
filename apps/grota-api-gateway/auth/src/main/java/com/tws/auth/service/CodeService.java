package com.tws.auth.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class CodeService {
    private final SecureRandom random = new SecureRandom();

    public String generateNumericCode(int length) {
        int max = (int) Math.pow(10, length);
        int code = random.nextInt(max);
        return String.format("%0" + length + "d", code);
    }
}

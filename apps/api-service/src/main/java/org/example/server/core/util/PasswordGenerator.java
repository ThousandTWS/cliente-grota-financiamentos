package org.example.server.core.util;

import java.security.SecureRandom;

public final class PasswordGenerator {

    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SYMBOLS = "!@#$%&*";
    private static final String ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_LENGTH = 14;

    private PasswordGenerator() {
    }

    public static String generate() {
        return generate(DEFAULT_LENGTH);
    }

    public static String generate(int length) {
        if (length < 4) {
            length = 4;
        }

        StringBuilder password = new StringBuilder(length);

        password.append(LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length())));
        password.append(UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length())));
        password.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        password.append(SYMBOLS.charAt(RANDOM.nextInt(SYMBOLS.length())));

        for (int i = 4; i < length; i++) {
            password.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }

        return new String(passwordArray);
    }

    public static boolean isNullOrBlank(String password) {
        return password == null || password.isBlank();
    }
}



package org.example.server.util;

import java.security.SecureRandom;

/**
 * Utility class for generating secure random passwords.
 */
public final class PasswordGenerator {

    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SYMBOLS = "!@#$%&*";
    private static final String ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_LENGTH = 14;

    private PasswordGenerator() {
        // Utility class
    }

    /**
     * Generates a secure random password with 14 characters containing
     * at least one lowercase, one uppercase, one digit, and one symbol.
     *
     * @return a secure random password
     */
    public static String generate() {
        return generate(DEFAULT_LENGTH);
    }

    /**
     * Generates a secure random password with the specified length.
     *
     * @param length the desired password length (minimum 4)
     * @return a secure random password
     */
    public static String generate(int length) {
        if (length < 4) {
            length = 4;
        }

        StringBuilder password = new StringBuilder(length);

        // Ensure at least one character from each category
        password.append(LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length())));
        password.append(UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length())));
        password.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        password.append(SYMBOLS.charAt(RANDOM.nextInt(SYMBOLS.length())));

        // Fill the rest with random characters from all categories
        for (int i = 4; i < length; i++) {
            password.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        // Shuffle the password to avoid predictable positions
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }

        return new String(passwordArray);
    }

    /**
     * Checks if a password string is null or blank.
     *
     * @param password the password to check
     * @return true if the password is null or blank
     */
    public static boolean isNullOrBlank(String password) {
        return password == null || password.isBlank();
    }
}

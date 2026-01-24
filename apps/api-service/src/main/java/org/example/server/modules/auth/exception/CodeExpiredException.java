package org.example.server.modules.auth.exception;

public class CodeExpiredException extends RuntimeException{
    public CodeExpiredException(String message){ super(message); }
}



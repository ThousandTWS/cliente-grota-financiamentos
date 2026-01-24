package org.example.server.modules.user.exception;

public class UserAlreadyVerifiedException extends RuntimeException{
    public UserAlreadyVerifiedException(String message){ super(message); }
}



package org.example.server.modules.user.exception;

public class UserNotVerifiedException extends RuntimeException{
    public UserNotVerifiedException(String messagem){
        super(messagem);
    }
}



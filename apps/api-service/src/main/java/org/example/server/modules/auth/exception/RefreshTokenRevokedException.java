package org.example.server.modules.auth.exception;

public class RefreshTokenRevokedException extends RuntimeException{
    public RefreshTokenRevokedException(String message){
        super(message);
    }
}



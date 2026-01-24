package org.example.server.modules.document.exception;

public class DocumentUploadException extends RuntimeException {
    public DocumentUploadException(String message, Throwable cause){
        super(message, cause);
    }

    public DocumentUploadException(String message){
        super(message);
    }
}



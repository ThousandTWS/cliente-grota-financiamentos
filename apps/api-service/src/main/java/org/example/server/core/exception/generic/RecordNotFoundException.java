package org.example.server.core.exception.generic;

public class RecordNotFoundException extends RuntimeException{
    public RecordNotFoundException(Long id){
        super("Registro não encontrado com o id " + id);
    }
    public RecordNotFoundException(String messagem){
        super(messagem);
    }
}



package org.example.server.core.exception;

import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.modules.auth.exception.CodeExpiredException;
import org.example.server.modules.auth.exception.InvalidPasswordException;
import org.example.server.modules.auth.exception.RefreshTokenExpiredException;
import org.example.server.modules.auth.exception.RefreshTokenRevokedException;
import org.example.server.modules.dealer.exception.InvalidLogoException;
import org.example.server.modules.dealer.exception.LogoUploadException;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.user.exception.UserAlreadyVerifiedException;
import org.example.server.modules.user.exception.UserNotVerifiedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApplicationControllerAdvice {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
        List<String> erros = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.toList());

        return new ErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                erros
        );
    }

    @ExceptionHandler(RecordNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFoundRequestExceptions(RuntimeException ex){
        return new ErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DataAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleAlreadyExists(DataAlreadyExistsException ex){
        return new ErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CodeExpiredException.class)
    @ResponseStatus(HttpStatus.GONE)
    public ErrorResponse handleCodeExpired(CodeExpiredException ex) {
        return new ErrorResponse(HttpStatus.GONE, ex.getMessage());
    }

    @ExceptionHandler(UserAlreadyVerifiedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleUserAlreadyVerified(UserAlreadyVerifiedException ex) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(UserNotVerifiedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleUserNotVerifiedException(UserNotVerifiedException ex){
        return new ErrorResponse(
                HttpStatus.FORBIDDEN,
                ex.getMessage()
        );
    }

    @ExceptionHandler(InvalidPasswordException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidPasswordException(InvalidPasswordException ex){
        return new ErrorResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleAccessDeniedException(AccessDeniedException ex) {
        return new ErrorResponse(
                HttpStatus.FORBIDDEN,
                ex.getMessage()
        );
    }

    @ExceptionHandler(RefreshTokenExpiredException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleRefreshTokenExpiredException(RefreshTokenExpiredException ex){
        return new ErrorResponse(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage()
        );
    }

    @ExceptionHandler(RefreshTokenRevokedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleRefreshTokenRevokedException(RefreshTokenRevokedException ex){
        return new ErrorResponse(
                HttpStatus.FORBIDDEN,
                ex.getMessage()
        );
    }

    @ExceptionHandler(InvalidLogoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidLogo(InvalidLogoException ex) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(LogoUploadException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleLogoUploadException(LogoUploadException ex) {
        return new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleJsonParseError(HttpMessageNotReadableException ex) {
        return new ErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Valor invalido para o campo 'status'.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException ex) {
        return new ErrorResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage());
    }

}



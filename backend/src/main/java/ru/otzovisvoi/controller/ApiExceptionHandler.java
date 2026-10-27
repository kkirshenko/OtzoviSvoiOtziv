package ru.otzovisvoi.controller;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class ApiExceptionHandler {
 private static final Logger log=LoggerFactory.getLogger(ApiExceptionHandler.class);
 @ExceptionHandler(MethodArgumentNotValidException.class)
 public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException ex){
  String message=ex.getBindingResult().getFieldErrors().stream().findFirst().map(e->e.getDefaultMessage()).orElse("Проверьте входные данные");
  return ResponseEntity.badRequest().body(Map.of("error",message));
 }
 @ExceptionHandler(IllegalStateException.class)
 public ResponseEntity<Map<String,String>> unavailable(IllegalStateException ex){
  log.warn("Ошибка анализа: {}",ex.getMessage());
  return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error",ex.getMessage()==null?"Ошибка сервиса AI":ex.getMessage()));
 }
 @ExceptionHandler(Exception.class)
 public ResponseEntity<Map<String,String>> unexpected(Exception ex){
  log.error("Непредвиденная ошибка API: {}",ex.getClass().getSimpleName());
  return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error","Внутренняя ошибка сервера"));
 }
}

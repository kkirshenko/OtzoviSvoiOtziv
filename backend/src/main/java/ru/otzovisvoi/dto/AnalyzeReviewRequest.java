package ru.otzovisvoi.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record AnalyzeReviewRequest(@NotBlank(message="Текст отзыва обязателен") @Size(max=10000,message="Отзыв не должен превышать 10 000 символов") String review) {}

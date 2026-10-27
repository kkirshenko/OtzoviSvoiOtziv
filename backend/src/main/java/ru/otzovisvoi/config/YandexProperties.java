package ru.otzovisvoi.config;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix = "app.yandex")
public record YandexProperties(String baseUrl, String apiKey, String projectId, String promptId, Duration timeout) {}

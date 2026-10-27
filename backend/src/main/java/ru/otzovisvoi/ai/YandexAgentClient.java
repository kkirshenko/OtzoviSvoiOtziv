package ru.otzovisvoi.ai;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import ru.otzovisvoi.config.YandexProperties;

@Component
public class YandexAgentClient implements LlmClient {
 private static final Logger log = LoggerFactory.getLogger(YandexAgentClient.class);
 private final YandexProperties properties;
 private final RestClient client;
 public YandexAgentClient(YandexProperties properties) {
  this.properties = properties;
  SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
  Duration timeout = properties.timeout() == null ? Duration.ofSeconds(45) : properties.timeout();
  factory.setConnectTimeout(timeout);
  factory.setReadTimeout(timeout);
  this.client = RestClient.builder().baseUrl(properties.baseUrl())
   .requestFactory(factory).defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).build();
 }
 @Override
 @Retry(name = "yandexAgent")
 @CircuitBreaker(name = "yandexAgent", fallbackMethod = "fallback")
 public String generate(String input) {
  if (properties.apiKey() == null || properties.apiKey().isBlank()) throw new IllegalStateException("Не задана переменная окружения YANDEX_API_KEY");
  Map<String,Object> body = Map.of("prompt",Map.of("id",properties.promptId()),"input",input,
   "tools",List.of(Map.of("type","web_search","filters",Map.of("allowed_domains",List.of()),"search_context_size","medium")));
  try {
   JsonNode response = client.post().uri("/responses").header("Authorization","Bearer "+properties.apiKey())
    .header("OpenAI-Project",properties.projectId()).body(body).retrieve().body(JsonNode.class);
   if (response == null) throw new IllegalStateException("Yandex Agent вернул пустой ответ");
   JsonNode text = response.get("output_text");
   if (text != null && text.isTextual() && !text.asText().isBlank()) return text.asText();
   StringBuilder result = new StringBuilder();
   JsonNode output = response.path("output");
   if (output.isArray()) for (JsonNode item : output) {
    JsonNode parts = item.path("content");
    if (parts.isArray()) for (JsonNode part : parts) {
     if ("output_text".equals(part.path("type").asText()) && part.hasNonNull("text")) {
      if (result.length() > 0) result.append("\n");
      result.append(part.path("text").asText());
     }
    }
   }
   if (result.length() > 0) return result.toString();
   throw new IllegalStateException("В ответе Yandex Agent не найден текст");
  } catch (RestClientResponseException ex) {
   log.warn("Yandex Agent HTTP status {}",ex.getStatusCode().value());
   throw new IllegalStateException("Сервис AI временно не смог обработать отзыв (HTTP "+ex.getStatusCode().value()+")",ex);
  } catch (RestClientException ex) {
   log.warn("Ошибка соединения с Yandex Agent: {}",ex.getClass().getSimpleName());
   throw new IllegalStateException("Не удалось подключиться к сервису AI",ex);
  }
 }
 private String fallback(String input, Throwable cause) {
  log.warn("AI Gateway fallback: {}", cause.getClass().getSimpleName());
  throw new IllegalStateException("Сервис AI временно недоступен. Повторите попытку позже.", cause);
 }
}

package ru.otzovisvoi.config;
import java.time.Duration;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
@Configuration
public class HttpClientConfig {
 @Bean RestClientCustomizer restClientTimeoutCustomizer(YandexProperties properties) {
  return builder -> {
   SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
   Duration timeout = properties.timeout() == null ? Duration.ofSeconds(45) : properties.timeout();
   factory.setConnectTimeout(timeout);
   factory.setReadTimeout(timeout);
   builder.requestFactory(factory);
  };
 }
}

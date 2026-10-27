package ru.otzovisvoi.ai;
import org.springframework.stereotype.Component;
@Component
public class AiGateway {
 private final LlmClient llmClient;
 public AiGateway(LlmClient llmClient) { this.llmClient = llmClient; }
 public String analyze(String review) { return llmClient.generate(review); }
}

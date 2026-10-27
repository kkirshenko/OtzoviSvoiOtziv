package ru.otzovisvoi.dto;
import java.util.List;
public record ReviewAnalysisResponse(String sentiment, int score, String summary, List<Issue> issues, List<String> recommendations, String risk) {
 public record Issue(String category, String severity, String evidence, String recommendation) {}
}

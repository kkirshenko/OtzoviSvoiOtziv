package ru.otzovisvoi.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;
import ru.otzovisvoi.dto.ReviewAnalysisResponse;

@Service
public class ReviewHistoryService {
    private final AtomicLong sequence = new AtomicLong();
    private final CopyOnWriteArrayList<ReviewRecord> records = new CopyOnWriteArrayList<>();

    public ReviewRecord save(String review, ReviewAnalysisResponse analysis) {
        ReviewRecord record = new ReviewRecord(sequence.incrementAndGet(), review, Instant.now(), analysis);
        records.add(0, record);
        return record;
    }

    public List<ReviewRecord> findAll() {
        return records.stream().sorted(Comparator.comparing(ReviewRecord::analyzedAt).reversed()).toList();
    }

    public ReportStats stats() {
        int total = records.size();
        int attention = (int) records.stream().filter(r ->
            r.analysis().score() < 60 || !r.analysis().issues().isEmpty()
                && r.analysis().issues().stream().anyMatch(i ->
                    "Критическая".equals(i.severity()) || "Высокая".equals(i.severity()))
        ).count();
        int positive = (int) records.stream().filter(r ->
            r.analysis().sentiment().toLowerCase().contains("позит")
        ).count();
        double average = total == 0 ? 0 : records.stream().mapToInt(r -> r.analysis().score()).average().orElse(0);
        return new ReportStats(total, attention, positive, Math.round(average));
    }

    public record ReviewRecord(long id, String review, Instant analyzedAt, ReviewAnalysisResponse analysis) {}
    public record ReportStats(int totalReviews, int requiresAttention, int positiveReviews, long averageScore) {}
}

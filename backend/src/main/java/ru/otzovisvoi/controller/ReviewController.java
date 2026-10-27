package ru.otzovisvoi.controller;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import ru.otzovisvoi.dto.AnalyzeReviewRequest;
import ru.otzovisvoi.dto.ReviewAnalysisResponse;
import ru.otzovisvoi.service.ReviewAnalysisService;
import ru.otzovisvoi.service.ReviewHistoryService;
import ru.otzovisvoi.service.ReviewHistoryService.ReportStats;
import ru.otzovisvoi.service.ReviewHistoryService.ReviewRecord;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewAnalysisService service;
    private final ReviewHistoryService history;
    private final MeterRegistry metrics;

    public ReviewController(ReviewAnalysisService service, ReviewHistoryService history, MeterRegistry metrics) {
        this.service = service;
        this.history = history;
        this.metrics = metrics;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ReviewAnalysisResponse analyze(@Valid @RequestBody AnalyzeReviewRequest request) {
        metrics.counter("review.analysis.requests").increment();
        try {
            ReviewAnalysisResponse result = service.analyze(request.review());
            history.save(request.review(), result);
            metrics.counter("review.analysis.success").increment();
            return result;
        } catch (RuntimeException ex) {
            metrics.counter("review.analysis.errors").increment();
            throw ex;
        }
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ReviewRecord> history() {
        return history.findAll();
    }

    @GetMapping(value = "/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ReportStats stats() {
        return history.stats();
    }

    @GetMapping(value = "/reports", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ReviewRecord> reports() {
        return history.findAll();
    }
}

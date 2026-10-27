package ru.otzovisvoi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
@SpringBootApplication
@ConfigurationPropertiesScan
public class ReviewAnalyzerApplication {
 public static void main(String[] args) { SpringApplication.run(ReviewAnalyzerApplication.class, args); }
}

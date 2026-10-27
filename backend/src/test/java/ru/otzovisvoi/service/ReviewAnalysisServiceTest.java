package ru.otzovisvoi.service;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ru.otzovisvoi.ai.AiGateway;
import ru.otzovisvoi.dto.ReviewAnalysisResponse;
class ReviewAnalysisServiceTest {
 private AiGateway gateway; private ReviewAnalysisService service;
 @BeforeEach void setUp(){gateway=mock(AiGateway.class);service=new ReviewAnalysisService(gateway,new ObjectMapper());}
 @Test void parsesValidAnalysisAndClampsScore(){
  when(gateway.analyze(anyString())).thenReturn("{\"sentiment\":\"Негативная\",\"score\":140,\"summary\":\"Задержка\",\"risk\":\"Высокий\",\"issues\":[{\"category\":\"Срок доставки\",\"severity\":\"Высокая\",\"evidence\":\"опоздал\",\"recommendation\":\"Проверить маршрут\"}],\"recommendations\":[\"Связаться с клиентом\"]}");
  ReviewAnalysisResponse result=service.analyze("Курьер опоздал");
  assertEquals(100,result.score());assertEquals("Негативная",result.sentiment());assertEquals(1,result.issues().size());
 }
 @Test void rejectsMalformedAgentResponse(){when(gateway.analyze(anyString())).thenReturn("ответ без JSON");assertThrows(IllegalStateException.class,()->service.analyze("Отзыв"));}
}

package com.innotrader.common.config;

import com.innotrader.common.security.StompAuthChannelInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket / STOMP message broker configuration.
 *
 * <p>Endpoint: {@code /ws} — SockJS fallback enabled.
 * <ul>
 *   <li>Simple broker destinations: {@code /topic} (broadcast), {@code /queue} (point-to-point)</li>
 *   <li>Application destination prefix: {@code /app} — routes to {@code @MessageMapping} methods</li>
 *   <li>User destination prefix: {@code /user} — routes to specific user sessions</li>
 * </ul>
 *
 * <p>인증/인가는 {@link StompAuthChannelInterceptor}가 STOMP 프레임 단위로 강제한다
 * (CONNECT의 JWT 검증, 계좌 활동 채널 SUBSCRIBE의 소유권 검사).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.security.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    public WebSocketConfig(StompAuthChannelInterceptor stompAuthChannelInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        String origins = allowedOrigins != null ? allowedOrigins : "";
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(origins.split(","))
            .withSockJS();
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}

package com.innotrader.common.security;

import com.innotrader.account.domain.port.in.AccountUseCase;
import io.jsonwebtoken.JwtException;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.UUID;

/**
 * STOMP CONNECT 프레임의 JWT를 검증해 WebSocket 세션에 인증 주체를 부여하고,
 * 계좌 활동 채널({@code /topic/account/activity/{accountNo}}) 구독 시 계좌 소유권을 검사한다.
 *
 * <p>WebSocket 핸드셰이크(HTTP 업그레이드, {@code /ws/**})는 {@code SecurityConfig}에서 permitAll이지만
 * (SockJS는 커스텀 헤더를 못 실어 핸드셰이크 단계에서 Bearer 인증이 불가하기 때문),
 * 실제 인증/인가는 여기서 STOMP 프레임 단위로 강제한다 — CONNECT에 유효한 토큰이 없으면 연결을 끊고,
 * SUBSCRIBE 대상 계좌를 소유하지 않았으면 구독을 거부한다.
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String ACCOUNT_ACTIVITY_PREFIX = "/topic/account/activity/";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final AccountUseCase accountUseCase;

    public StompAuthChannelInterceptor(JwtTokenProvider jwtTokenProvider, AccountUseCase accountUseCase) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.accountUseCase = accountUseCase;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            accessor.setUser(authenticate(accessor));
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscription(accessor);
        }
        return message;
    }

    private Principal authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            throw new MessagingException("WebSocket 연결에는 유효한 인증 토큰이 필요합니다.");
        }
        String token = header.substring(BEARER_PREFIX.length());
        try {
            String userId = jwtTokenProvider.extractUserId(token);
            return new JwtPrincipal(userId);
        } catch (JwtException e) {
            throw new MessagingException("유효하지 않거나 만료된 토큰입니다.", e);
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(ACCOUNT_ACTIVITY_PREFIX)) {
            return;
        }
        Principal user = accessor.getUser();
        if (user == null) {
            throw new MessagingException("인증되지 않은 구독 요청입니다.");
        }
        String accountNo = destination.substring(ACCOUNT_ACTIVITY_PREFIX.length());
        try {
            // 소유하지 않은 계좌면 AccountUseCase가 ACCOUNT_NOT_FOUND(BusinessException)를 던진다.
            accountUseCase.orderableAmount(UUID.fromString(user.getName()), accountNo);
        } catch (RuntimeException e) {
            throw new MessagingException("해당 계좌에 대한 구독 권한이 없습니다: " + accountNo, e);
        }
    }

    private record JwtPrincipal(String userId) implements Principal {
        @Override
        public String getName() {
            return userId;
        }
    }
}

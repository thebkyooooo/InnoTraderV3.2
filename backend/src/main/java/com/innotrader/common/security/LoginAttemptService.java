package com.innotrader.common.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 이메일 기준 로그인 실패 횟수를 Redis에 기록해 자격증명 브루트포스 공격을 완화한다.
 *
 * <p>Key layout: {@code login:fail:{email}} → 실패 횟수 (TTL: {@link #WINDOW}, 첫 실패 시점 기준).
 */
@Service
public class LoginAttemptService {

    private static final String PREFIX = "login:fail:";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final StringRedisTemplate redisTemplate;

    public LoginAttemptService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /** 최근 {@link #WINDOW} 내 실패 횟수가 {@link #MAX_ATTEMPTS} 이상이면 잠금 상태. */
    public boolean isLockedOut(String email) {
        String value = redisTemplate.opsForValue().get(key(email));
        return value != null && Long.parseLong(value) >= MAX_ATTEMPTS;
    }

    /** 실패 1회 기록. 최초 실패 시 TTL을 설정해 {@link #WINDOW} 경과 후 자동 해제되게 한다. */
    public void recordFailure(String email) {
        String redisKey = key(email);
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redisTemplate.expire(redisKey, WINDOW);
        }
    }

    /** 로그인 성공 시 실패 카운터 초기화. */
    public void reset(String email) {
        redisTemplate.delete(key(email));
    }

    private String key(String email) {
        return PREFIX + email.toLowerCase();
    }
}

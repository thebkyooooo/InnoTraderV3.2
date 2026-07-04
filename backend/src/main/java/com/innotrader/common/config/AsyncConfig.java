package com.innotrader.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Async execution configuration using Java 21 virtual threads.
 *
 * <p>Registers a virtual-thread-based {@link Executor} as the default Spring async executor.
 * Virtual threads are lightweight and allow high concurrency without the overhead of
 * platform thread pools — ideal for I/O-bound async tasks (e.g. notification dispatch,
 * order event publishing).
 *
 * <p>Requires {@code spring.threads.virtual.enabled=true} in application.yml (already set)
 * for Spring Boot's own embedded container threads; this bean covers {@code @Async} methods.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    /**
     * Virtual-thread executor used by {@code @Async} methods.
     *
     * <p>Named {@code taskExecutor} so Spring Boot's auto-configuration detects it as the
     * primary async executor without further qualification.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        return Executors.newThreadPerTaskExecutor(
            Thread.ofVirtual()
                .name("async-vt-", 0)
                .factory()
        );
    }

    /**
     * 브로드캐스터 전용 스케줄러 — 런타임 재스케줄링을 위해 별도 TaskScheduler 사용.
     *
     * <p>StockPriceBroadcaster·MarketDataBroadcaster·OrderFillEngine 3개의 독립적인 주기 작업이
     * 이 스케줄러를 공유한다. 스레드 1개로는 한 작업이 지연될 때 나머지가 밀리므로, 작업 수만큼
     * 여유를 둔다(4 = 현재 3개 + 여유 1).
     */
    @Bean(name = "broadcastTaskScheduler")
    public TaskScheduler broadcastTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("broadcast-sched-");
        scheduler.initialize();
        return scheduler;
    }
}

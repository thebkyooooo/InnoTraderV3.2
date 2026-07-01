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

    /** 브로드캐스터 단독 스레드 — 런타임 재스케줄링을 위해 별도 TaskScheduler 사용. */
    @Bean(name = "broadcastTaskScheduler")
    public TaskScheduler broadcastTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("broadcast-sched-");
        scheduler.initialize();
        return scheduler;
    }
}

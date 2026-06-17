package com.innotrader;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class InnoTraderApplication {
    public static void main(String[] args) {
        SpringApplication.run(InnoTraderApplication.class, args);
    }
}

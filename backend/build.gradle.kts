// Spring Boot 3.4.1 + Spring Framework 6.2.x
// (Spring Boot 4.0 + Spring Framework 7 is not yet GA as of June 2026;
//  using latest stable 3.4.x. Upgrade to 4.0 once GA is released.)

import org.gradle.api.tasks.compile.JavaCompile
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    java
}

group = "com.innotrader"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.data.redis)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.websocket)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.actuator)

    // OpenAPI / Swagger
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // QueryDSL
    implementation(libs.querydsl.jpa) {
        artifact {
            classifier = "jakarta"
        }
    }
    annotationProcessor(libs.querydsl.apt) {
        artifact {
            classifier = "jakarta"
        }
    }
    annotationProcessor(libs.jakarta.persistence.api)

    // Flyway
    implementation(libs.flyway.core)
    runtimeOnly(libs.flyway.database.postgresql)

    // PostgreSQL Driver
    runtimeOnly(libs.postgresql)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // Jasypt Encryption
    implementation(libs.jasypt.spring.boot.starter)

    // MapStruct
    implementation(libs.mapstruct)
    annotationProcessor(libs.mapstruct.processor)

    // Test
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.archunit.junit5)
}

// QueryDSL APT: place generated Q-types under build/generated/querydsl
val querydslDir = layout.buildDirectory.dir("generated/querydsl").get().asFile

sourceSets {
    main {
        java {
            srcDir(querydslDir)
        }
    }
}

tasks.withType<JavaCompile> {
    options.generatedSourceOutputDirectory.set(querydslDir)
    options.compilerArgs.addAll(
        listOf(
            "-Amapstruct.defaultComponentModel=spring",
            "-Amapstruct.unmappedTargetPolicy=WARN"
        )
    )
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}

// 진단: bootRun 비정상 종료 원인 격리용.
// 다음 종료 후 backend/ 에 hs_err_pid*.log 가 생기면 JVM 네이티브 크래시,
// 안 생기면 외부 강제 종료(세션/데몬)로 확정한다.
tasks.named<BootRun>("bootRun") {
    jvmArgs(
        "-XX:ErrorFile=${projectDir}/hs_err_pid%p.log",
        "-XX:+HeapDumpOnOutOfMemoryError",
        "-XX:HeapDumpPath=${projectDir}",
        "-Xlog:gc*:file=${projectDir}/gc.log:time,uptime:filecount=3,filesize=10m",
        "-XX:TieredStopAtLevel=1", // JIT C2 비활성화 — 크래시 재현 안되면 JIT 버그
    )
}

package com.innotrader.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.Entity;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * ArchUnit tests enforcing the Hexagonal (Ports & Adapters) architecture constraints
 * for the InnoTrader backend.
 *
 * <p>Package conventions:
 * <pre>
 * com.innotrader
 * ├── domain          — pure domain model (entities, value objects, domain services)
 * ├── application     — use cases / application services (orchestration only)
 * │   └── service     — @UseCase implementations
 * └── adapter
 *     ├── in.web      — inbound HTTP adapters (@RestController)
 *     └── out         — outbound adapters (persistence, messaging, …)
 * </pre>
 */
@DisplayName("Hexagonal Architecture Rules")
class HexagonalArchitectureTest {

    private static final String BASE_PACKAGE = "com.innotrader";

    private static JavaClasses importedClasses;

    @BeforeAll
    static void importClasses() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages(BASE_PACKAGE);
    }

    // -------------------------------------------------------------------------
    // Domain isolation rules
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("domain must not depend on adapter")
    void domainMustNotDependOnAdapter() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().dependOnClassesThat()
                .resideInAPackage(BASE_PACKAGE + ".adapter..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("domain must not depend on application")
    void domainMustNotDependOnApplication() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().dependOnClassesThat()
                .resideInAPackage(BASE_PACKAGE + ".application..");

        rule.check(importedClasses);
    }

    // -------------------------------------------------------------------------
    // Domain purity — no Spring / JPA stereotypes in domain layer
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("domain classes must not be annotated with @Entity")
    void domainMustNotHaveEntityAnnotation() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().beAnnotatedWith(Entity.class);

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("domain classes must not be annotated with @Repository")
    void domainMustNotHaveRepositoryAnnotation() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().beAnnotatedWith(Repository.class);

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("domain classes must not be annotated with @Service")
    void domainMustNotHaveServiceAnnotation() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().beAnnotatedWith(Service.class);

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("domain classes must not be annotated with @Component")
    void domainMustNotHaveComponentAnnotation() {
        ArchRule rule = noClasses()
                .that().resideInAPackage(BASE_PACKAGE + ".domain..")
                .should().beAnnotatedWith(Component.class);

        rule.check(importedClasses);
    }

    // -------------------------------------------------------------------------
    // Adapter conventions
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("adapter.in.web classes must be annotated with @RestController")
    void webAdaptersMustBeRestControllers() {
        ArchRule rule = classes()
                .that().resideInAPackage(BASE_PACKAGE + ".adapter.in.web..")
                .and().areTopLevelClasses()
                .and().areNotInterfaces()
                .and().areNotAnnotatedWith(java.lang.Deprecated.class)
                .should().beAnnotatedWith(RestController.class);

        rule.check(importedClasses);
    }

    // -------------------------------------------------------------------------
    // UseCase placement
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("@UseCase classes must reside in application.service package")
    void useCaseClassesMustResideInApplicationServicePackage() {
        ArchRule rule = classes()
                .that().areAnnotatedWith(com.innotrader.common.annotation.UseCase.class)
                .should().resideInAPackage(BASE_PACKAGE + ".application.service..");

        rule.check(importedClasses);
    }
}

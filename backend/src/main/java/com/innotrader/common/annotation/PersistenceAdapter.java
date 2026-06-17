package com.innotrader.common.annotation;

import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Stereotype annotation for persistence adapter classes (outbound adapters).
 * Acts as a meta-annotation wrapping {@link Component} so that annotated classes
 * are picked up by Spring's component scan while also being identifiable as
 * persistence adapters in ArchUnit architecture tests.
 * <p>
 * Apply to classes in the {@code adapter.out.persistence} package that implement
 * domain-defined output port interfaces.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface PersistenceAdapter {

    @AliasFor(annotation = Component.class)
    String value() default "";
}

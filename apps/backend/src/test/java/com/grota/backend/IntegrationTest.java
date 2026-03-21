package com.grota.backend;

import com.grota.backend.config.AsyncSyncConfiguration;
import com.grota.backend.config.ElasticsearchTestConfiguration;
import com.grota.backend.config.ElasticsearchTestContainer;
import com.grota.backend.config.EmbeddedSQL;
import com.grota.backend.config.JacksonConfiguration;
import com.grota.backend.config.TestSecurityConfiguration;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;

/**
 * Base composite annotation for integration tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(
    classes = {
        BackendApp.class,
        JacksonConfiguration.class,
        AsyncSyncConfiguration.class,
        TestSecurityConfiguration.class,
        ElasticsearchTestConfiguration.class,
    }
)
@EmbeddedSQL
@ImportTestcontainers(ElasticsearchTestContainer.class)
public @interface IntegrationTest {
    // 5s is Spring's default https://github.com/spring-projects/spring-framework/blob/main/spring-test/src/main/java/org/springframework/test/web/reactive/server/DefaultWebTestClient.java#L106
    String DEFAULT_TIMEOUT = "PT5S";

    String DEFAULT_ENTITY_TIMEOUT = "PT5S";
}

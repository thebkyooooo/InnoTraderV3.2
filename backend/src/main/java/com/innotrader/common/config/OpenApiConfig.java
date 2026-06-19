package com.innotrader.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI(Swagger UI) 설정.
 *
 * <p>JWT Bearer 인증 스킴을 등록해 Swagger UI에 "Authorize" 버튼을 노출한다.
 * 보호된 엔드포인트({@code /api/private/**} 등)는 로그인으로 발급받은 액세스 토큰을
 * Authorize에 입력해야 호출할 수 있다.
 *
 * <p>사용법:
 * <ol>
 *   <li>{@code POST /api/v1/auth/login} (test@innotrader.com / Test1234!) → 응답의 {@code accessToken} 복사</li>
 *   <li>우측 상단 <b>Authorize</b> 클릭 → 토큰 붙여넣기 (Bearer 접두사 불필요)</li>
 *   <li>보호된 API 호출</li>
 * </ol>
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI innoTraderOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("InnoTrader API")
                        .version("v1")
                        .description("InnoTrader 백엔드 API 문서"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("로그인 후 발급된 액세스 토큰을 입력하세요.")));
    }
}

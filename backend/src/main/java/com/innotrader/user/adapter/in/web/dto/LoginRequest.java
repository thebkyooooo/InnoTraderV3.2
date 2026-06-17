package com.innotrader.user.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * HTTP request body for {@code POST /api/v1/auth/login}.
 *
 * @param email    a valid, non-blank e-mail address
 * @param password plain-text password (validation delegates to domain)
 */
public record LoginRequest(

        @Email(message = "유효한 이메일 주소를 입력하세요.")
        @NotBlank(message = "이메일은 필수 입력 항목입니다.")
        String email,

        @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
        String password
) {}

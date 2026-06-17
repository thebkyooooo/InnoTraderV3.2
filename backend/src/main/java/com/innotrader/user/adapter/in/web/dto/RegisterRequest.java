package com.innotrader.user.adapter.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * HTTP request body for {@code POST /api/v1/auth/register}.
 *
 * @param email    a valid, non-blank e-mail address
 * @param password plain-text password (8–100 characters)
 */
public record RegisterRequest(

        @Email(message = "유효한 이메일 주소를 입력하세요.")
        @NotBlank(message = "이메일은 필수 입력 항목입니다.")
        String email,

        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하로 입력하세요.")
        @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
        String password
) {}

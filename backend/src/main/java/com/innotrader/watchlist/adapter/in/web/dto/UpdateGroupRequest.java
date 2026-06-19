package com.innotrader.watchlist.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 관심그룹 변경(그룹명) 요청. 그룹코드는 경로 변수로 전달. */
public record UpdateGroupRequest(
        @NotBlank @Size(max = 100) String groupName
) {}

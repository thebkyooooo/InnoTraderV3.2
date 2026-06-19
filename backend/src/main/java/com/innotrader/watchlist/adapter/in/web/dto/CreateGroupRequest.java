package com.innotrader.watchlist.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 관심그룹 등록 요청. */
public record CreateGroupRequest(
        @NotBlank @Size(max = 100) String groupName
) {}

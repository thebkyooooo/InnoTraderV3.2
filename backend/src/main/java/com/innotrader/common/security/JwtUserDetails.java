package com.innotrader.common.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * {@link UserDetails} implementation populated from a validated JWT access token.
 *
 * <p>Account lifecycle (active/locked/expired) is managed by the domain layer;
 * all boolean flags here return {@code true}.
 */
public final class JwtUserDetails implements UserDetails {

    private final String userId;
    private final String email;
    private final String role;

    public JwtUserDetails(String userId, String email, String role) {
        this.userId = userId;
        this.email  = email;
        this.role   = role;
    }

    /** Returns the user's UUID string (from the JWT {@code sub} claim). */
    public String getUserId() {
        return userId;
    }

    /** Returns the user's email address (from the JWT {@code email} claim). */
    public String getEmail() {
        return email;
    }

    // -----------------------------------------------------------------------
    // UserDetails contract
    // -----------------------------------------------------------------------

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    /** Not applicable — JWT is stateless; password is never stored here. */
    @Override
    public String getPassword() {
        return null;
    }

    /** Username is the email address. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}

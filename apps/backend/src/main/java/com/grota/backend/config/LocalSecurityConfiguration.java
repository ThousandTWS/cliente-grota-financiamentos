package com.grota.backend.config;

import static org.springframework.security.config.Customizer.withDefaults;
import static org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers.pathMatchers;

import com.grota.backend.security.AuthoritiesConstants;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.MapReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.NegatedServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.OrServerWebExchangeMatcher;

@Configuration
@EnableReactiveMethodSecurity
@ConditionalOnMissingBean(SecurityWebFilterChain.class)
public class LocalSecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityWebFilterChain localSecurityFilterChain(ServerHttpSecurity http) {
        http
            .securityMatcher(
                new NegatedServerWebExchangeMatcher(
                    new OrServerWebExchangeMatcher(pathMatchers("/app/**", "/i18n/**", "/content/**", "/swagger-ui/**"))
                )
            )
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(withDefaults())
            .authorizeExchange(authz ->
                authz
                    .pathMatchers("/api/authenticate").permitAll()
                    .pathMatchers("/api/auth-info").permitAll()
                    .pathMatchers("/api/v1/grota-financiamentos/users").hasAuthority(AuthoritiesConstants.ADMIN)
                    .pathMatchers("/management/health").permitAll()
                    .pathMatchers("/management/health/**").permitAll()
                    .pathMatchers("/management/info").permitAll()
                    .pathMatchers("/management/prometheus").permitAll()
                    .pathMatchers("/v3/api-docs/**").permitAll()
                    .pathMatchers("/api/**").authenticated()
                    .pathMatchers("/services/**").authenticated()
                    .pathMatchers("/management/**").hasAuthority(AuthoritiesConstants.ADMIN)
                    .anyExchange().permitAll()
            );
        return http.build();
    }

    @Bean
    public MapReactiveUserDetailsService userDetailsService() {
        UserDetails admin = User.withUsername("admin").password("{noop}admin").authorities(AuthoritiesConstants.ADMIN).build();
        UserDetails user = User.withUsername("user").password("{noop}user").authorities(AuthoritiesConstants.USER).build();
        return new MapReactiveUserDetailsService(admin, user);
    }
}

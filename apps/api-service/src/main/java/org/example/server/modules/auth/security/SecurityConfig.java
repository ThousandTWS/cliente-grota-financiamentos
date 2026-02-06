package org.example.server.modules.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomAuthEntryPoint customAuthEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, CustomAuthEntryPoint customAuthEntryPoint) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.customAuthEntryPoint = customAuthEntryPoint;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain swaggerSecurityFilterChain(
            HttpSecurity http,
            PasswordEncoder passwordEncoder,
            @Value("${swagger.auth.username:swagger}") String swaggerUsername,
            @Value("${swagger.auth.password:swagger}") String swaggerPassword) throws Exception {

        var swaggerUsers = new InMemoryUserDetailsManager(
                User.withUsername(swaggerUsername)
                        .password(passwordEncoder.encode(swaggerPassword))
                        .roles("SWAGGER")
                        .build());

        http
                .securityMatcher("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**",
                        "/webjars/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().hasRole("SWAGGER"))
                .httpBasic(Customizer.withDefaults())
                .userDetailsService(swaggerUsers);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(customAuthEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Rotas publicas
                        .requestMatchers("/api/v1/grota-financiamentos/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/grota-financiamentos/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/grota-financiamentos/dealers").permitAll()
                        .requestMatchers("/api/v1/grota-financiamentos/sellers/**").permitAll()
                        .requestMatchers("/api/v1/grota-financiamentos/operators/**").permitAll()
                        .requestMatchers("/api/v1/grota-financiamentos/managers/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/grota-financiamentos/dealers/admin-register")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/").permitAll()

                        // Documentos
                        .requestMatchers(HttpMethod.GET, "/api/v1/grota-financiamentos/documents")
                        .hasAnyRole("ADMIN", "LOJISTA", "VENDEDOR", "OPERADOR", "GESTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/grota-financiamentos/documents/*/url")
                        .hasAnyRole("ADMIN", "LOJISTA", "VENDEDOR", "OPERADOR", "GESTOR")
                        .requestMatchers(HttpMethod.POST, "/api/v1/grota-financiamentos/documents/upload")
                        .hasAnyRole("ADMIN", "LOJISTA", "VENDEDOR", "OPERADOR", "GESTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/grota-financiamentos/documents/*/review")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/grota-financiamentos/dealers/logo")
                        .hasRole("LOJISTA")
                        // Propostas - criação permitida para ADMIN, OPERADOR e VENDEDOR
                        .requestMatchers(HttpMethod.POST, "/api/v1/grota-financiamentos/proposals")
                        .hasAnyRole("ADMIN", "OPERADOR", "VENDEDOR", "LOJISTA")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/grota-financiamentos/proposals/*/status")
                        .hasAnyRole("ADMIN", "OPERADOR", "VENDEDOR", "LOJISTA")
                        .requestMatchers(HttpMethod.GET, "/api/v1/grota-financiamentos/proposals/**")
                        .hasAnyRole("ADMIN", "OPERADOR", "VENDEDOR", "LOJISTA", "GESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/grota-financiamentos/proposals/*").hasRole("ADMIN")
                        // Cobrança: liberar para os mesmos perfis das demais operações
                        .requestMatchers("/api/v1/grota-financiamentos/billing/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

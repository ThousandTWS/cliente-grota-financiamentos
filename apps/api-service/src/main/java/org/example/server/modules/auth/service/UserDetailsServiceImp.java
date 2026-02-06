package org.example.server.modules.auth.service;

import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImp implements UserDetailsService {

    private final UserRepository userRepository;
    private final DealerRepository dealerRepository;

    public UserDetailsServiceImp(UserRepository userRepository, DealerRepository dealerRepository) {
        this.userRepository = userRepository;
        this.dealerRepository = dealerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Busca case-insensitive para e-mail e empresa (dealer/lojista)
        return userRepository.findByEmailIgnoreCase(username)
                .or(() -> dealerRepository.findByEnterpriseIgnoreCase(username).map(Dealer::getUser))
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
    }
}

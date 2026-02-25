package com.campus.booking.security;

import com.campus.booking.entity.User;
import com.campus.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /** Used by Spring Security's form-based auth (email as username). */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailAndIsActiveTrue(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    /** Used by the JWT filter — looks up by id to catch deactivations post-token issuance. */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        return userRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    }

    /** Returns the full User entity (not just UserDetails). */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    }
}

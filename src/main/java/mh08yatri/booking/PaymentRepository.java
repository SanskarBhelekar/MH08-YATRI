
package mh08yatri.booking;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingId(Long bookingId);
}

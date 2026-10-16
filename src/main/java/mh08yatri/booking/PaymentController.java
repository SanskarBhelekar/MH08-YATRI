
package mh08yatri.booking;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @PostMapping
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentRequest request) {

        if (request.getBookingId() == null
                || request.getBookingId() <= 0) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "A valid bookingId is required"));
        }

        if (request.getAmount() == null
                || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Amount must be greater than zero"));
        }

        if (request.getPaymentMethod() == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Payment method is required"));
        }

        String method = request.getPaymentMethod()
                .trim().toUpperCase();

        if (!List.of("UPI", "CARD", "CASH").contains(method)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Method must be UPI, CARD, or CASH"));
        }

        Payment payment = new Payment();
        payment.setBookingId(request.getBookingId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(method);
        payment.setCustomerName(request.getCustomerName());
        payment.setEmail(request.getEmail());

        // This records a request; it does not process a real payment.
        payment.setPaymentStatus(
                method.equals("CASH") ? "CASH_PENDING" : "PENDING");

        Payment saved = paymentRepository.save(payment);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Payment not found")));
    }

    @GetMapping("/booking/{bookingId}")
    public List<Payment> getPaymentsForBooking(
            @PathVariable Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    public static class PaymentRequest {

        private Long bookingId;
        private BigDecimal amount;
        private String paymentMethod;
        private String customerName;
        private String email;

        public Long getBookingId() {
            return bookingId;
        }

        public void setBookingId(Long bookingId) {
            this.bookingId = bookingId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getPaymentMethod() {
            return paymentMethod;
        }

        public void setPaymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}

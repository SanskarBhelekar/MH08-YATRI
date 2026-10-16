
package mh08yatri.booking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;

    public BookingController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
        
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody Map<String, Object> request) {

        try {
            Booking booking = new Booking();

            // Customer details
            Object customerName = request.get("customerName");

            if (customerName == null
                    || customerName.toString().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Customer name is required"));
            }

            booking.setCustomerName(customerName.toString().trim());

            // Ride details
            booking.setPickup(
                    request.get("pickup").toString());

            booking.setDestination(
                    request.get("destination").toString());

            booking.setVehicle(
                    request.get("vehicle").toString());
                    Object vehicleType = request.get("vehicleType");

if (vehicleType == null) {
    vehicleType = request.get("vehicle");
}

booking.setVehicleType(vehicleType.toString());

            booking.setBookingDate(
                    LocalDate.parse(
                            request.get("bookingDate").toString()));

            booking.setBookingTime(
                    LocalTime.parse(
                            request.get("bookingTime").toString()));

            // Optional fare
            Object fare = request.get("estimatedFare");

            if (fare != null) {
                booking.setEstimatedFare(
                        new BigDecimal(fare.toString()));
            }

            // Optional booking type
            Object type = request.get("bookingType");

            if (type != null) {
                booking.setBookingType(type.toString());
            }

            // Save booking to MySQL
            Booking savedBooking = bookingRepository.save(booking);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedBooking);

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Invalid booking details",
                            "details", e.getMessage() == null
                                    ? "Unknown error"
                                    : e.getMessage()
                    ));
        }
    }
@GetMapping("/{id}")
public ResponseEntity<?> getBookingById(@PathVariable Long id) {
    return bookingRepository.findById(id)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Booking not found")));
}
}

package com.orangy.user;

import com.orangy.auth.AuthenticatedUser;
import com.orangy.common.dto.ApiResponse;
import com.orangy.common.exception.ResourceNotFoundException;
import com.orangy.user.dto.AddressRequest;
import com.orangy.user.dto.AddressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User address management")
public class UserController {

    private final AddressRepository addressRepository;

    @GetMapping
    @Operation(summary = "List current user's addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> listAddresses(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<AddressResponse> addresses = addressRepository.findByUserId(principal.getUserId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping
    @Operation(summary = "Add a new address")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody AddressRequest request) {
        Address address = Address.builder()
                .userId(principal.getUserId())
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isDefault(request.isDefault())
                .build();

        // If this is set as default, unset other defaults
        if (request.isDefault()) {
            unsetOtherDefaults(principal.getUserId());
        }

        address = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(address)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an address")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @Valid @RequestBody AddressRequest request) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUserId().equals(principal.getUserId()))
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setDefault(request.isDefault());

        if (request.isDefault()) {
            unsetOtherDefaults(principal.getUserId());
        }

        address = addressRepository.save(address);
        return ResponseEntity.ok(ApiResponse.success(toResponse(address)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUserId().equals(principal.getUserId()))
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        addressRepository.delete(address);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private void unsetOtherDefaults(UUID userId) {
        List<Address> defaults = addressRepository.findByUserIdAndIsDefaultTrue(userId);
        defaults.forEach(a -> a.setDefault(false));
        addressRepository.saveAll(defaults);
    }

    private AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .line1(address.getLine1())
                .line2(address.getLine2())
                .city(address.getCity())
                .state(address.getState())
                .pincode(address.getPincode())
                .isDefault(address.isDefault())
                .build();
    }
}

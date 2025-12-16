# Design Document

## Overview

The Petrol Pump Stock & Cash Reconciliation System is designed as a mobile-first application with a robust backend API. The system follows a layered architecture pattern with clear separation between presentation, business logic, and data persistence layers. The design emphasizes data integrity, real-time monitoring, and role-based access control to ensure accurate fuel inventory tracking and cash reconciliation.

## Architecture

The system employs a client-server architecture with the following components:

### Mobile Application Layer
- React Native or Flutter for cross-platform mobile development
- Offline-first data storage using SQLite for local caching
- Real-time synchronization with backend when connectivity is available
- Role-based UI rendering based on user permissions

### API Gateway Layer
- RESTful API endpoints for all system operations
- JWT-based authentication and authorization
- Request validation and rate limiting
- API versioning for backward compatibility

### Business Logic Layer
- Service classes for core business operations (stock management, reconciliation, reporting)
- Validation engines for data integrity checks
- Alert and notification services
- Report generation services

### Data Persistence Layer
- Primary database (PostgreSQL) for transactional data
- Read replicas for reporting and analytics
- Audit log storage for compliance and tracking
- File storage for generated reports and exports

## Components and Interfaces

### User Management Component
- Authentication service with role-based access control
- User profile management
- Session management with timeout handling
- Password security and recovery mechanisms

### Inventory Management Component
- Dispenser configuration and management
- Opening/closing stock entry validation
- Fuel calculation engine
- Stock mismatch detection algorithms

### Cash Reconciliation Component
- Cash entry and validation services
- Expected vs actual cash comparison
- Discrepancy calculation and threshold checking
- Payment method tracking (cash, digital)

### Reporting Component
- Real-time dashboard data aggregation
- Historical report generation
- Export services (Excel, PDF)
- Performance analytics and trend analysis

### Notification Component
- Alert generation for discrepancies
- Real-time notifications to managers and owners
- Escalation workflows for unresolved issues
- Communication channels (push notifications, email)

## Data Models

### User Entity
```
User {
  id: UUID
  username: String
  mobile_number: String
  role: Enum (OWNER, MANAGER, OPERATOR)
  petrol_pump_id: UUID
  created_at: Timestamp
  updated_at: Timestamp
  is_active: Boolean
}
```

### Petrol Pump Entity
```
PetrolPump {
  id: UUID
  name: String
  location: String
  owner_id: UUID
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Dispenser Entity
```
Dispenser {
  id: UUID
  dispenser_code: String
  fuel_type: Enum (PETROL, DIESEL, CNG)
  petrol_pump_id: UUID
  current_price: Decimal
  is_active: Boolean
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Shift Entity
```
Shift {
  id: UUID
  dispenser_id: UUID
  operator_id: UUID
  shift_type: Enum (MORNING, EVENING, NIGHT)
  start_time: Timestamp
  end_time: Timestamp
  opening_reading: Decimal
  closing_reading: Decimal
  fuel_sold: Decimal (calculated)
  expected_cash: Decimal (calculated)
  actual_cash: Decimal
  digital_payments: Decimal
  cash_used: Decimal
  cash_usage_reason: String
  status: Enum (ACTIVE, COMPLETED, FLAGGED)
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Audit Log Entity
```
AuditLog {
  id: UUID
  user_id: UUID
  action: String
  entity_type: String
  entity_id: UUID
  old_values: JSON
  new_values: JSON
  timestamp: Timestamp
  ip_address: String
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all identified properties, several can be consolidated to eliminate redundancy:

- Properties 2.2 and 2.5 both test calculations and can be combined into a comprehensive calculation property
- Properties 3.1, 3.2, and 3.3 all test discrepancy detection and can be unified
- Properties 4.1, 4.2, and 4.5 test report content and can be consolidated
- Properties 6.1 and 6.2 both test audit logging and can be combined

### Core Properties

**Property 1: Authentication and Authorization Consistency**
*For any* valid user credentials and system function, authentication should succeed and grant exactly the permissions associated with the user's role
**Validates: Requirements 1.1, 5.1**

**Property 2: Workflow Order Enforcement**
*For any* shift operation, the system should reject all operations except opening stock entry when no opening stock exists for the active shift
**Validates: Requirements 1.2**

**Property 3: Stock Reading Validation**
*For any* stock reading entry, the system should accept only numeric values that are greater than or equal to the previous reading in the sequence
**Validates: Requirements 1.3, 2.1**

**Property 4: Data Immutability After Submission**
*For any* submitted data entry, all subsequent modification attempts should be rejected while preserving the original data
**Validates: Requirements 1.4**

**Property 5: Business Rule Enforcement**
*For any* business constraint (duplicate shifts, cash usage requirements), the system should consistently enforce the rule across all relevant operations
**Validates: Requirements 1.5, 2.4**

**Property 6: Mathematical Calculation Consistency**
*For any* fuel readings and prices, the calculations (fuel sold = closing - opening, expected cash = fuel sold × price) should produce mathematically correct results
**Validates: Requirements 2.2, 2.5**

**Property 7: Data Storage Separation**
*For any* cash transaction entry, cash amounts and digital payment amounts should be stored in distinct fields and retrievable separately
**Validates: Requirements 2.3**

**Property 8: Comprehensive Discrepancy Detection**
*For any* completed shift data, the system should detect and flag all discrepancies (cash, stock, timing) that exceed predefined thresholds
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 9: Manager Analysis Completeness**
*For any* flagged entry reviewed by a manager, the system should provide all required discrepancy analysis components (variance amounts, percentages, historical comparisons)
**Validates: Requirements 3.5**

**Property 10: Report Content Completeness**
*For any* generated report, the output should contain all required data elements (fuel sales, cash reconciliation, profitability metrics) for the specified scope and time period
**Validates: Requirements 4.1, 4.2, 4.5**

**Property 11: Date Range Filtering Accuracy**
*For any* historical data request with specified date range, the returned data should include only records within the specified boundaries
**Validates: Requirements 4.3**

**Property 12: Export Format Generation**
*For any* report export request, the system should generate both Excel and PDF formats with identical data content
**Validates: Requirements 4.4**

**Property 13: Configuration Validation**
*For any* system configuration change (dispensers, timings, prices), the system should validate the change and apply it without affecting existing active operations
**Validates: Requirements 5.2, 5.3, 5.4**

**Property 14: Access Revocation Immediacy**
*For any* user access revocation, all active sessions for that user should be terminated immediately and future access attempts should be denied
**Validates: Requirements 5.5**

**Property 15: Comprehensive Audit Trail**
*For any* system operation, the audit log should capture the complete change details including user identification, timestamp, and data modifications
**Validates: Requirements 6.1, 6.2**

**Property 16: Data Integrity Maintenance**
*For any* system operation, all data constraints and validation rules should be enforced to maintain consistency
**Validates: Requirements 6.3**

**Property 17: Cross-Interface Data Consistency**
*For any* data element, the same information should appear identically across all user interfaces and reports where it is displayed
**Validates: Requirements 6.4**

## Error Handling

### Input Validation Errors
- Invalid meter readings (non-numeric, negative, decreasing values)
- Missing required fields in data entry forms
- Invalid date ranges or time periods
- Malformed authentication credentials

### Business Logic Errors
- Duplicate shift creation attempts
- Operations attempted without proper prerequisites
- Threshold violations and discrepancy detection
- Role-based access violations

### System Errors
- Database connectivity issues with offline fallback
- Network synchronization failures
- Report generation timeouts
- File export errors

### Error Response Strategy
- Graceful degradation with offline mode capabilities
- Clear error messages with actionable guidance
- Automatic retry mechanisms for transient failures
- Escalation procedures for critical system errors

## Testing Strategy

### Dual Testing Approach

The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Testing:**
- Specific examples demonstrating correct behavior
- Edge cases and boundary conditions
- Integration points between components
- Error handling scenarios

**Property-Based Testing:**
- Universal properties verified across all valid inputs
- Mathematical calculations and business rule enforcement
- Data integrity and consistency checks
- Role-based access control validation

### Property-Based Testing Framework

The system will use **fast-check** (for JavaScript/TypeScript) as the property-based testing library. Each property-based test will:
- Run a minimum of 100 iterations to ensure statistical confidence
- Include explicit comments referencing the design document property
- Use the format: `**Feature: petrol-pump-reconciliation, Property {number}: {property_text}**`
- Generate realistic test data that respects business constraints

### Test Data Generation Strategy

Smart generators will be implemented to:
- Generate valid fuel readings that respect sequential ordering
- Create realistic cash amounts and payment combinations
- Produce valid user credentials and role assignments
- Generate time-based data that respects shift scheduling rules

### Testing Requirements

- Each correctness property must be implemented by a single property-based test
- Property-based tests will be configured to run 100+ iterations
- Unit tests will complement property tests by covering specific examples
- All tests must validate real functionality without mocking core business logic
- Test failures will be investigated and resolved before considering implementation complete
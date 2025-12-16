# Requirements Document

## Introduction

The Petrol Pump Stock & Cash Reconciliation System is a mobile application designed to digitize and streamline fuel inventory tracking and cash reconciliation processes at petrol stations. The system enables real-time monitoring of fuel dispensers, shift-based stock management, and transparent cash handling across multiple user roles including owners, managers, and dispenser operators.

## Glossary

- **Petrol_Pump_System**: The complete mobile application for fuel inventory and cash management
- **Dispenser**: A fuel dispensing unit with unique identification that serves specific fuel types
- **Shift**: A defined time period (morning, evening, night) during which fuel operations are tracked
- **Opening_Stock**: The meter reading recorded at the beginning of a shift
- **Closing_Stock**: The meter reading recorded at the end of a shift
- **Fuel_Sold**: The calculated difference between closing and opening stock readings
- **Cash_Reconciliation**: The process of matching expected cash from fuel sales with actual cash collected
- **Stock_Mismatch**: A discrepancy between expected and actual fuel or cash amounts beyond allowed thresholds

## Requirements

### Requirement 1

**User Story:** As a dispenser operator, I want to securely log into the system and record opening stock readings, so that I can begin tracking fuel inventory for my assigned shift.

#### Acceptance Criteria

1. WHEN a dispenser operator enters valid credentials, THE Petrol_Pump_System SHALL authenticate the user and grant role-based access
2. WHEN a shift begins, THE Petrol_Pump_System SHALL require opening stock entry before allowing any other operations
3. WHEN opening stock is entered, THE Petrol_Pump_System SHALL validate that the meter reading is numeric and greater than the previous closing reading
4. WHEN opening stock is submitted, THE Petrol_Pump_System SHALL prevent any modifications to the submitted data
5. WHEN opening stock entry is attempted for an already active shift, THE Petrol_Pump_System SHALL reject the duplicate entry

### Requirement 2

**User Story:** As a dispenser operator, I want to record closing stock and cash information at shift end, so that I can complete the reconciliation process and maintain accurate records.

#### Acceptance Criteria

1. WHEN closing stock is entered, THE Petrol_Pump_System SHALL validate that the reading is greater than or equal to the opening reading
2. WHEN closing stock is submitted, THE Petrol_Pump_System SHALL automatically calculate fuel sold as the difference between closing and opening readings
3. WHEN cash information is entered, THE Petrol_Pump_System SHALL record total cash collected and digital payments separately
4. WHEN cash usage is reported, THE Petrol_Pump_System SHALL require both amount and reason for usage
5. WHEN shift data is complete, THE Petrol_Pump_System SHALL calculate expected cash based on fuel sold and current fuel prices

### Requirement 3

**User Story:** As a manager, I want to monitor shift operations and identify discrepancies in real-time, so that I can ensure operational integrity and address issues promptly.

#### Acceptance Criteria

1. WHEN fuel sold is calculated, THE Petrol_Pump_System SHALL compare expected cash with actual cash collected
2. WHEN cash discrepancy exceeds predefined thresholds, THE Petrol_Pump_System SHALL generate an alert notification
3. WHEN stock mismatch is detected, THE Petrol_Pump_System SHALL flag the entry for manager review
4. WHEN shift entries are missing beyond scheduled time, THE Petrol_Pump_System SHALL notify the assigned manager
5. WHEN manager reviews flagged entries, THE Petrol_Pump_System SHALL provide detailed discrepancy analysis

### Requirement 4

**User Story:** As a petrol pump owner, I want to access comprehensive reports and analytics, so that I can monitor business performance and identify revenue optimization opportunities.

#### Acceptance Criteria

1. WHEN owner requests reports, THE Petrol_Pump_System SHALL provide data across all pumps and time periods
2. WHEN generating reports, THE Petrol_Pump_System SHALL include shift-wise fuel sales, cash reconciliation, and profitability metrics
3. WHEN historical data is requested, THE Petrol_Pump_System SHALL retrieve and display data for specified date ranges
4. WHEN export functionality is used, THE Petrol_Pump_System SHALL generate reports in Excel and PDF formats
5. WHEN viewing dashboards, THE Petrol_Pump_System SHALL display real-time performance indicators and trend analysis

### Requirement 5

**User Story:** As a system administrator, I want to manage user roles and system configuration, so that I can maintain proper access control and operational parameters.

#### Acceptance Criteria

1. WHEN user roles are assigned, THE Petrol_Pump_System SHALL enforce role-based permissions for all system functions
2. WHEN dispenser configuration is updated, THE Petrol_Pump_System SHALL validate fuel type and unique identifier assignments
3. WHEN shift timings are modified, THE Petrol_Pump_System SHALL update operational schedules without affecting active shifts
4. WHEN fuel prices are changed, THE Petrol_Pump_System SHALL apply new prices to subsequent transactions while preserving historical data
5. WHEN user access is revoked, THE Petrol_Pump_System SHALL immediately terminate active sessions and prevent future access

### Requirement 6

**User Story:** As a system user, I want reliable data persistence and audit capabilities, so that I can trust the system maintains accurate records and provides accountability.

#### Acceptance Criteria

1. WHEN any data entry is submitted, THE Petrol_Pump_System SHALL store the information with timestamp and user identification
2. WHEN data modifications are attempted, THE Petrol_Pump_System SHALL create audit log entries recording the change details
3. WHEN system operations are performed, THE Petrol_Pump_System SHALL maintain data integrity through validation and constraint enforcement
4. WHEN data is retrieved, THE Petrol_Pump_System SHALL ensure consistency across all user interfaces and reports
5. WHEN backup operations occur, THE Petrol_Pump_System SHALL preserve all transactional and master data without loss
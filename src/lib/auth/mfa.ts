import crypto from 'crypto';
import { authenticator } from 'otplib';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/security/encryption';

export interface MFAMethod {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes';
  isEnabled: boolean;
  isPrimary: boolean;
  secret?: string; // encrypted
  phoneNumber?: string; // encrypted
  email?: string; // encrypted
  backupCodes?: string[]; // encrypted
  lastUsed?: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface MFASetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  setupToken: string;
}

export interface MFAVerificationResult {
  success: boolean;
  methodUsed?: string;
  remainingAttempts?: number;
  lockoutUntil?: Date;
  requiresNewMethod?: boolean;
}

export class MFAService {
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes
  private readonly backupCodeCount = 10;

  /**
   * Setup TOTP MFA for a user
   */
  async setupTOTP(_userId: string, appName: string = 'Riscura'): Promise<MFASetupResult> {
    const user = await this.getUserForMFA(userId);

    // Generate secret and QR code
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrCode = await this.generateQRCode(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Create setup token for verification
    const setupToken = this.generateSetupToken(userId, secret);

    // Store encrypted in temporary setup
    await this.storeTempMFASetup(userId, {
      type: 'totp',
      secret: await encrypt(secret),
      backupCodes: await Promise.all(backupCodes.map((code) => encrypt(code))),
      setupToken,
    });

    return {
      secret,
      qrCode,
      backupCodes,
      setupToken,
    };
  }

  /**
   * Setup SMS MFA for a user
   */
  async setupSMS(_userId: string, phoneNumber: string): Promise<MFASetupResult> {
    const user = await this.getUserForMFA(userId);

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Send SMS
    await this.sendSMS(phoneNumber, `Your Riscura verification code: ${verificationCode}`);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Create setup token
    const setupToken = this.generateSetupToken(userId, verificationCode);

    // Store encrypted in temporary setup
    await this.storeTempMFASetup(userId, {
      type: 'sms',
      phoneNumber: await encrypt(phoneNumber),
      verificationCode: await encrypt(verificationCode),
      backupCodes: await Promise.all(backupCodes.map((code) => encrypt(code))),
      setupToken,
    });

    return {
      secret: '', // Not applicable for SMS
      qrCode: '', // Not applicable for SMS
      backupCodes,
      setupToken,
    };
  }

  /**
   * Verify MFA setup and enable the method
   */
  async verifySetup(
    _userId: string,
    setupToken: string,
    verificationCode: string
  ): Promise<boolean> {
    const tempSetup = await this.getTempMFASetup(userId, setupToken);
    if (!tempSetup) {
      throw new Error('Invalid or expired setup token');
    }

    let isValid = false;

    if (tempSetup.type === 'totp') {
      const secret = await decrypt(tempSetup.secret);
      isValid = authenticator.verify({
        token: verificationCode,
        secret,
      });
    } else if (tempSetup.type === 'sms') {
      const storedCode = await decrypt(tempSetup.verificationCode);
      isValid = verificationCode === storedCode;
    }

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Create the MFA method
    const mfaMethod: MFAMethod = {
      id: crypto.randomUUID(),
      userId,
      type: tempSetup.type,
      isEnabled: true,
      isPrimary: await this.isFirstMFAMethod(userId),
      secret: tempSetup.secret,
      phoneNumber: tempSetup.phoneNumber,
      backupCodes: tempSetup.backupCodes,
      createdAt: new Date(),
      metadata: {},
    };

    // Store the MFA method
    await this.storeMFAMethod(mfaMethod);

    // Clean up temporary setup
    await this.cleanupTempMFASetup(userId, setupToken);

    return true;
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFA(
    _userId: string,
    code: string,
    methodId?: string
  ): Promise<MFAVerificationResult> {
    const attempts = await this.getRecentAttempts(userId);

    // Check if user is locked out
    if (attempts.length >= this.maxAttempts) {
      const lastAttempt = attempts[0];
      const lockoutUntil = new Date(lastAttempt.timestamp.getTime() + this.lockoutDuration);

      if (new Date() < lockoutUntil) {
        return {
          success: false,
          remainingAttempts: 0,
          lockoutUntil,
        };
      }
    }

    const methods = await this.getUserMFAMethods(userId);
    const enabledMethods = methods.filter((m) => m.isEnabled);

    if (enabledMethods.length === 0) {
      throw new Error('No MFA methods enabled for user');
    }

    // Try specific method if provided, otherwise try all
    const methodsToTry = methodId
      ? enabledMethods.filter((m) => m.id === methodId)
      : enabledMethods;

    for (const method of methodsToTry) {
      const _result = await this.verifyMethodCode(method, code);
      if (result) {
        // Update last used
        await this.updateMethodLastUsed(method.id);

        // Clear failed attempts
        await this.clearFailedAttempts(userId);

        return {
          success: true,
          methodUsed: method.type,
        };
      }
    }

    // Record failed attempt
    await this.recordFailedAttempt(userId);

    const remainingAttempts = Math.max(0, this.maxAttempts - (attempts.length + 1));

    return {
      success: false,
      remainingAttempts,
      lockoutUntil:
        remainingAttempts === 0 ? new Date(Date.now() + this.lockoutDuration) : undefined,
    };
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(_userId: string, methodId: string): Promise<string[]> {
    const method = await this.getMFAMethod(methodId);
    if (!method || method.userId !== userId) {
      throw new Error('MFA method not found');
    }

    const backupCodes = this.generateBackupCodes();
    const encryptedCodes = await Promise.all(backupCodes.map((code) => encrypt(code)));

    // Update the method
    await this.updateMFAMethod(methodId, {
      backupCodes: encryptedCodes,
    });

    return backupCodes;
  }

  /**
   * Disable MFA method
   */
  async disableMFAMethod(
    _userId: string,
    methodId: string,
    verificationCode: string
  ): Promise<boolean> {
    // Verify current MFA before disabling
    const verification = await this.verifyMFA(userId, verificationCode, methodId);
    if (!verification.success) {
      throw new Error('Invalid verification code');
    }

    const method = await this.getMFAMethod(methodId);
    if (!method || method.userId !== userId) {
      throw new Error('MFA method not found');
    }

    // Don't allow disabling the last MFA method
    const userMethods = await this.getUserMFAMethods(userId);
    const enabledMethods = userMethods.filter((m) => m.isEnabled && m.id !== methodId);

    if (enabledMethods.length === 0) {
      throw new Error('Cannot disable the last MFA method');
    }

    // Disable the method
    await this.updateMFAMethod(methodId, { isEnabled: false });

    return true;
  }

  /**
   * Get user's MFA status and methods
   */
  async getUserMFAStatus(_userId: string): Promise<{
    isEnabled: boolean;
    methods: Array<{
      id: string;
      type: string;
      isEnabled: boolean;
      isPrimary: boolean;
      lastUsed?: Date;
      maskedIdentifier?: string;
    }>;
    hasBackupCodes: boolean;
  }> {
    const methods = await this.getUserMFAMethods(userId);
    const enabledMethods = methods.filter((m) => m.isEnabled);

    return {
      isEnabled: enabledMethods.length > 0,
      methods: methods.map((method) => ({
        id: method.id,
        type: method.type,
        isEnabled: method.isEnabled,
        isPrimary: method.isPrimary,
        lastUsed: method.lastUsed,
        maskedIdentifier: this.getMaskedIdentifier(method),
      })),
      hasBackupCodes: methods.some((m) => m.backupCodes && m.backupCodes.length > 0),
    };
  }

  // Private helper methods
  private async getUserForMFA(_userId: string) {
    // TODO: Implement with actual database query
    return { id: userId, email: 'user@example.com' };
  }

  private async generateQRCode(otpauthUrl: string): Promise<string> {
    const qrcode = await import('qrcode');
    return await qrcode.toDataURL(otpauthUrl);
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.backupCodeCount; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSetupToken(_userId: string, secret: string): string {
    const payload = {
      userId,
      secretHash: crypto.createHash('sha256').update(secret).digest('hex'),
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Implement SMS sending (Twilio, AWS SNS, etc.)
    // console.log(`SMS to ${phoneNumber}: ${message}`)
  }

  private async storeTempMFASetup(_userId: string, setup: any): Promise<void> {
    // TODO: Implement with Redis or database
    // console.log(`Storing temp MFA setup for user ${userId}`)
  }

  private async getTempMFASetup(_userId: string, setupToken: string): Promise<any> {
    // TODO: Implement with Redis or database
    return null;
  }

  private async cleanupTempMFASetup(_userId: string, setupToken: string): Promise<void> {
    // TODO: Implement cleanup
  }

  private async isFirstMFAMethod(_userId: string): Promise<boolean> {
    const methods = await this.getUserMFAMethods(userId);
    return methods.length === 0;
  }

  private async storeMFAMethod(method: MFAMethod): Promise<void> {
    // TODO: Implement with database
  }

  private async getUserMFAMethods(_userId: string): Promise<MFAMethod[]> {
    // TODO: Implement with database
    return [];
  }

  private async getMFAMethod(methodId: string): Promise<MFAMethod | null> {
    // TODO: Implement with database
    return null;
  }

  private async updateMFAMethod(methodId: string, updates: Partial<MFAMethod>): Promise<void> {
    // TODO: Implement with database
  }

  private async verifyMethodCode(method: MFAMethod, code: string): Promise<boolean> {
    if (method.type === 'totp' && method.secret) {
      const secret = await decrypt(method.secret);
      return authenticator.verify({
        token: code,
        secret,
      });
    }

    if (method.type === 'backup_codes' && method.backupCodes) {
      for (const encryptedCode of method.backupCodes) {
        const backupCode = await decrypt(encryptedCode);
        if (backupCode === code.toUpperCase()) {
          // Remove used backup code
          const updatedCodes = method.backupCodes.filter((c) => c !== encryptedCode);
          await this.updateMFAMethod(method.id, { backupCodes: updatedCodes });
          return true;
        }
      }
    }

    return false;
  }

  private async updateMethodLastUsed(methodId: string): Promise<void> {
    await this.updateMFAMethod(methodId, { lastUsed: new Date() });
  }

  private async getRecentAttempts(_userId: string): Promise<Array<{ timestamp: Date }>> {
    // TODO: Implement with database - get attempts from last 15 minutes
    return [];
  }

  private async recordFailedAttempt(_userId: string): Promise<void> {
    // TODO: Implement with database
  }

  private async clearFailedAttempts(_userId: string): Promise<void> {
    // TODO: Implement with database
  }

  private getMaskedIdentifier(method: MFAMethod): string {
    if (method.type === 'sms' && method.phoneNumber) {
      // Mask phone number: +1234567890 -> +123***7890
      const phone = method.phoneNumber;
      return phone.slice(0, 4) + '***' + phone.slice(-4);
    }
    if (method.type === 'totp') {
      return 'Authenticator App';
    }
    return method.type;
  }
}

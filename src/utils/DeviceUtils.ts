import { Platform } from 'react-native';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  version: string;
}

export class DeviceUtils {
  private static webDeviceId: string | null = null;

  static async getDeviceInfo(): Promise<DeviceInfo> {
    if (Platform.OS === 'web') {
      return this.getWebDeviceInfo();
    } else {
      // For mobile platforms, use react-native-device-info
      const DeviceInfo = require('react-native-device-info');
      return {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        platform: await DeviceInfo.getSystemName(),
        version: await DeviceInfo.getSystemVersion()
      };
    }
  }

  private static getWebDeviceInfo(): DeviceInfo {
    // Generate or retrieve a persistent device ID for web
    if (!this.webDeviceId) {
      this.webDeviceId = localStorage.getItem('tracko_device_id');
      if (!this.webDeviceId) {
        this.webDeviceId = this.generateWebDeviceId();
        localStorage.setItem('tracko_device_id', this.webDeviceId);
      }
    }

    return {
      deviceId: this.webDeviceId,
      deviceName: this.getWebDeviceName(),
      platform: this.getWebPlatform(),
      version: this.getWebVersion()
    };
  }

  private static generateWebDeviceId(): string {
    // Generate a unique ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = canvas.toDataURL();
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    
    return btoa(`${fingerprint}-${timestamp}-${random}`).substring(0, 32);
  }

  private static getWebDeviceName(): string {
    const userAgent = navigator.userAgent;
    
    // Try to extract meaningful device/browser info
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    
    return 'Web Browser';
  }

  private static getWebPlatform(): string {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    if (platform.includes('Win')) return 'Windows';
    if (platform.includes('Mac')) return 'macOS';
    if (platform.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    
    return 'Web';
  }

  private static getWebVersion(): string {
    const userAgent = navigator.userAgent;
    
    // Extract browser version
    const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (chromeMatch) return chromeMatch[1];
    
    const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (firefoxMatch) return firefoxMatch[1];
    
    const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
    if (safariMatch) return safariMatch[1];
    
    return '1.0';
  }
}
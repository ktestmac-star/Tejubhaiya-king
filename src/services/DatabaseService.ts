import { Platform } from 'react-native';

// Mock SQLite for web, use real SQLite for mobile
let SQLite: any;

if (Platform.OS !== 'web') {
  SQLite = require('react-native-sqlite-storage');
  SQLite.DEBUG(true);
  SQLite.enablePromise(true);
} else {
  // Web fallback using localStorage
  SQLite = {
    openDatabase: () => ({
      executeSql: (query: string, params: any[] = []) => {
        return Promise.resolve([{ rows: { length: 0, item: () => null } }]);
      },
      close: () => Promise.resolve(),
    }),
  };
}

export interface DatabaseResult {
  rows: {
    length: number;
    item: (index: number) => any;
  };
}

export class DatabaseService {
  private static instance: DatabaseService;
  private database: any = null;
  private readonly DATABASE_NAME = 'tracko.db';
  private readonly DATABASE_VERSION = '1.0';
  private readonly DATABASE_DISPLAY_NAME = 'Tracko Database';
  private readonly DATABASE_SIZE = 200000;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Initialize web storage
        this.initializeWebStorage();
        return;
      }

      this.database = await SQLite.openDatabase({
        name: this.DATABASE_NAME,
        version: this.DATABASE_VERSION,
        displayName: this.DATABASE_DISPLAY_NAME,
        size: this.DATABASE_SIZE,
      });

      await this.createTables();
      await this.seedInitialData();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private initializeWebStorage(): void {
    // Initialize web storage with default data if not exists
    if (!localStorage.getItem('tracko_users')) {
      const defaultUsers = [
        {
          id: '1',
          username: 'owner',
          email: 'owner@tracko.com',
          password: 'password123', // In real app, this would be hashed
          role: 'OWNER',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@tracko.com',
          password: 'password123',
          role: 'MANAGER',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          username: 'operator1',
          email: 'operator1@tracko.com',
          password: 'password123',
          role: 'OPERATOR',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('tracko_users', JSON.stringify(defaultUsers));
    }
  }

  private async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      );
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL,
        deviceId TEXT,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `;

    await this.executeSql(createUsersTable);
    await this.executeSql(createSessionsTable);
  }

  private async seedInitialData(): Promise<void> {
    // Check if users already exist
    const result = await this.executeSql('SELECT COUNT(*) as count FROM users');
    const count = result[0].rows.item(0).count;

    if (count === 0) {
      // Insert default users
      const defaultUsers = [
        {
          id: '1',
          username: 'owner',
          email: 'owner@tracko.com',
          password: 'password123', // In real app, this would be hashed
          role: 'OWNER',
          isActive: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@tracko.com',
          password: 'password123',
          role: 'MANAGER',
          isActive: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          username: 'operator1',
          email: 'operator1@tracko.com',
          password: 'password123',
          role: 'OPERATOR',
          isActive: 1,
          createdAt: new Date().toISOString(),
        },
      ];

      for (const user of defaultUsers) {
        await this.executeSql(
          'INSERT INTO users (id, username, email, password, role, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.username, user.email, user.password, user.role, user.isActive, user.createdAt]
        );
      }

      console.log('Default users created');
    }
  }

  public async executeSql(query: string, params: any[] = []): Promise<DatabaseResult[]> {
    if (Platform.OS === 'web') {
      return this.executeWebQuery(query, params);
    }

    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.database.executeSql(
        query,
        params,
        (result: DatabaseResult[]) => resolve(result),
        (error: any) => reject(error)
      );
    });
  }

  private executeWebQuery(query: string, params: any[] = []): Promise<DatabaseResult[]> {
    // Simple web storage implementation
    return new Promise((resolve) => {
      if (query.includes('SELECT') && query.includes('users')) {
        const users = JSON.parse(localStorage.getItem('tracko_users') || '[]');
        
        if (query.includes('WHERE')) {
          // Handle simple WHERE clauses
          const user = users.find((u: any) => 
            params.some(param => u.username === param || u.email === param)
          );
          
          resolve([{
            rows: {
              length: user ? 1 : 0,
              item: (index: number) => user || null
            }
          }]);
        } else {
          resolve([{
            rows: {
              length: users.length,
              item: (index: number) => users[index]
            }
          }]);
        }
      } else {
        resolve([{ rows: { length: 0, item: () => null } }]);
      }
    });
  }

  public async close(): Promise<void> {
    if (this.database && Platform.OS !== 'web') {
      await this.database.close();
      this.database = null;
    }
  }
}
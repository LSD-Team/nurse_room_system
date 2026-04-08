/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

//  ----- 📖 Library 📖 -----
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

//  ----- 🔐 constant 🔐 -----
import { databaseName } from '@/src/database/constant/database';

//  ----- ➕ Interfaces ➕ -----
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@Injectable()
export class DatabaseService {
  //  💪 constructor function
  constructor(private readonly configService: ConfigService) {}

  private readonly databaseName = databaseName();
  private readonly logger = new Logger(DatabaseService.name);
  private pools: Map<string, sql.ConnectionPool> = new Map();

  public getDatabaseName() {
    return this.databaseName; // เรียกฟังก์ชันเพื่อดึงค่าจาก .env
  }

  //  Get Database Connection By PresetName
  private databaseConfiguration = (database: string): sql.config => {
    // กำหนด default config สำหรับฐานข้อมูลทั่วไป
    const defaultConfig: sql.config = {
      server: this.configService.get<string>('DATABASE_SERVER') || 'localhost',
      user: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      port: parseInt(
        this.configService.get<string>('DATABASE_PORT') || '1433',
        10,
      ),
      database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName:
          this.configService.get<string>('INSTANCE_NAME') || undefined,
      },
      pool: {
        max: 10, // จำนวน connections สูงสุดในแต่ละ pool
        min: 0, // จำนวน connections ต่ำสุดที่จะคงไว้
        idleTimeoutMillis: 30000, // เวลาที่จะปิด connection ที่ไม่ได้ใช้งาน (30 วินาที)
      },
    };

    // กำหนด config พิเศษสำหรับ zkbiotime
    const authConfig: sql.config = {
      server:
        this.configService.get<string>('DATABASE_AUTH_SERVER') || 'localhost',
      user: this.configService.get<string>('DATABASE_AUTH_USER'),
      password: this.configService.get<string>('DATABASE_AUTH_PASSWORD'),
      port: parseInt(
        this.configService.get<string>('DATABASE_AUTH_PORT') || '1433',
        10,
      ),
      database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName:
          this.configService.get<string>('INSTANCE_AUTH_NAME') || undefined,
      },
      pool: {
        max: 10, // จำนวน connections สูงสุดในแต่ละ pool
        min: 0, // จำนวน connections ต่ำสุดที่จะคงไว้
        idleTimeoutMillis: 30000, // เวลาที่จะปิด connection ที่ไม่ได้ใช้งาน (30 วินาที)
      },
    };

    const config =
      database === 'LSD_SYSTEM_CENTER' ? authConfig : defaultConfig;
    // เลือก config ตามชื่อฐานข้อมูล
    return config;
  };

  private logActivePools(): void {
    const poolStatus = Array.from(this.pools.entries()).map(([db, pool]) => ({
      database: db,
      connected: pool?.connected || false,
    }));
    this.logger.log('Active connection pools:', poolStatus);
  }

  private async getConnection(database: string): Promise<sql.ConnectionPool> {
    try {
      let pool = this.pools.get(database);

      // ตรวจสอบว่า pool มีอยู่และยังเชื่อมต่ออยู่
      if (pool && pool.connected) {
        return pool;
      }

      // ถ้ามี pool เก่าที่ไม่ได้เชื่อมต่อ ให้ลบออกและปิดการเชื่อมต่อก่อน
      if (pool) {
        try {
          await pool.close();
        } catch (closeError: any) {
          this.logger.warn(
            `Error closing stale connection: ${closeError.message}`,
          );
        }
        this.pools.delete(database);
      }
      // สร้าง connection pool ใหม่
      const config: sql.config = this.databaseConfiguration(database);

      pool = await new sql.ConnectionPool(config).connect();
      pool.on('error', (err) => {
        this.logger.error(`Pool error for database ${database}:`, err);
        this.pools.delete(database); // ลบ pool ที่มีปัญหาออกจาก Map
      });

      this.pools.set(database, pool);
      // this.logActivePools();

      return pool;
    } catch (error) {
      this.logger.error(`Database connection error for ${database}:`, error);
      throw new InternalServerErrorException('Failed to connect to database');
    }
  }

  // public async closeConnections(): Promise<void> {
  //   try {
  //     const closePromises: Promise<void>[] = [];
  //     for (const [database, pool] of this.pools.entries()) {
  //       closePromises.push(
  //         pool
  //           .close()
  //           .then(() =>
  //             this.logger.log(
  //               `Closed connection pool for database: ${database}`,
  //             ),
  //           )
  //           .catch((err) =>
  //             this.logger.error(`Error closing pool for ${database}:`, err),
  //           ),
  //       );
  //     }

  //     await Promise.all(closePromises);
  //     this.pools.clear();
  //     this.logActivePools();
  //   } catch (error) {
  //     this.logger.error('Error closing connections:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to close database connections',
  //     );
  //   }
  // }

  public async execute<T>(
    database: string,
    sqlquery: string,
    values?: T[],
  ): Promise<sql.IResult<any>> {
    let pool: sql.ConnectionPool;
    try {
      pool = await this.getConnection(database);
      const request = pool.request();
      values?.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      const replacedQuery = this.replaceParams(sqlquery, values || []);
      this.logger.verbose(`Execute: ${replacedQuery}`);
      const result = await request.query(sqlquery);
      await this.TxLog(replacedQuery);
      pool.close(); // ปิดการเชื่อมต่อหลังใช้งาน
      // this.closeConnections(); // ปิดการเชื่อมต่อทั้งหมดหลังการ Execute
      return result;
    } catch (error: any) {
      this.logger.error(`SQL Execute Error for database ${database}:`, error);

      // ตรวจสอบว่าเป็นปัญหาเกี่ยวกับการเชื่อมต่อหรือไม่
      if (
        error.code === 'ESOCKET' ||
        error.code === 'ETIMEOUT' ||
        error.code === 'ECONNRESET'
      ) {
        this.logger.warn(
          `Connection issue detected, removing pool for ${database}`,
        );
        this.pools.delete(database);
      }

      if (error instanceof sql.RequestError) {
        throw new BadRequestException('SQL Error: ' + error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  private async TxLog(sqlquery: string): Promise<void> {
    try {
      const pool = await this.getConnection(this.databaseName);
      const { UserID } = global.jwtPayload as JwtPayloadData;
      const request = pool.request();
      const sqlLog = `
        INSERT INTO [dbo].[log_execute] ([SQL_Query], [Execute_By], [Execute_At])
        VALUES (@param0, @param1, GETDATE());
      `;
      request.input('param0', sqlquery.trim());
      request.input('param1', UserID || 'Unknown');
      await request.query(sqlLog);
      pool.close(); // ปิดการเชื่อมต่อหลังใช้งาน
      // this.closeConnections(); // ปิดการเชื่อมต่อทั้งหมดหลังการ Execute
    } catch (error) {
      this.logger.error('Failed to log query', error);
      throw new InternalServerErrorException('Logging Error');
    }
  }

  public async query<T>(
    database: string,
    sql: string,
    values?: (string | number)[],
  ): Promise<T> {
    let pool: sql.ConnectionPool;
    try {
      pool = await this.getConnection(database);
      const request = pool.request();
      values?.forEach((value, index) => {
        request.input(`param${index}`, value);
      });
      // this.logger.debug(`Query: ${this.replaceParams(sql, values || [])}`);
      const result = await request.query(sql);
      pool.close(); // ปิดการเชื่อมต่อหลังใช้งาน
      // this.closeConnections(); // ปิดการเชื่อมต่อทั้งหมดหลังการ Execute
      return result.recordset as T;
    } catch (error: any) {
      this.logger.error(`Query Error for database ${database}:`, error);

      // ตรวจสอบว่าเป็นปัญหาเกี่ยวกับการเชื่อมต่อหรือไม่
      if (
        error.code === 'ESOCKET' ||
        error.code === 'ETIMEOUT' ||
        error.code === 'ECONNRESET'
      ) {
        this.logger.warn(
          `Connection issue detected, removing pool for ${database}`,
        );
        this.pools.delete(database);
      }

      throw new InternalServerErrorException(error.message);
    }
  }

  public async executeStoredProcedure<T>(
    database: string,
    procedureName: string,
    params?: { [key: string]: any },
  ): Promise<T[]> {
    let pool: sql.ConnectionPool;
    try {
      pool = await this.getConnection(database);
      const request = pool.request();
      if (params) {
        Object.keys(params).forEach((key) => {
          request.input(key, params[key]);
        });
      }
      const result = await request.execute(procedureName);
      pool.close(); // ปิดการเชื่อมต่อหลังใช้งาน
      // this.closeConnections(); // ปิดการเชื่อมต่อทั้งหมดหลังการ Execute
      return result.recordset as T[];
    } catch (error: any) {
      this.logger.error(
        `Stored Procedure Error for database ${database}:`,
        error,
      );

      // ตรวจสอบว่าเป็นปัญหาเกี่ยวกับการเชื่อมต่อหรือไม่
      if (
        error.code === 'ESOCKET' ||
        error.code === 'ETIMEOUT' ||
        error.code === 'ECONNRESET'
      ) {
        this.logger.warn(
          `Connection issue detected, removing pool for ${database}`,
        );
        this.pools.delete(database);
      }

      throw new InternalServerErrorException('Procedure Execution Failed');
    }
  }

  public replaceParams<T>(query: string, values: T[]): string {
    return query.replace(/@param\d+/g, (match) => {
      const paramIndex = parseInt(match.replace('@param', ''), 10);
      return paramIndex < values.length ? `'${values[paramIndex]}'` : match;
    });
  }
}

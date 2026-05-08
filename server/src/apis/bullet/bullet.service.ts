import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type { IBulletCounts } from '@/shared/bullet.interface';

@Injectable()
export class BulletService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  // ─── GET: Bullet Counts from view_bullet_list ───
  async getBulletCounts(): Promise<IBulletCounts> {
    const query = `
      SELECT
        [list],
        [count]
      FROM view_bullet_list
    `;

    try {
      const results = await this.databaseService.query(
        query,
        this.DATABASE_NAME,
      );

      // Transform results array into object keyed by 'list'
      const countsMap: Record<string, number> = {};
      results.forEach((row: { list: string; count: number }) => {
        countsMap[row.list] = row.count;
      });

      const bulletCounts: IBulletCounts = {
        po: countsMap['po'] || 0,
        rec: countsMap['rec'] || 0,
        borrow: countsMap['borrow'] || 0,
        apv: countsMap['apv'] || 0,
        all: countsMap['all'] || 0,
      };

      return bulletCounts;
    } catch (error) {
      console.error('[BulletService] Error fetching bullet counts:', error);
      return {
        po: 0,
        rec: 0,
        borrow: 0,
        apv: 0,
        all: 0,
      };
    }
  }
}

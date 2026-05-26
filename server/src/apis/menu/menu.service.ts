import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

export interface IMenuRow {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  sort_order: number;
  icon: string | null;
  route: string | null;
  color: string | null;
  is_active: boolean;
}

@Injectable()
export class MenuService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  async findAll() {
    const { UserID } = global.jwtPayload as JwtPayloadData;

    const query: string = `
      WITH role_access_menus AS (
        SELECT DISTINCT
          m.id,
          m.code,
          m.name,
          m.parent_id,
          m.sort_order,
          m.icon,
          m.route,
          m.color,
          m.is_active
        FROM dbo.role_emp re
        INNER JOIN dbo.role_menus rm ON rm.role_id = re.role_id
        INNER JOIN dbo.menus m ON m.id = rm.menu_id
        WHERE CAST(re.employee_id AS NVARCHAR(50)) = @employeeId
          AND m.is_active = 1
      ),
      menu_tree AS (
        SELECT
          id,
          code,
          name,
          parent_id,
          sort_order,
          icon,
          route,
          color,
          is_active
        FROM role_access_menus
        UNION ALL
        SELECT
          p.id,
          p.code,
          p.name,
          p.parent_id,
          p.sort_order,
          p.icon,
          p.route,
          p.color,
          p.is_active
        FROM dbo.menus p
        INNER JOIN menu_tree mt ON mt.parent_id = p.id
        WHERE p.is_active = 1
      )
      SELECT DISTINCT
        id,
        code,
        name,
        parent_id,
        sort_order,
        icon,
        route,
        color,
        is_active
      FROM menu_tree
      ORDER BY sort_order, id
      OPTION (MAXRECURSION 100);
    `;

    const menus = await this.databaseService.query<IMenuRow>(
      this.DATABASE_NAME,
      query,
      { employeeId: String(UserID) },
    );

    return menus;
  }
}

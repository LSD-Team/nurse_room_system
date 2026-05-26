```md
# Role–Menu Access Control (Visibility Only)

## Objective
This system controls **menu visibility only**.

There is:
- NO permission/action concept (no VIEW / CREATE / EDIT / APPROVE)
- NO direct employee-to-menu assignment
- NO complex authorization logic

The system answers only one question:

> **Which menus can an employee see?**

---

## Core Access Flow

```

Employee → Role → Menu

````

- An employee can have multiple roles
- A role can be assigned to multiple employees
- A role can see multiple menus
- Menu visibility is derived strictly from roles

---

## Tables Overview

### 1. `roles`
Defines logical job roles in the organization.

Examples:
- NURSE
- NURSE_GL
- HR
- HR_GL
- HR_MANAGER
- HR_DEPART

**Rules**
- `roles.code` is stable and used by the system
- Roles represent job responsibility, not individuals
- Roles can be enabled/disabled using `is_active`

---

### 2. `employees`
Represents individual employees.

Key field:
- `employee_code` (e.g. N0123, H0456)

**Rules**
- Employee identity is independent of roles
- An employee may change roles without changing employee_code

---

### 3. `role_emp`
Mapping table between employees and roles.

**Schema**
```text
employee_id + role_id (composite primary key)
````

**Meaning**

> Employee X belongs to Role Y

**Notes**

* One employee can have multiple roles
* This table defines role membership only

***

### 4. `menus`

Defines all system menus (UI-level).

Examples:

* Medical Treatment
* Stock Management
* Purchase Approval
* Reports

**Rules**

* Menus can be enabled/disabled using `is_active`
* Menu structure is independent of roles and employees

***

### 5. `role_menus`

Mapping table between roles and menus.

**Schema**

```text
role_id + menu_id (composite primary key)
```

**Meaning**

> Role X can see Menu Y

This table is the **single source of truth** for menu visibility.

***

## How Menu Visibility Is Resolved

1. Identify employee using `employee_code`
2. Resolve employee → roles using `role_emp`
3. Resolve roles → menus using `role_menus`
4. Return all distinct active menus

***

## Example Scenario

### Employee

```
employee_code = N0123
```

### Role Assignment

```
N0123 → NURSE
N0123 → NURSE_GL
```

### Role–Menu Mapping

```
NURSE     → Treatment, Stock
NURSE_GL  → Treatment, Stock, Report
```

### Final Visible Menus

```
Treatment
Stock
Report
```

***

## Reference SQL Query

```sql
SELECT DISTINCT m.*
FROM employees e
JOIN role_emp re ON e.id = re.employee_id
JOIN role_menus rm ON re.role_id = rm.role_id
JOIN menus m ON rm.menu_id = m.id
WHERE e.employee_code = @employeeCode
  AND e.is_active = 1
  AND m.is_active = 1
ORDER BY m.sort_order;
```

***

## Design Constraints (Important)

✅ No permission/action tables  
✅ No employee\_menu direct mapping  
✅ No implicit role inference  
✅ Roles are the only grouping mechanism  
✅ This design is intentionally minimal  
✅ Optimized for small user base

***

## Instructions for AI / CLI Tools

* Do NOT introduce permission concepts
* Do NOT infer CREATE / EDIT / APPROVE logic
* Do NOT add employee\_menu or override tables
* Use roles as the only access abstraction
* Assume menu visibility only (read-only navigation control)

This design is final and intentional.

```

---

## ✅ ทำไมไฟล์นี้เหมาะกับ AI CLI
- เขียนแบบ **Declarative + Constraint-based**
- บอกชัดว่า **อะไรห้ามทำ**
- ไม่มี ambiguity
- AI จะไม่ “คิดเผื่อเกินโจทย์”

---

## ✅ แนะนำการใช้งานจริง
- ใช้ไฟล์นี้เป็น:
  - `ARCHITECTURE.md`
  - Context สำหรับ AI CLI
  - Reference ให้ Dev / BA
- แนบไฟล์นี้พร้อม prompt เช่น:
```

Follow role\_menu.md strictly.
Do not introduce additional authorization concepts.

```

---


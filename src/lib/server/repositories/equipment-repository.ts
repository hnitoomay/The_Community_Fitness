import "server-only";

import { requireAdminUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import type {
  AdminEquipmentItem,
  EquipmentAvailability,
  EquipmentCategory,
  EquipmentUnit,
} from "@/types/admin-data";

export interface EquipmentListFilters {
  search?: string;
  category?: EquipmentCategory | "All";
  availability?: EquipmentAvailability | "All";
  planSelectable?: "All" | "Yes" | "No";
}

export interface EquipmentWriteInput {
  id?: number;
  sourceNumber?: number | null;
  name: string;
  imageUrl?: string | null;
  category: EquipmentCategory;
  quantity: number;
  unit: EquipmentUnit;
  planSelectable: boolean;
  availability: EquipmentAvailability;
  notes: string;
}

interface EquipmentRow {
  id: number;
  source_number: number | null;
  name: string;
  image_url: string | null;
  category: EquipmentCategory;
  quantity: number;
  unit: EquipmentUnit;
  plan_selectable: boolean;
  availability: EquipmentAvailability;
  notes: string | null;
  updated_at: Date;
}

function mapEquipmentRow(row: EquipmentRow): AdminEquipmentItem {
  return {
    id: String(row.id),
    sourceNo: row.source_number ?? undefined,
    equipmentName: row.name,
    imageUrl: row.image_url ?? "",
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    planSelectable: row.plan_selectable,
    availability: row.availability,
    notes: row.notes ?? "",
    updatedDate: row.updated_at.toISOString().slice(0, 10),
  };
}

export async function listEquipment(
  filters: EquipmentListFilters,
): Promise<AdminEquipmentItem[]> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.search) {
    params.push(`%${filters.search.trim()}%`);
    where.push(`name ILIKE $${params.length}`);
  }

  if (filters.category && filters.category !== "All") {
    params.push(filters.category);
    where.push(`category = $${params.length}`);
  }

  if (filters.availability && filters.availability !== "All") {
    params.push(filters.availability);
    where.push(`availability = $${params.length}`);
  }

  if (filters.planSelectable && filters.planSelectable !== "All") {
    params.push(filters.planSelectable === "Yes");
    where.push(`plan_selectable = $${params.length}`);
  }

  const result = await query<EquipmentRow>(
    `
      SELECT
        id,
        source_number,
        name,
        image_url,
        category,
        quantity,
        unit,
        plan_selectable,
        availability,
        notes,
        updated_at
      FROM gym_equipment
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY name ASC, id ASC
    `,
    params,
  );

  return result.rows.map(mapEquipmentRow);
}

export async function getEquipmentById(id: number) {
  const result = await query<EquipmentRow>(
    `
      SELECT
        id,
        source_number,
        name,
        image_url,
        category,
        quantity,
        unit,
        plan_selectable,
        availability,
        notes,
        updated_at
      FROM gym_equipment
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ? mapEquipmentRow(result.rows[0]) : null;
}

export async function findEquipmentSourceNumberConflict(
  sourceNumber: number,
  excludeId?: number,
) {
  const params: unknown[] = [sourceNumber];
  let text = `
    SELECT id
    FROM gym_equipment
    WHERE source_number = $1
  `;

  if (excludeId !== undefined) {
    params.push(excludeId);
    text += ` AND id <> $2`;
  }

  text += " LIMIT 1";

  const result = await query<{ id: number }>(text, params);
  return result.rows[0] ?? null;
}

export async function saveEquipment(input: EquipmentWriteInput) {
  await requireAdminUser();

  const params = [
    input.sourceNumber ?? null,
    input.name,
    input.imageUrl ?? null,
    input.category,
    input.quantity,
    input.unit,
    input.planSelectable,
    input.availability,
    input.notes || null,
  ];

  if (input.id !== undefined) {
    const result = await query<EquipmentRow>(
      `
        UPDATE gym_equipment
        SET
          source_number = $1,
          name = $2,
          image_url = $3,
          category = $4,
          quantity = $5,
          unit = $6,
          plan_selectable = $7,
          availability = $8,
          notes = $9
        WHERE id = $10
        RETURNING
          id,
          source_number,
          name,
          image_url,
          category,
          quantity,
          unit,
          plan_selectable,
          availability,
          notes,
          updated_at
      `,
      [...params, input.id],
    );

    return result.rows[0] ? mapEquipmentRow(result.rows[0]) : null;
  }

  const result = await query<EquipmentRow>(
    `
      INSERT INTO gym_equipment (
        source_number,
        name,
        image_url,
        category,
        quantity,
        unit,
        plan_selectable,
        availability,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        source_number,
        name,
        image_url,
        category,
        quantity,
        unit,
        plan_selectable,
        availability,
        notes,
        updated_at
    `,
    params,
  );

  return mapEquipmentRow(result.rows[0]);
}

export async function updateEquipmentAvailability(
  id: number,
  availability: EquipmentAvailability,
) {
  await requireAdminUser();

  const result = await query<EquipmentRow>(
    `
      UPDATE gym_equipment
      SET availability = $2
      WHERE id = $1
      RETURNING
        id,
        source_number,
        name,
        image_url,
        category,
        quantity,
        unit,
        plan_selectable,
        availability,
        notes,
        updated_at
    `,
    [id, availability],
  );

  return result.rows[0] ? mapEquipmentRow(result.rows[0]) : null;
}

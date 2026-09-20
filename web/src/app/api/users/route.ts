import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = parseEqParam(searchParams.get('email'));
    const id = parseEqParam(searchParams.get('id'));
    const citizenUid = parseEqParam(searchParams.get('citizen_uid'));

    let sql = 'SELECT id, email, phone, role, is_verified, citizen_uid, household_uid, created_at, updated_at FROM users WHERE 1=1';
    const params: unknown[] = [];

    if (email) {
      params.push(email.trim().toLowerCase());
      sql += ` AND LOWER(email) = $${params.length}`;
    }
    if (id) {
      params.push(Number(id));
      sql += ` AND id = $${params.length}`;
    }
    if (citizenUid) {
      params.push(citizenUid);
      sql += ` AND citizen_uid = $${params.length}`;
    }

    sql += ' ORDER BY id DESC LIMIT 50';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to query users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phone = body.phone || `+9199${Date.now().toString().slice(-8)}`;
    const role = body.role || 'citizen';
    const isVerified = Boolean(body.is_verified);
    const citizenUid = body.citizen_uid || `CIT-${Date.now().toString().slice(-6)}`;
    const hashedPassword = body.hashed_password || '';

    const sql = `
      INSERT INTO users (email, phone, role, is_verified, citizen_uid, hashed_password)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE 
        SET is_verified = EXCLUDED.is_verified, updated_at = NOW()
      RETURNING id, email, phone, role, is_verified, citizen_uid, household_uid, created_at, updated_at
    `;
    const res = await query(sql, [email, phone, role, isVerified, citizenUid, hashedPassword]);

    return NextResponse.json(res.rows, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/users
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = parseEqParam(searchParams.get('email'));
    const id = parseEqParam(searchParams.get('id'));
    const body = await request.json();

    if (!email && !id) {
      return NextResponse.json({ error: 'Missing filter param (email or id)' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (body.is_verified !== undefined) {
      params.push(Boolean(body.is_verified));
      setClauses.push(`is_verified = $${params.length}`);
    }
    if (body.phone) {
      params.push(body.phone);
      setClauses.push(`phone = $${params.length}`);
    }

    setClauses.push(`updated_at = NOW()`);

    let whereClause = '';
    if (email) {
      params.push(email.trim().toLowerCase());
      whereClause = `LOWER(email) = $${params.length}`;
    } else if (id) {
      params.push(Number(id));
      whereClause = `id = $${params.length}`;
    }

    const sql = `
      UPDATE users 
      SET ${setClauses.join(', ')}
      WHERE ${whereClause}
      RETURNING id, email, phone, role, is_verified, citizen_uid, updated_at
    `;
    const res = await query(sql, params);

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

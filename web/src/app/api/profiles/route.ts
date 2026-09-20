import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseEqParam(searchParams.get('user_id'));

    let sql = 'SELECT * FROM profiles WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      params.push(Number(userId));
      sql += ` AND user_id = $${params.length}`;
    }

    sql += ' ORDER BY id DESC LIMIT 50';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to query profiles:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/profiles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body.user_id);
    const fullName = body.full_name || 'Citizen';
    const dob = body.date_of_birth || '1995-01-01';
    const gender = body.gender || 'prefer_not_to_say';
    const state = body.state || 'Maharashtra';
    const district = body.district || 'Mumbai';
    const annualIncome = Number(body.annual_income) || 120000;
    const occupation = body.occupation || 'general';

    const sql = `
      INSERT INTO profiles (user_id, full_name, date_of_birth, gender, state, district, annual_income, occupation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE 
        SET full_name = EXCLUDED.full_name,
            state = EXCLUDED.state,
            district = EXCLUDED.district,
            annual_income = EXCLUDED.annual_income,
            updated_at = NOW()
      RETURNING *
    `;
    const res = await query(sql, [userId, fullName, dob, gender, state, district, annualIncome, occupation]);

    return NextResponse.json(res.rows, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/profiles
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseEqParam(searchParams.get('user_id'));
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    const allowedFields = [
      'full_name',
      'date_of_birth',
      'gender',
      'state',
      'district',
      'annual_income',
      'occupation',
      'marital_status',
      'caste_category',
      'is_differently_abled',
      'has_land',
      'residence_area',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        params.push(body[field]);
        setClauses.push(`${field} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(Number(userId));

    const sql = `
      UPDATE profiles 
      SET ${setClauses.join(', ')}
      WHERE user_id = $${params.length}
      RETURNING *
    `;
    const res = await query(sql, params);

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

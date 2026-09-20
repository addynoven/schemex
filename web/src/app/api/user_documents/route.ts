import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/user_documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseEqParam(searchParams.get('user_id'));

    let sql = 'SELECT * FROM user_documents WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      params.push(Number(userId));
      sql += ` AND user_id = $${params.length}`;
    }

    sql += ' ORDER BY uploaded_at DESC LIMIT 100';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to query user_documents:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user_documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body.user_id) || 1;
    const householdMemberId = body.household_member_id ? Number(body.household_member_id) : null;
    const citizenUid = body.citizen_uid || `CIT-${userId}`;
    const documentType = body.document_type || 'generic';
    const documentNumberMasked = body.document_number_masked || null;
    const fileKey = body.file_key;
    const fileName = body.file_name || 'document';
    const fileSizeBytes = Number(body.file_size_bytes) || 1024 * 100;
    const mimeType = body.mime_type || 'application/pdf';
    const isVerified = body.is_verified !== undefined ? Boolean(body.is_verified) : true;

    const sql = `
      INSERT INTO user_documents (
        user_id, household_member_id, citizen_uid, document_type,
        document_number_masked, file_key, file_name, file_size_bytes,
        mime_type, is_verified, verified_at, uploaded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const res = await query(sql, [
      userId,
      householdMemberId,
      citizenUid,
      documentType,
      documentNumberMasked,
      fileKey,
      fileName,
      fileSizeBytes,
      mimeType,
      isVerified,
    ]);

    return NextResponse.json(res.rows, { status: 201 });
  } catch (error: any) {
    console.error('Failed to insert user_document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/user_documents
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseEqParam(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
    }

    const res = await query('DELETE FROM user_documents WHERE id = $1 RETURNING id', [Number(id)]);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to delete user_document:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

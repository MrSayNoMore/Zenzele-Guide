import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const province = searchParams.get("province");
    const aps = searchParams.get("aps");

    let query = `SELECT * FROM bursaries WHERE is_active = true`;
    const params = [];

    if (category && category !== "All") {
      params.push(`%${category}%`);
      query += ` AND (name ILIKE $${params.length} OR provider ILIKE $${params.length} OR ARRAY_TO_STRING(fields_of_study, ',') ILIKE $${params.length})`;
    }

    if (province && province !== "Nationwide") {
      params.push(province);
      query += ` AND province = $${params.length}`;
    }

    if (aps) {
      params.push(parseInt(aps));
      query += ` AND min_aps <= $${params.length}`;
    }

    query += ` ORDER BY closing_date ASC`;

    const bursaries = await sql(query, params);
    return Response.json(bursaries);
  } catch (error) {
    console.error("Error fetching bursaries:", error);
    return Response.json(
      { error: "Failed to fetch bursaries" },
      { status: 500 },
    );
  }
}

import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const institutions =
      await sql`SELECT * FROM institutions ORDER BY name ASC`;
    return Response.json(institutions);
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return Response.json(
      { error: "Failed to fetch institutions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      short_name,
      type,
      province,
      city,
      website,
      description,
      nsfas_eligible,
    } = body;

    const result = await sql`
      INSERT INTO institutions (name, short_name, type, province, city, website, description, nsfas_eligible)
      VALUES (${name}, ${short_name}, ${type}, ${province}, ${city}, ${website}, ${description}, ${nsfas_eligible || false})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating institution:", error);
    return Response.json(
      { error: "Failed to create institution" },
      { status: 500 },
    );
  }
}

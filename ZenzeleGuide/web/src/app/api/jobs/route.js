import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const province = searchParams.get("province");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const id = searchParams.get("id");

    // Increment views if ID is provided
    if (id) {
      await sql`UPDATE jobs SET views = views + 1 WHERE id = ${id}`;
    }

    let query = `SELECT * FROM jobs WHERE is_active = true`;
    const params = [];

    if (type && type !== "All") {
      params.push(type.toLowerCase());
      query += ` AND type = $${params.length}`;
    }

    if (province && province !== "Nationwide") {
      params.push(province);
      query += ` AND province = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR company ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (featured === "true") {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY is_featured DESC, created_at DESC`;

    const jobs = await sql(query, params);
    return Response.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return Response.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      company,
      type,
      province,
      location,
      stipend,
      description,
      requirements,
      closing_date,
      application_url,
      is_featured,
    } = body;

    if (!title || !company) {
      return Response.json(
        { error: "Title and company are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO jobs (title, company, type, province, location, stipend, description, requirements, closing_date, application_url, is_featured)
      VALUES (${title}, ${company}, ${type}, ${province}, ${location}, ${stipend}, ${description}, ${requirements}, ${closing_date}, ${application_url}, ${is_featured || false})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating job:", error);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }
}

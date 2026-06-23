import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    if (slug) {
      const posts =
        await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND is_published = true LIMIT 1`;
      return Response.json(posts[0] || null);
    }

    let query = `SELECT * FROM blog_posts WHERE is_published = true`;
    const params = [];

    if (category && category !== "All") {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY published_at DESC`;

    const posts = await sql(query, params);
    return Response.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return Response.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 },
    );
  }
}

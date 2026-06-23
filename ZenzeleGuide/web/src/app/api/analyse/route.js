import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      profile_id,
      aps_score,
      interests = [],
      province,
      funding,
      institution_type,
    } = await request.json();

    // 1. Fetch all courses with institution info
    const courses = await sql`
      SELECT c.*, i.name as institution_name, i.type as institution_type, i.province as institution_province, i.short_name
      FROM courses c
      JOIN institutions i ON c.institution_id = i.id
      WHERE c.aps_minimum <= ${aps_score}
    `;

    // 2. Score matches
    const scoredRecommendations = courses.map((course) => {
      let score = 40; // Base points for APS pass

      // Interest match (up to 30pts)
      const interestMatches = interests.filter(
        (interest) =>
          course.name.toLowerCase().includes(interest.toLowerCase()) ||
          course.faculty.toLowerCase().includes(interest.toLowerCase()),
      );
      score += Math.min(30, interestMatches.length * 15);

      // Province match (15pts)
      if (course.institution_province === province) {
        score += 15;
      }

      // Institution type match (15pts)
      if (course.institution_type === institution_type) {
        score += 15;
      }

      return {
        profile_id,
        institution_id: course.institution_id,
        course_id: course.id,
        match_score: score,
        reason: `Based on your APS of ${aps_score} and interest in ${course.faculty}.`,
        course_name: course.name,
        institution_name: course.institution_name,
        short_name: course.short_name,
        aps_minimum: course.aps_minimum,
      };
    });

    // 3. Sort by score descending and take top 5
    const topRecommendations = scoredRecommendations
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    // 4. Insert into recommendations table (optional if profile_id exists)
    if (profile_id) {
      for (const rec of topRecommendations) {
        await sql`
          INSERT INTO recommendations (profile_id, institution_id, course_id, match_score, reason)
          VALUES (${profile_id}, ${rec.institution_id}, ${rec.course_id}, ${rec.match_score}, ${rec.reason})
        `;
      }
    }

    return Response.json(topRecommendations);
  } catch (error) {
    console.error("Error in analysis:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

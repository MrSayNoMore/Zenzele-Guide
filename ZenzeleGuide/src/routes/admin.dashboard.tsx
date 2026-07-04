import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, Wallet, School, TriangleAlert as AlertTriangle, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: universities },
        { count: courses },
        { count: bursaries },
        { count: tvetColleges },
        { count: tvetPrograms },
        { count: pendingDrafts },
      ] = await Promise.all([
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("bursaries").select("id", { count: "exact", head: true }),
        supabase.from("tvet_colleges").select("id", { count: "exact", head: true }),
        supabase.from("tvet_programs").select("id", { count: "exact", head: true }),
        supabase.from("draft_extractions").select("id", { count: "exact", head: true }).eq("state", "pending"),
      ]);

      return {
        universities: universities || 0,
        courses: courses || 0,
        bursaries: bursaries || 0,
        tvetColleges: tvetColleges || 0,
        tvetPrograms: tvetPrograms || 0,
        pendingDrafts: pendingDrafts || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Universities",
      value: stats?.universities || 0,
      description: "Published institutions",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/admin/universities",
    },
    {
      title: "Courses",
      value: stats?.courses || 0,
      description: "Published programmes",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/admin/courses",
    },
    {
      title: "Bursaries",
      value: stats?.bursaries || 0,
      description: "Funding opportunities",
      icon: Wallet,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/admin/bursaries",
    },
    {
      title: "TVET Colleges",
      value: stats?.tvetColleges || 0,
      description: "Technical colleges",
      icon: School,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/admin/tvet",
    },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your content database</p>
      </div>

      {/* Pending drafts warning */}
      {stats?.pendingDrafts && stats.pendingDrafts > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                {stats.pendingDrafts} draft{stats.pendingDrafts > 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-sm text-yellow-600">
                Review and approve pending extractions before publishing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <a key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href="/admin/universities"
              className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span>Add University</span>
            </a>
            <a
              href="/admin/courses"
              className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span>Add Course</span>
            </a>
            <a
              href="/admin/bursaries"
              className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border transition-colors"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span>Add Bursary</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

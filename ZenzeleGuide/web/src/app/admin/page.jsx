import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout-wrapper";
import {
  Lock,
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  School,
  BookOpen,
  Plus,
  Send,
  TrendingUp,
  Search,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/stat-card";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    type: "internship",
    province: "Gauteng",
    location: "",
    stipend: "",
    description: "",
    requirements: "",
    closing_date: "",
    application_url: "",
    is_featured: false,
  });

  const handleLogin = (e) => {
    e.preventDefault();
    // Simplified password check for demo - should use env var ideally
    if (password === "zenzele2026") {
      setIsAuthorized(true);
      fetchAdminData();
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) throw new Error("Failed to post");
      alert("Job posted successfully!");
      setNewJob({
        title: "",
        company: "",
        type: "internship",
        province: "Gauteng",
        location: "",
        stipend: "",
        description: "",
        requirements: "",
        closing_date: "",
        application_url: "",
        is_featured: false,
      });
      fetchAdminData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-32 px-4">
          <div className="bg-white rounded-3xl p-10 border-1.5 border-[#E8E7E3] shadow-xl text-center">
            <div className="w-16 h-16 bg-[#EFEFEB] rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#085041]">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black mb-2">Admin Portal</h1>
            <p className="text-[#555555] mb-8">
              Please enter the administrator password to continue.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#085041] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-black tracking-widest focus:ring-2 ring-[#1D9E75]"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm font-bold">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-[#085041] text-white py-4 rounded-xl font-black text-lg hover:bg-[#0c6b57] transition-all"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2">Admin Dashboard</h1>
            <p className="text-[#555555]">
              Welcome back. Here's what's happening today.
            </p>
          </div>
          <button className="bg-[#1D9E75] text-white px-6 py-3 rounded-xl font-black flex items-center gap-2">
            <Plus size={20} /> Post New Guide
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Live Jobs"
            value={jobs.length}
            icon={Briefcase}
            color="#1D9E75"
          />
          <StatCard
            label="Bursaries"
            value="150"
            icon={GraduationCap}
            color="#085041"
          />
          <StatCard
            label="Institutions"
            value="26"
            icon={School}
            color="#FAC775"
          />
          <StatCard
            label="Blog Posts"
            value="12"
            icon={BookOpen}
            color="#1D9E75"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Post Listing Form */}
          <div>
            <div className="bg-white rounded-3xl p-8 border-1.5 border-[#E8E7E3] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#E1F5EE] text-[#1D9E75] rounded-lg flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-[#085041]">
                  Post New Job
                </h2>
              </div>

              <form onSubmit={handlePostJob} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={newJob.title}
                      onChange={(e) =>
                        setNewJob({ ...newJob, title: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                      placeholder="e.g. IT Internship"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newJob.company}
                      onChange={(e) =>
                        setNewJob({ ...newJob, company: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Type
                    </label>
                    <select
                      value={newJob.type}
                      onChange={(e) =>
                        setNewJob({ ...newJob, type: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                    >
                      <option value="internship">Internship</option>
                      <option value="learnership">Learnership</option>
                      <option value="graduate">Graduate</option>
                      <option value="fulltime">Full-time</option>
                      <option value="bursary">Bursary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Province
                    </label>
                    <select
                      value={newJob.province}
                      onChange={(e) =>
                        setNewJob({ ...newJob, province: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                    >
                      {[
                        "Gauteng",
                        "Western Cape",
                        "KwaZulu-Natal",
                        "Eastern Cape",
                        "Free State",
                        "Limpopo",
                        "Mpumalanga",
                        "North West",
                        "Northern Cape",
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Location (City)
                    </label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) =>
                        setNewJob({ ...newJob, location: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Stipend
                    </label>
                    <input
                      type="text"
                      value={newJob.stipend}
                      onChange={(e) =>
                        setNewJob({ ...newJob, stipend: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                      placeholder="e.g. R6,500/month"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Closing Date
                    </label>
                    <input
                      type="date"
                      value={newJob.closing_date}
                      onChange={(e) =>
                        setNewJob({ ...newJob, closing_date: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Description
                    </label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) =>
                        setNewJob({ ...newJob, description: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041] h-32"
                    ></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-[#555555] mb-2">
                      Requirements (one per line)
                    </label>
                    <textarea
                      value={newJob.requirements}
                      onChange={(e) =>
                        setNewJob({ ...newJob, requirements: e.target.value })
                      }
                      className="w-full bg-[#EFEFEB] border-none rounded-xl p-4 font-semibold text-[#085041] h-32"
                    ></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newJob.is_featured}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            is_featured: e.target.checked,
                          })
                        }
                        className="w-6 h-6 rounded-lg text-[#1D9E75] focus:ring-[#1D9E75]"
                      />
                      <span className="text-sm font-bold text-[#085041]">
                        Featured Listing (R950)
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#085041] text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-[#0c6b57] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send size={24} />
                  )}
                  Post Listing
                </button>
              </form>
            </div>
          </div>

          {/* Recent Listings Table */}
          <div>
            <div className="bg-white rounded-3xl border-1.5 border-[#E8E7E3] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#EFEFEB] flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-widest text-[#085041]">
                  Recent Listings
                </h2>
                <div className="flex items-center gap-2 text-[#555555] bg-[#EFEFEB] px-4 py-2 rounded-xl">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EFEFEB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#555555]">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#555555]">
                        Views
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#555555]">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#555555]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEFEB]">
                    {jobs.slice(0, 10).map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-[#E1F5EE]/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#085041]">
                            {job.title}
                          </p>
                          <p className="text-xs text-[#555555]">
                            {job.company}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#085041]">
                          {job.views}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button className="p-2 text-[#555555] hover:text-[#1D9E75] transition-colors">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-[#555555] hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-[#085041] text-white flex justify-between items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                    Revenue This Month
                  </p>
                  <p className="text-2xl font-black text-[#FAC775]">R8,400</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <TrendingUp size={20} className="text-[#FAC775]" />
                  <span className="font-bold text-sm">+32%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

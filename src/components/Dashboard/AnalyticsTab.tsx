"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockData = {
  views: [
    { name: "Jan", views: 400, clicks: 240 },
    { name: "Feb", views: 300, clicks: 139 },
    { name: "Mar", views: 300, clicks: 980 },
    { name: "Apr", views: 200, clicks: 390 },
    { name: "May", views: 278, clicks: 108 },
    { name: "Jun", views: 189, clicks: 500 },
  ],
  conversions: [ { name: "Views", value: 400 }, { name: "Clicks", value: 300 }, { name: "Conversions", value: 100 } ],
  revenue: [
    { name: "Jan", revenue: 4000, subscribers: 240 },
    { name: "Feb", revenue: 3000, subscribers: 139 },
    { name: "Mar", revenue: 2000, subscribers: 980 },
    { name: "Apr", revenue: 2780, subscribers: 390 },
    { name: "May", revenue: 1890, subscribers: 108 },
    { name: "Jun", revenue: 2390, subscribers: 500 },
  ],
  usage: [
    { name: "Product A", uv: 400, pv: 2400 },
    { name: "Product B", uv: 300, pv: 1398 },
    { name: "Product C", uv: 200, pv: 9800 },
    { name: "Product D", uv: 278, pv: 3908 },
    { name: "Product E", uv: 189, pv: 4800 },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsTab = () => {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    // Fetch real data from /api/saas/analytics
    fetch('/api/saas/analytics')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to fetch analytics'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics & Metrics</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Embed Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.views}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.conversions || []} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label>
                  {(data.conversions || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                <Bar dataKey="subscribers" fill="#82ca9d" name="New Subscribers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.usage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pv" fill="#8884d8" name="Usage" />
                <LabelList dataKey="name" position="top" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">$12,345</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Subscribers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">1,234</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Churn Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">4.2%</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;
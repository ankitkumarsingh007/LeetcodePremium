// src/SummaryBar.js
import React from "react";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";

const SummaryBar = ({ data }) => {
  // Check if data is an array
  if (!Array.isArray(data)) {
    return <div>Data is not available or in the wrong format.</div>;
  }

  // Calculate counts
  const counts = {
    Easy: { total: 0, done: 0 },
    Medium: { total: 0, done: 0 },
    Hard: { total: 0, done: 0 },
  };

  data.forEach((question) => {
    if (counts[question.Difficulty]) {
      counts[question.Difficulty].total += 1;
      if (question.Done) {
        counts[question.Difficulty].done += 1;
      }
    }
  });

  // Prepare data for chart
  const chartData = Object.keys(counts).map((difficulty) => {
    const total = counts[difficulty].total;
    const done = counts[difficulty].done;
    return {
      name: difficulty,
      value: total,
      done: done,
      left: total - done,
    };
  });

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Summary</h2>
      <PieChart width={300} height={300}>
        <Tooltip
          content={({ payload }) => {
            if (!payload[0]) return null;
            const {
              name,
              value,
              payload: { done, left },
            } = payload[0];
            return (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "10px",
                  borderRadius: "5px",
                }}
              >
                <strong>{name}</strong>
                <br />
                Total: {value}
                <br />
                Done: {done}
                <br />
                Left: {left}
              </div>
            );
          }}
        />
        <Legend />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={75}
          fill="#8884d8"
          label={({ name }) => name}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
};

export default SummaryBar;

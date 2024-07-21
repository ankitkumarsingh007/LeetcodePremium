import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useFilters } from "react-table";
import axios from "axios";
import SummaryBar from "./components/SummaryBar"; // Import SummaryBar
import "./App.css";

const REACT_APP_API_URL = `https://leetcode-app-backend-production.up.railway.app`;

function App() {
  const [data, setData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]); // State for all questions
  const [checkboxStates, setCheckboxStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [pageSize, setPageSize] = useState(50); // Default page size
  const [pageIndex, setPageIndex] = useState(0); // Default page index
  const [totalPages, setTotalPages] = useState(0); // Total pages based on data

  // Fetch all questions for sorting and filtering
  const fetchAllQuestions = async () => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/questions`, {
        params: { page: 0, size: 10000 }, // Fetch a large number to get all questions
      });
      setAllQuestions(response.data.questions);
      setSummaryData(response.data.questions);
      setTotalPages(Math.ceil(response.data.total / pageSize)); // Calculate total pages
    } catch (error) {
      console.error("Error fetching all questions:", error);
    }
  };

  // Fetch paginated questions for display
  const fetchQuestions = async (page, size) => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/questions`, {
        params: { page, size },
      });
      setData(response.data.questions);
      const initialCheckboxStates = {};
      response.data.questions.forEach((item) => {
        initialCheckboxStates[item.ID] = item.Done || false;
      });
      setCheckboxStates(initialCheckboxStates);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuestions(); // Fetch all questions on component mount
  }, []);

  useEffect(() => {
    // Apply sorting and filtering on the full data
    let filteredData = [...allQuestions];

    // Apply difficulty filter
    if (difficultyFilter.length > 0) {
      filteredData = filteredData.filter((item) =>
        difficultyFilter.includes(item.Difficulty)
      );
    }

    // Sort by selected criteria
    const sortBy = "Frequency"; // Replace with actual sort criteria
    filteredData.sort((a, b) => b[sortBy] - a[sortBy]); // Example sort function

    // Paginate the sorted and filtered data
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    setData(filteredData.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredData.length / pageSize)); // Update total pages
  }, [allQuestions, difficultyFilter, pageIndex, pageSize]);

  useEffect(() => {
    fetchQuestions(pageIndex, pageSize); // Fetch paginated questions after sorting and filtering
  }, [pageIndex, pageSize]);

  const handleCheckboxChange = async (rowId, value) => {
    setCheckboxStates((prevStates) => ({
      ...prevStates,
      [rowId]: value,
    }));

    try {
      await axios.put(`${REACT_APP_API_URL}/questions/${rowId}`, {
        Done: value,
      });
      setData((prevData) =>
        prevData.map((item) =>
          item.ID === rowId ? { ...item, Done: value } : item
        )
      );
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: "Done",
        accessor: "Done",
        Cell: ({ row }) => (
          <input
            type="checkbox"
            checked={checkboxStates[row.original.ID] || false}
            onChange={(e) =>
              handleCheckboxChange(row.original.ID, e.target.checked)
            }
          />
        ),
      },
      { Header: "ID", accessor: "ID" },
      { Header: "Title", accessor: "Title" },
      { Header: "Acceptance", accessor: "Acceptance" },
      { Header: "Difficulty", accessor: "Difficulty" },
      { Header: "Frequency", accessor: "Frequency" },
      {
        Header: "Leetcode Question Link",
        accessor: "Leetcode Question Link",
        Cell: ({ value }) => (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ),
      },
    ],
    [checkboxStates]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { pageIndex: tablePageIndex, pageSize: tablePageSize },
    setFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex, pageSize },
      manualPagination: true,
      pageCount: totalPages,
    },
    useFilters,
    useSortBy,
    usePagination
  );

  const handleDifficultyFilterChange = (difficulty) => {
    const newFilter = [...difficultyFilter];
    const index = newFilter.indexOf(difficulty);
    if (index > -1) {
      newFilter.splice(index, 1);
    } else {
      newFilter.push(difficulty);
    }
    setDifficultyFilter(newFilter);

    if (newFilter.length === 0) {
      setFilter("Difficulty", undefined);
    } else {
      setFilter("Difficulty", newFilter);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchQuestions(pageIndex, newSize);
  };

  const handlePageChange = (page) => {
    setPageIndex(page);
    fetchQuestions(page, pageSize);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="App"
      style={{
        display: "flex",
        marginLeft: "20px",
        marginRight: "20px",
        backgroundColor: "#f0f8ff",
      }}
    >
      <div style={{ flex: 5, marginRight: "15px" }}>
        <h1>Leetcode Questions</h1>
        <table
          {...getTableProps()}
          className="table"
          style={{
            border: "1px solid black",
            width: "100%",
            backgroundColor: "#e6f7ff",
          }}
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    style={{
                      borderBottom: "3px solid red",
                      background: "#cce7ff",
                      color: "black",
                      fontWeight: "bold",
                    }}
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        padding: "10px",
                        border: "1px solid gray",
                        background: "#f0f8ff",
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <button
            onClick={() => handlePageChange(0)}
            disabled={pageIndex === 0}
          >
            {"<<"}
          </button>{" "}
          <button
            onClick={() => handlePageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            {"<"}
          </button>{" "}
          <button
            onClick={() => handlePageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            {">"}
          </button>{" "}
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            {">>"}
          </button>{" "}
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {totalPages}
            </strong>{" "}
          </span>
          <span>
            | Go to page:{" "}
            <input
              type="number"
              value={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                handlePageChange(page);
              }}
              style={{ width: "100px" }}
            />
          </span>{" "}
          <select value={pageSize} onChange={handlePageSizeChange}>
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: "15px" }}>
        <div style={{ marginBottom: "15px" }}>
          <h3>Filters</h3>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              onChange={() => handleDifficultyFilterChange("Easy")}
              checked={difficultyFilter.includes("Easy")}
            />
            Easy
          </label>
          <label>
            <input
              type="checkbox"
              onChange={() => handleDifficultyFilterChange("Medium")}
              checked={difficultyFilter.includes("Medium")}
            />
            Medium
          </label>
          <label>
            <input
              type="checkbox"
              onChange={() => handleDifficultyFilterChange("Hard")}
              checked={difficultyFilter.includes("Hard")}
            />
            Hard
          </label>
        </div>
        <SummaryBar data={summaryData} /> {/* Add SummaryBar component */}
      </div>
    </div>
  );
}

export default App;

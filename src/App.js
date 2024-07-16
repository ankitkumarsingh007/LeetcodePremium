// src/App.js

import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useFilters } from "react-table";
import Papa from "papaparse";
import { db } from "./firebase"; // Import the Firebase Firestore instance
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [checkboxStates, setCheckboxStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [difficultyFilter, setDifficultyFilter] = useState([]);

  // Fetch CSV data
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/google_alltime.csv");
        const csvText = await response.text();
        const parsedCSV = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        }).data;
        setData(parsedCSV);
        fetchCheckboxStates(parsedCSV); // Fetch checkbox states after setting data
      } catch (error) {
        console.error("Error fetching CSV data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();

    // Load cached states from localStorage
    const cachedStates = JSON.parse(
      localStorage.getItem("checkboxStates") || "{}"
    );
    setCheckboxStates(cachedStates);
  }, []);

  // Fetch Firestore checkbox states
  const fetchCheckboxStates = async (parsedCSV) => {
    try {
      const querySnapshot = await getDocs(collection(db, "questions"));
      const firestoreData = {};
      querySnapshot.forEach((doc) => {
        firestoreData[doc.id] = doc.data().Done || false;
      });

      const updatedCheckboxStates = {};
      parsedCSV.forEach((item) => {
        updatedCheckboxStates[item.ID] = firestoreData[item.ID] || false;
      });

      setCheckboxStates(updatedCheckboxStates);
    } catch (error) {
      console.error("Error fetching Firestore data: ", error);
    }
  };

  const handleCheckboxChange = (rowId, value) => {
    // Update local state immediately
    setCheckboxStates((prevStates) => {
      const newState = {
        ...prevStates,
        [rowId]: value,
      };
      // Save to localStorage
      localStorage.setItem("checkboxStates", JSON.stringify(newState));
      return newState;
    });

    // Add to pending updates
    setPendingUpdates((prevUpdates) => ({
      ...prevUpdates,
      [rowId]: value,
    }));
  };

  const updateFirestore = async (rowId, value) => {
    try {
      await setDoc(
        doc(db, "questions", rowId),
        { Done: value },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  useEffect(() => {
    // Function to flush pending updates to Firestore
    const flushPendingUpdates = async () => {
      for (const [key, value] of Object.entries(pendingUpdates)) {
        await updateFirestore(key, value);
      }
      setPendingUpdates({});
    };

    // Periodically flush updates
    const interval = setInterval(flushPendingUpdates, 5000); // every 5 seconds

    // Flush updates before window unloads
    const handleBeforeUnload = (event) => {
      flushPendingUpdates();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingUpdates]);

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
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    setFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 50 }, // Display 50 rows per page
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="App"
      style={{
        marginLeft: "20px",
        marginRight: "20px",
        backgroundColor: "#f0f8ff",
      }}
    >
      <h1>Leetcode Questions</h1>
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
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default App;

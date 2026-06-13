/** PRD §7.3 — sortable, paginated table with row actions */
export default function DataTable({
  columns,
  rows,
  idField,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onRowClick,
  selectedId,
  emptyMessage = "No records found.",
}) {
  function toggleSort(colKey) {
    if (!colKey || !onSort) return;
    if (sortKey === colKey) {
      onSort(colKey, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(colKey, "desc");
    }
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
                {col.sortable !== false && onSort ? (
                  <button type="button" className="th-sort" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[idField]}
              className={selectedId != null && String(selectedId) === String(row[idField]) ? "row-selected" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "")}</td>
              ))}
              {(onEdit || onDelete) && (
                <td className="td-actions">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

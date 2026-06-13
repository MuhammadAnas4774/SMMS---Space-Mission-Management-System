import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import EnhancedCrudPage from "../components/EnhancedCrudPage";
import { API_BASE } from "../config/api";
import { astronautsCrud } from "../config/entitySchemas";

/** PRD §5.1.2 — Astronaut list with computed FullName */
export default function AstronautsPage() {
  const [personMap, setPersonMap] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}/persons`, { params: { limit: 500, page: 1 } }).then((res) => {
      const m = {};
      for (const p of res.data.data || []) m[p.PersonID] = p;
      setPersonMap(m);
    });
  }, []);

  const config = useMemo(() => {
    const cols = [
      { key: "PersonID", label: "Person ID" },
      {
        key: "_fn",
        label: "Full name",
        sortable: false,
        render: (row) => {
          const p = personMap[row.PersonID];
          return p ? `${p.FirstName ?? ""} ${p.LastName ?? ""}`.trim() : "—";
        },
      },
      ...astronautsCrud.columns.slice(1),
    ];
    return { ...astronautsCrud, columns: cols };
  }, [personMap]);

  return <EnhancedCrudPage config={config} />;
}

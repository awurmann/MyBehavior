const MAP_URL = "./mapa_faltas_maimonides_base44_import.json";
const STORAGE_KEY = "maimonides_behavior_annotations_v2";

let faultMap = [];
let annotations = [];
let currentView = "dashboard";
let lastImportSummary = "";
let studentNotes = {};

const DEFAULT_CONSEQUENCE_SCALE = [
  { from: 0, label: "Sin consecuencias" },
  { from: 5, label: "Conversacion con profesor jefe y/o rabino de curso" },
  { from: 8, label: "Citacion a apoderado" },
  { from: 10, label: "Warning" },
  { from: 11, label: "Detencion 1" },
  { from: 15, label: "Detencion 2" },
  { from: 19, label: "Suspension interna" },
  { from: 23, label: "Suspension externa" },
  { from: 26, label: "Firma de carta de compromiso" },
  { from: 31, label: "Firma de precondicionalidad" },
  { from: 33, label: "Firma de condicionalidad" },
];
let consequenceScale = [...DEFAULT_CONSEQUENCE_SCALE];

const $ = (id) => document.getElementById(id);
const today = () => new Date();
const fmt = (value) => Number(value || 0).toFixed(1).replace(/\.0$/, "");

function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseDate(value) {
  if (value instanceof Date) return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`);
  const parts = raw.split(/[/-]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    const year = a > 1900 ? a : c < 100 ? 2000 + c : c;
    if (a > 1900) return new Date(year, b - 1, c);
    return new Date(year, b - 1, a);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function daysBetween(date, end = today()) {
  if (!date) return 0;
  return Math.max(0, Math.floor((end - date) / 86400000));
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

function referenceDate(source = annotations) {
  const latest = source.reduce((max, item) => (item.date > max ? item.date : max), new Date(0));
  return latest.getTime() ? endOfDay(latest) : endOfDay(today());
}

function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function lastFourWeeks(endDate) {
  const currentStart = startOfWeek(endDate);
  return [0, 1, 2, 3].map((offset) => {
    const start = addDays(currentStart, -7 * offset);
    const end = addDays(start, 6);
    return {
      start,
      end: endOfDay(end),
      label: `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}`,
    };
  });
}

function decayFactor(annotation, studentAnnotations, endDate = today()) {
  if (annotation.fault.PuntajeCongelado === "SI") return 1;
  const later = studentAnnotations
    .filter((item) => item.date > annotation.date)
    .sort((a, b) => a.date - b.date)[0];
  const quietDays = daysBetween(annotation.date, later?.date || endDate);
  if (quietDays >= 90) return 0;
  if (quietDays >= 60) return 0.3;
  if (quietDays >= 30) return 0.7;
  return 1;
}

function decayLabel(annotation, studentAnnotations, endDate = today()) {
  if (annotation.fault.PuntajeCongelado === "SI") return ["Congelada", "red"];
  const factor = decayFactor(annotation, studentAnnotations, endDate);
  if (factor === 0) return ["Sin impacto", "green"];
  if (factor === 0.3) return ["Rebajada 70%", "blue"];
  if (factor === 0.7) return ["Rebajada 30%", "yellow"];
  return ["Vigente", "orange"];
}

function riskFor(formative, total, rigCount) {
  if (rigCount > 0 || total >= 16) return ["Alto", "red"];
  if (formative >= 9 || total >= 10) return ["Medio", "orange"];
  if (formative >= 4 || total >= 5) return ["Bajo", "yellow"];
  return ["Sin riesgo", "green"];
}

function consequenceFor(score) {
  const effective = Math.max(0, Number(score) || 0);
  return consequenceScale.reduce((current, item) => (effective >= item.from ? item : current), consequenceScale[0]);
}

function recommendation(student) {
  const recentRig = student.weekly.some((week) => week.rig > 0);
  const risingWeeks = student.weekly.slice(1).filter((week, index) => week.formative > student.weekly[index].formative).length;
  const lastWeek = student.weekly.at(-1);
  const consequence = student.consequence?.label || consequenceFor(student.formativeScore).label;
  if (recentRig) return `${consequence}. Activar seguimiento RIG: revisar con convivencia, entrevistar alumno y apoderado, definir medida reparatoria y fecha de seguimiento.`;
  if (student.formativeScore >= 12 || risingWeeks >= 2) return `${consequence}. Plan de acompanamiento semanal: meta concreta, responsable asignado y revision en 7 dias.`;
  if (student.formativeScore >= 6 || lastWeek.formative >= 3) return `${consequence}. Conversacion formativa: identificar patron, acordar compromiso y observar la semana siguiente.`;
  if (student.formativeScore >= 3) return `${consequence}. Monitoreo preventivo: reforzar conducta esperada y revisar si se repite el mismo codigo.`;
  if (student.positiveCount >= 2 && student.daysQuiet >= 14) return "Reconocer mejora sostenida y mantener observacion habitual.";
  if (student.positiveCount > 0 && student.formativeScore <= 0) return "Reconocer conducta positiva y usarla como evidencia de progreso.";
  return `${consequence}. Mantener seguimiento regular.`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function rowValue(row, aliases) {
  const entries = Object.entries(row);
  for (const alias of aliases.map(normalize)) {
    const found = entries.find(([key]) => normalize(key) === alias);
    if (found) return found[1];
  }
  return "";
}

function fallbackFault(code, typeLabel, detail) {
  const normalizedType = normalize(typeLabel);
  if (normalize(code) === "otr" || normalizedType === "neutra" || normalizedType === "neutral") {
    return {
      Codigo: code || "Otr",
      Puntaje: 0,
      Descripcion: detail || "Observacion neutra",
      Tipo: "Neutral",
      PFA: "SI",
      RIG: "NO",
      PuntajeCongelado: "NO",
      Categoria: "NEUTRA",
    };
  }
  return null;
}

async function inflateRaw(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function readUInt16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8");
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (readUInt32(bytes, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("No se pudo leer el Excel");
  const entries = readUInt16(bytes, eocd + 10);
  let offset = readUInt32(bytes, eocd + 16);
  const files = {};

  for (let i = 0; i < entries; i += 1) {
    if (readUInt32(bytes, offset) !== 0x02014b50) break;
    const method = readUInt16(bytes, offset + 10);
    const compressedSize = readUInt32(bytes, offset + 20);
    const fileNameLength = readUInt16(bytes, offset + 28);
    const extraLength = readUInt16(bytes, offset + 30);
    const commentLength = readUInt16(bytes, offset + 32);
    const localHeaderOffset = readUInt32(bytes, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));
    const localNameLength = readUInt16(bytes, localHeaderOffset + 26);
    const localExtraLength = readUInt16(bytes, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const content = method === 0 ? compressed : await inflateRaw(compressed);
    files[name] = decoder.decode(content);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return files;
}

function xmlDoc(text) {
  return new DOMParser().parseFromString(text, "application/xml");
}

function excelSerialToDate(value) {
  const serial = Number(value);
  if (!Number.isFinite(serial)) return parseDate(value);
  const date = new Date(Date.UTC(1899, 11, 30));
  date.setUTCDate(date.getUTCDate() + serial);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function cellText(cell, sharedStrings) {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") return cell.querySelector("is t")?.textContent || "";
  const raw = cell.querySelector("v")?.textContent || "";
  if (type === "s") return sharedStrings[Number(raw)] || "";
  return raw;
}

function columnIndex(ref) {
  const letters = ref.replace(/\d/g, "");
  return [...letters].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function worksheetPathFor(files, preferredName = "Registro_anotaciones") {
  const workbookXml = files["xl/workbook.xml"];
  const relsXml = files["xl/_rels/workbook.xml.rels"];
  if (!workbookXml || !relsXml) {
    return Object.keys(files).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  }

  const workbookDoc = xmlDoc(workbookXml);
  const relsDoc = xmlDoc(relsXml);
  const rels = new Map(
    [...relsDoc.querySelectorAll("Relationship")].map((rel) => [
      rel.getAttribute("Id"),
      rel.getAttribute("Target"),
    ])
  );
  const sheets = [...workbookDoc.querySelectorAll("sheet")].map((sheet) => {
    const relId = sheet.getAttribute("r:id") || sheet.getAttribute("id");
    const target = rels.get(relId) || "";
    return {
      name: sheet.getAttribute("name") || "",
      path: target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^(\.\.\/)*/, "")}`,
    };
  });
  const exact = sheets.find((sheet) => normalize(sheet.name) === normalize(preferredName));
  const looseName = (value) => normalize(value).replace(/_/g, "");
  const loosePreferred = sheets.find((sheet) => looseName(sheet.name).includes(looseName(preferredName)));
  if (exact || loosePreferred) return (exact || loosePreferred).path;
  if (normalize(preferredName) !== normalize("Registro_anotaciones")) return null;
  const registro = sheets.find((sheet) => normalize(sheet.name).includes("registro"));
  return (registro || sheets[0])?.path;
}

async function rowsFromXlsx(file) {
  const files = await unzipXlsx(await file.arrayBuffer());
  const sharedDoc = files["xl/sharedStrings.xml"] ? xmlDoc(files["xl/sharedStrings.xml"]) : null;
  const sharedStrings = sharedDoc
    ? [...sharedDoc.querySelectorAll("si")].map((si) => [...si.querySelectorAll("t")].map((t) => t.textContent).join(""))
    : [];
  return rowsFromWorkbookFiles(files, sharedStrings, "Registro_anotaciones");
}

function rowsFromWorkbookFiles(files, sharedStrings, preferredName) {
  const sheetName = worksheetPathFor(files, preferredName);
  if (!sheetName) return [];
  const sheetDoc = xmlDoc(files[sheetName]);
  return [...sheetDoc.querySelectorAll("sheetData row")].map((row) => {
    const values = [];
    row.querySelectorAll("c").forEach((cell) => {
      values[columnIndex(cell.getAttribute("r") || "A1")] = cellText(cell, sharedStrings);
    });
    return values.map((value) => value ?? "");
  });
}

async function workbookDataFromXlsx(file) {
  const files = await unzipXlsx(await file.arrayBuffer());
  const sharedDoc = files["xl/sharedStrings.xml"] ? xmlDoc(files["xl/sharedStrings.xml"]) : null;
  const sharedStrings = sharedDoc
    ? [...sharedDoc.querySelectorAll("si")].map((si) => [...si.querySelectorAll("t")].map((t) => t.textContent).join(""))
    : [];
  return {
    rows: rowsFromWorkbookFiles(files, sharedStrings, "Registro_anotaciones"),
    mapRows: rowsFromWorkbookFiles(files, sharedStrings, "Mapa_faltas"),
    scaleRows: rowsFromWorkbookFiles(files, sharedStrings, "Escala_consecuencias"),
  };
}

function annotationsFromRows(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim());
  const byCode = new Map(faultMap.map((item) => [item.Codigo, item]));
  let skipped = 0;
  const unknown = new Set();

  const imported = rows
    .slice(1)
    .map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""])))
    .map((row, index) => {
      const code = String(rowValue(row, ["Codigo", "Código", "Cod", "Code"])).trim();
      const detail = String(rowValue(row, ["Descripcion", "Descripción", "Detalle", "Hecho", "Notas", "Motivo"])).trim();
      const typeLabel = String(rowValue(row, ["Tipo conducta", "Tipo", "TipoConducta"])).trim();
      const fault = byCode.get(code) || fallbackFault(code, typeLabel, detail);
      const rawDate = rowValue(row, ["Fecha", "Date"]);
      const firstName = String(rowValue(row, ["Nombre"])).trim();
      const lastName = String(rowValue(row, ["Primer apellido"])).trim();
      const responsible = String(rowValue(row, ["Responsable", "Adulto", "Profesor"])).trim() || [firstName, lastName].filter(Boolean).join(" ");
      return {
        id: `${Date.now()}-${index}`,
        date: /^\d+(\.\d+)?$/.test(String(rawDate)) ? excelSerialToDate(rawDate) : parseDate(rawDate),
        student: String(rowValue(row, ["Alumno", "Estudiante", "Student", "Apellidos y nombres"])).trim(),
        className: String(rowValue(row, ["Curso", "Class", "Clase", "División", "Division"])).trim(),
        code,
        detail,
        responsible,
        fault,
      };
    })
    .filter((item) => {
      const ok = item.student && item.className && item.code && item.date && item.fault;
      if (!ok) {
        skipped += 1;
        if (item.code && !item.fault) unknown.add(item.code);
      }
      return ok;
    });

  lastImportSummary = `Importados ${imported.length} registros. Omitidos ${skipped}.` +
    (unknown.size ? ` Codigos sin mapa: ${[...unknown].join(", ")}.` : "");
  return imported;
}

function inferFaultFields(code, existing = {}) {
  if (existing.PFA && existing.RIG) return existing;
  const isRig = String(code).startsWith("C");
  return {
    PFA: isRig ? "NO" : "SI",
    RIG: isRig ? "SI" : "NO",
    PuntajeCongelado: existing.PuntajeCongelado || "NO",
  };
}

function applyMapRows(mapRows) {
  if (!mapRows || mapRows.length < 2) return 0;
  const current = new Map(faultMap.map((item) => [item.Codigo, item]));
  let changed = 0;
  const imported = [];
  mapRows.slice(1).forEach((row) => {
    const code = String(row[0] || "").trim();
    const score = Number(row[1]);
    const description = String(row[2] || "").trim();
    const type = String(row[3] || "").trim();
    if (!code || !Number.isFinite(score) || !description) return;
    const existing = current.get(code) || {};
    const inferred = inferFaultFields(code, existing);
    imported.push({
      Codigo: code,
      Puntaje: score,
      Descripcion: description,
      Tipo: type || existing.Tipo || (score < 0 ? "Positive" : "Negative"),
      PFA: inferred.PFA,
      RIG: inferred.RIG,
      PuntajeCongelado: inferred.PuntajeCongelado,
      Categoria: existing.Categoria || (code.startsWith("A") ? "A" : code.startsWith("B") ? "B" : code.startsWith("C") ? "C" : code.slice(0, 2)),
    });
    changed += 1;
  });
  if (imported.length) faultMap = imported;
  return changed;
}

function applyScaleRows(scaleRows) {
  if (!scaleRows || scaleRows.length < 2) return 0;
  const imported = scaleRows
    .slice(1)
    .map((row) => ({ from: Number(row[0]), label: String(row[1] || "").trim() }))
    .filter((item) => Number.isFinite(item.from) && item.label)
    .sort((a, b) => a.from - b.from);
  if (imported.length) consequenceScale = imported;
  return imported.length;
}

function annotationsFromCsv(text) {
  const rows = parseCsv(text);
  return annotationsFromRows(rows);
}

function filteredAnnotations() {
  const query = normalize($("searchInput").value);
  const className = $("classFilter").value;
  const from = parseDate($("fromDate").value);
  const to = parseDate($("toDate").value);
  return annotations.filter((item) => {
    if (query && !normalize(item.student).includes(query)) return false;
    if (className && item.className !== className) return false;
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    return true;
  });
}

function weeklySummary(scored, weeks) {
  return weeks.map((week) => {
    const entries = scored.filter((item) => item.date >= week.start && item.date <= week.end);
    return {
      ...week,
      count: entries.length,
      formative: entries.filter((item) => item.fault.PFA === "SI").reduce((sum, item) => sum + item.effective, 0),
      total: entries.reduce((sum, item) => sum + item.effective, 0),
      rig: entries.filter((item) => item.fault.RIG === "SI").length,
      positive: entries.filter((item) => item.fault.Tipo === "Positive").length,
    };
  });
}

function trendFromWeeks(weekly) {
  const current = weekly[0]?.formative || 0;
  const previous = weekly[1]?.formative || 0;
  const delta = current - previous;
  if (delta > 0.1) return { label: `Subio ${fmt(delta)} pts esta semana`, value: delta, color: "orange" };
  if (delta < -0.1) return { label: `Bajo ${fmt(Math.abs(delta))} pts esta semana`, value: delta, color: "green" };
  return { label: "Sin cambio esta semana", value: 0, color: "blue" };
}

function weekChips(weekly) {
  return `<span class="week-chips">${weekly.map((week) => {
    const color = week.rig > 0 ? "red" : week.formative >= 3 ? "orange" : week.formative > 0 ? "yellow" : week.positive > 0 ? "green" : "blue";
    const note = week.rig > 0 ? `${week.rig} RIG` : week.count ? `${week.count} anot.` : "sin anot.";
    return `<span class="week-chip ${color}" title="${week.label}: ${note}, PFA ${fmt(week.formative)}, Total ${fmt(week.total)}">${week.label}<b>${fmt(week.formative)}</b><small>${note}</small></span>`;
  }).join("")}</span>`;
}

function buildStudents(source = filteredAnnotations()) {
  const grouped = new Map();
  const endDate = referenceDate(source.length ? source : annotations);
  const weeks = lastFourWeeks(endDate);
  source.forEach((item) => {
    const key = `${item.student}__${item.className}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });

  return [...grouped.entries()].map(([key, items]) => {
    items.sort((a, b) => b.date - a.date);
    const [student, className] = key.split("__");
    const scored = items.map((item) => {
      const factor = decayFactor(item, items, endDate);
      const effective = Number(item.fault.Puntaje) * factor;
      return { ...item, factor, effective };
    });
    const weekly = weeklySummary(scored, weeks);
    const trend = trendFromWeeks(weekly);
    const formativeScore = scored
      .filter((item) => item.fault.PFA === "SI")
      .reduce((sum, item) => sum + item.effective, 0);
    const totalScore = scored.reduce((sum, item) => sum + item.effective, 0);
    const rigCount = scored.filter((item) => item.fault.RIG === "SI").length;
    const positiveCount = scored.filter((item) => item.fault.Tipo === "Positive").length;
    const latest = items[0]?.date || null;
    const [risk, riskColor] = riskFor(formativeScore, totalScore, rigCount);
    const consequence = consequenceFor(formativeScore);
    return {
      key,
      student,
      className,
      annotations: scored,
      formativeScore,
      totalScore,
      rigCount,
      positiveCount,
      latest,
      daysQuiet: daysBetween(latest, endDate),
      weekly,
      trend: trend.label,
      trendValue: trend.value,
      trendColor: trend.color,
      risk,
      riskColor,
      consequence,
      recommendation: "",
    };
  }).map((student) => ({ ...student, recommendation: recommendation(student) }));
}

function scoreBar(value) {
  const color = value >= 16 ? "var(--red)" : value >= 9 ? "var(--orange)" : value >= 4 ? "var(--yellow)" : "var(--green)";
  const width = Math.min(100, Math.max(6, Math.abs(value) * 5));
  return `<span class="score-bar"><span>${fmt(value)}</span><b class="bar"><i style="--w:${width}%;--c:${color}"></i></b></span>`;
}

function pill(text, color) {
  return `<span class="pill ${color}">${text}</span>`;
}

function renderTable(container, headers, rows, empty = "Sin datos para mostrar") {
  if (!rows.length) {
    container.innerHTML = `<div class="empty">${empty}</div>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function evolutionChart(student) {
  const weekly = [...student.weekly].reverse();
  const max = Math.max(5, ...weekly.map((week) => Math.max(week.formative, week.total, week.rig * 3)));
  const points = (key) => weekly.map((week, index) => {
    const x = 44 + index * 160;
    const y = 170 - (Math.max(0, week[key]) / max) * 130;
    return `${x},${y}`;
  }).join(" ");
  const labels = weekly.map((week, index) => {
    const x = 44 + index * 160;
    return `<text x="${x}" y="202" text-anchor="middle" font-size="11" fill="#647084">${week.label}</text>`;
  }).join("");
  return `
    <svg class="chart" viewBox="0 0 560 220" role="img" aria-label="Evolucion de puntaje">
      <line x1="36" y1="170" x2="532" y2="170" stroke="#d9dee8" />
      <line x1="36" y1="40" x2="36" y2="170" stroke="#d9dee8" />
      <polyline points="${points("formative")}" fill="none" stroke="#2563eb" stroke-width="3" />
      <polyline points="${points("total")}" fill="none" stroke="#f97316" stroke-width="3" />
      <polyline points="${points("rig")}" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="5 5" />
      ${weekly.map((week, index) => {
        const x = 44 + index * 160;
        const y = 170 - (Math.max(0, week.formative) / max) * 130;
        return `<circle cx="${x}" cy="${y}" r="4" fill="#2563eb"><title>${week.label}: PFA ${fmt(week.formative)}</title></circle>`;
      }).join("")}
      ${labels}
    </svg>
    <div class="legend"><span style="color:#2563eb">Puntaje formativo</span><span style="color:#f97316">Puntaje total</span><span style="color:#dc2626">RIG</span></div>
  `;
}

function renderDashboard(students) {
  const support = students
    .filter((student) => student.formativeScore >= 4 || student.rigCount > 0)
    .sort((a, b) => b.formativeScore - a.formativeScore)
    .slice(0, 10);
  const changes = students
    .filter((student) => student.weekly.some((week) => week.count > 0))
    .sort((a, b) => Math.abs(b.trendValue) - Math.abs(a.trendValue) || b.weekly.at(-1).formative - a.weekly.at(-1).formative)
    .slice(0, 10);

  $("metricStudents").textContent = students.length;
  $("metricRig").textContent = students.filter((student) => student.rigCount > 0).length;
  $("metricSupport").textContent = support.length;
  $("metricImproving").textContent = students.filter((student) => student.daysQuiet >= 30 || student.trend.startsWith("Mejora")).length;

  renderTable(
    $("supportList"),
    ["Estudiante", "Curso", "P. formativo", "RIG", "P. total", "Consecuencia", "Riesgo", "Acompanamiento"],
    support.map((student) => `
      <tr data-student="${student.key}">
        <td><strong>${student.student}</strong></td>
        <td>${student.className}</td>
        <td>${scoreBar(student.formativeScore)}</td>
        <td>${student.rigCount ? pill(`${student.rigCount} RIG`, "red") : pill("0 RIG", "green")}</td>
        <td>${fmt(student.totalScore)}</td>
        <td>${student.consequence.label}</td>
        <td>${pill(student.risk, student.riskColor)}</td>
        <td>${student.recommendation}</td>
      </tr>
    `)
  );

  renderTable(
    $("changesList"),
    ["Estudiante", "Curso", "Ultimas 4 semanas", "Cambio semanal", "Que paso", "Recomendacion"],
    changes.map((student) => `
      <tr data-student="${student.key}">
        <td><strong>${student.student}</strong></td>
        <td>${student.className}</td>
        <td>${weekChips(student.weekly)}</td>
        <td>${pill(student.trend, student.trendColor)}</td>
        <td>${student.weekly[0].rig > 0 ? "Tuvo RIG esta semana" : student.weekly[0].count ? `${student.weekly[0].count} anotaciones esta semana` : "Sin anotaciones esta semana"}</td>
        <td>${student.recommendation}</td>
      </tr>
    `)
  );
}

function renderStudents(students) {
  $("studentCount").textContent = `${students.length} registros`;
  renderTable(
    $("studentsTable"),
    ["Estudiante", "Curso", "P. formativo", "RIG", "P. total", "4 semanas", "Consecuencia", "Riesgo", "Dias sin anotaciones", "Recomendacion"],
    students
      .sort((a, b) => b.formativeScore - a.formativeScore)
      .map((student) => `
        <tr data-student="${student.key}">
          <td><strong>${student.student}</strong></td>
          <td>${student.className}</td>
          <td>${scoreBar(student.formativeScore)}</td>
          <td>${student.rigCount ? pill(`${student.rigCount} RIG`, "red") : pill("0 RIG", "green")}</td>
          <td>${fmt(student.totalScore)}</td>
          <td>${weekChips(student.weekly)}</td>
          <td>${student.consequence.label}</td>
          <td>${pill(student.risk, student.riskColor)}</td>
          <td>${student.daysQuiet}</td>
          <td>${student.recommendation}</td>
        </tr>
      `)
  );
}

function renderClasses(students) {
  const grouped = new Map();
  students.forEach((student) => {
    if (!grouped.has(student.className)) grouped.set(student.className, []);
    grouped.get(student.className).push(student);
  });
  $("classesGrid").innerHTML = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([className, items]) => {
      const avg = items.reduce((sum, item) => sum + item.formativeScore, 0) / Math.max(1, items.length);
      const support = items.filter((item) => item.formativeScore >= 4 || item.rigCount > 0).length;
      const improving = items.filter((item) => item.trend.startsWith("Mejora") || item.daysQuiet >= 30).length;
      const rig = items.filter((item) => item.rigCount > 0).length;
      const classStudents = [...items].sort((a, b) => b.formativeScore - a.formativeScore);
      return `
        <article class="class-card">
          <h2>${className}</h2>
          <div class="class-stats">
            <div><span>Alumnos</span><strong>${items.length}</strong></div>
            <div><span>Promedio</span><strong>${fmt(avg)}</strong></div>
            <div><span>Acomp.</span><strong>${support}</strong></div>
            <div><span>RIG</span><strong>${rig}</strong></div>
          </div>
          <div class="class-stats">
            <div><span>Mejora</span><strong>${improving}</strong></div>
            <div><span>Bajo</span><strong>${items.filter((i) => i.risk === "Bajo").length}</strong></div>
            <div><span>Medio</span><strong>${items.filter((i) => i.risk === "Medio").length}</strong></div>
            <div><span>Alto</span><strong>${items.filter((i) => i.risk === "Alto").length}</strong></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Estudiante</th><th>P. formativo</th><th>4 semanas</th><th>Consecuencia</th><th>Riesgo</th></tr></thead>
              <tbody>
                ${classStudents.map((student) => `
                  <tr data-student="${student.key}">
                    <td><strong>${student.student}</strong></td>
                    <td>${scoreBar(student.formativeScore)}</td>
                    <td>${weekChips(student.weekly)}</td>
                    <td>${student.consequence.label}</td>
                    <td>${pill(student.risk, student.riskColor)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </article>
      `;
    })
    .join("") || `<div class="empty">Sin clases para mostrar</div>`;
}

function renderMap() {
  $("mapCount").textContent = `${faultMap.length} codigos`;
  renderTable(
    $("mapTable"),
    ["Codigo", "Categoria", "Puntaje", "Tipo", "PFA", "RIG", "Congelado", "Descripcion"],
    faultMap.map((item) => `
      <tr>
        <td><strong>${item.Codigo}</strong></td>
        <td>${item.Categoria}</td>
        <td>${fmt(item.Puntaje)}</td>
        <td>${item.Tipo}</td>
        <td>${item.PFA}</td>
        <td>${item.RIG}</td>
        <td>${item.PuntajeCongelado}</td>
        <td>${item.Descripcion}</td>
      </tr>
    `)
  );
}

function renderDrawer(key) {
  const student = buildStudents(annotations).find((item) => item.key === key);
  if (!student) return;
  const note = studentNotes[key] || { comment: "", measure: "", measureDate: "", owner: "" };
  $("drawerContent").innerHTML = `
    <h2>${student.student}</h2>
    <p>${student.className} - ${student.recommendation}</p>
    <div class="drawer-metrics">
      <div><span>P. formativo</span><strong>${fmt(student.formativeScore)}</strong></div>
      <div><span>P. total</span><strong>${fmt(student.totalScore)}</strong></div>
      <div><span>RIG</span><strong>${student.rigCount}</strong></div>
      <div><span>Consecuencia</span><strong>${student.consequence.label}</strong></div>
    </div>
    <div class="drawer-metrics">
      <div><span>Dias sin anotaciones</span><strong>${student.daysQuiet}</strong></div>
      <div><span>Riesgo</span><strong>${student.risk}</strong></div>
      <div><span>Cambio semanal</span><strong>${student.trend}</strong></div>
      <div><span>Positivas</span><strong>${student.positiveCount}</strong></div>
    </div>
    <section class="panel">
      <div class="panel-title">
        <h2>Evolucion de puntaje</h2>
        <span>Izquierda: semanas anteriores. Derecha: semana actual.</span>
      </div>
      ${evolutionChart(student)}
    </section>
    <section class="panel">
      <div class="panel-title">
        <h2>Seguimiento semanal</h2>
        <span>Semana actual aparece primero</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Semana desde</th><th>Anotaciones</th><th>P. formativo</th><th>P. total</th><th>RIG</th><th>Positivas</th></tr>
          </thead>
          <tbody>
            ${student.weekly.map((week) => `
              <tr>
                <td>${week.label}</td>
                <td>${week.count}</td>
                <td>${fmt(week.formative)}</td>
                <td>${fmt(week.total)}</td>
                <td>${week.rig}</td>
                <td>${week.positive}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-title">
        <h2>Comentarios y medidas tomadas</h2>
        <span>Guardado localmente en este navegador</span>
      </div>
      <div class="form-grid" data-note-form="${student.key}">
        <label class="wide">Comentario de seguimiento
          <textarea class="note-box" data-field="comment">${note.comment}</textarea>
        </label>
        <label>Medida disciplinaria o formativa tomada
          <input data-field="measure" value="${note.measure}" placeholder="Ej: entrevista, compromiso, detencion" />
        </label>
        <label>Fecha de la medida
          <input data-field="measureDate" type="date" value="${note.measureDate}" />
        </label>
        <label>Responsable
          <input data-field="owner" value="${note.owner}" placeholder="Profesor jefe / convivencia" />
        </label>
        <div class="wide">
          <button class="button primary" data-save-note="${student.key}">Guardar comentario y medida</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-title">
        <h2>Historial de anotaciones</h2>
        <span>${student.annotations.length} registros</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Codigo</th><th>Tipo</th><th>PFA</th><th>RIG</th><th>Puntaje</th><th>Impacto</th><th>Estado</th><th>Descripcion</th></tr>
          </thead>
          <tbody>
            ${student.annotations.map((item) => {
              const [label, color] = decayLabel(item, student.annotations, referenceDate(annotations));
              return `
                <tr>
                  <td>${toIso(item.date)}</td>
                  <td><strong>${item.code}</strong></td>
                  <td>${item.fault.Tipo}</td>
                  <td>${item.fault.PFA}</td>
                  <td>${item.fault.RIG}</td>
                  <td>${fmt(item.fault.Puntaje)}</td>
                  <td>${fmt(item.effective)}</td>
                  <td>${pill(label, color)}</td>
                  <td>${item.detail || item.fault.Descripcion}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
  $("studentDrawer").classList.add("open");
  $("studentDrawer").setAttribute("aria-hidden", "false");
}
function populateClassFilter() {
  const current = $("classFilter").value;
  const classes = [...new Set(annotations.map((item) => item.className))].sort();
  $("classFilter").innerHTML = `<option value="">Todos los cursos</option>${classes.map((item) => `<option value="${item}">${item}</option>`).join("")}`;
  $("classFilter").value = classes.includes(current) ? current : "";
}

function render() {
  populateClassFilter();
  const students = buildStudents();
  renderDashboard(students);
  renderStudents(students);
  renderClasses(students);
  renderMap();
  $("subtitle").textContent = `${annotations.length} anotaciones · ${faultMap.length} codigos oficiales`;
  $("importStatus").textContent = lastImportSummary;
}

function saveConfig() {
  localStorage.setItem(`${STORAGE_KEY}_fault_map`, JSON.stringify(faultMap));
  localStorage.setItem(`${STORAGE_KEY}_scale`, JSON.stringify(consequenceScale));
  localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(studentNotes));
}

function restoreConfig() {
  try {
    const savedMap = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_fault_map`) || "null");
    const savedScale = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_scale`) || "null");
    const savedNotes = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_notes`) || "null");
    if (Array.isArray(savedMap) && savedMap.length) faultMap = savedMap;
    if (Array.isArray(savedScale) && savedScale.length) consequenceScale = savedScale;
    if (savedNotes && typeof savedNotes === "object") studentNotes = savedNotes;
  } catch {
    consequenceScale = [...DEFAULT_CONSEQUENCE_SCALE];
  }
}

function saveAnnotations() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(annotations.map((item) => ({ ...item, date: toIso(item.date), fault: undefined })))
  );
  localStorage.setItem(`${STORAGE_KEY}_summary`, lastImportSummary);
  saveConfig();
}

function restoreAnnotations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  lastImportSummary = localStorage.getItem(`${STORAGE_KEY}_summary`) || "";
  const byCode = new Map(faultMap.map((item) => [item.Codigo, item]));
  annotations = JSON.parse(raw)
    .map((item) => ({ ...item, date: parseDate(item.date), fault: byCode.get(item.code) || fallbackFault(item.code, "", item.detail) }))
    .filter((item) => item.fault);
}

function downloadTemplate() {
  const csv = [
    ["Fecha", "Alumno", "Curso", "Codigo", "Descripcion", "Responsable"],
    ["2026-05-25", "Nombre Apellido", "7-B", "A2", "Llega tarde a la actividad", "Profesor/a"],
  ]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla_anotaciones.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentView = tab.dataset.view;
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${currentView}View`));
    });
  });

  ["searchInput", "classFilter", "fromDate", "toDate"].forEach((id) => $(id).addEventListener("input", render));
  $("downloadTemplate").addEventListener("click", downloadTemplate);
  $("fileInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    let imported = [];
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      const workbookData = await workbookDataFromXlsx(file);
      const mapCount = applyMapRows(workbookData.mapRows);
      const scaleCount = applyScaleRows(workbookData.scaleRows);
      imported = annotationsFromRows(workbookData.rows);
      lastImportSummary += ` Mapa actualizado: ${mapCount || "no"}. Escala actualizada: ${scaleCount || "no"}.`;
    } else {
      imported = annotationsFromCsv(await file.text());
    }
    annotations = imported;
    saveAnnotations();
    render();
  });

  document.body.addEventListener("click", (event) => {
    const saveNote = event.target.closest("[data-save-note]");
    if (saveNote) {
      const key = saveNote.dataset.saveNote;
      const form = document.querySelector(`[data-note-form="${CSS.escape(key)}"]`);
      if (form) {
        studentNotes[key] = Object.fromEntries(
          [...form.querySelectorAll("[data-field]")].map((input) => [input.dataset.field, input.value])
        );
        saveConfig();
        saveNote.textContent = "Guardado";
        setTimeout(() => { saveNote.textContent = "Guardar comentario y medida"; }, 1200);
      }
      return;
    }
    const row = event.target.closest("[data-student]");
    if (row) renderDrawer(row.dataset.student);
  });

  $("closeDrawer").addEventListener("click", () => {
    $("studentDrawer").classList.remove("open");
    $("studentDrawer").setAttribute("aria-hidden", "true");
  });
}

async function init() {
  try {
    const response = await fetch(MAP_URL);
    faultMap = await response.json();
  } catch {
    faultMap = window.DEFAULT_FAULT_MAP || [];
  }
  restoreConfig();
  restoreAnnotations();
  bindEvents();
  render();
}

init().catch((error) => {
  document.body.innerHTML = `<main><section class="panel"><div class="empty">No se pudo cargar la app: ${error.message}</div></section></main>`;
});


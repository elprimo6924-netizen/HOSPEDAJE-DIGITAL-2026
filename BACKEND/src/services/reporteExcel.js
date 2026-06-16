const ExcelJS = require('exceljs');
const DashboardService = require('./dashboard.service');

/* ── Paleta ── */
const C = {
    naranja:    'FFE8743B',
    verde:      'FF15302A',
    crema:      'FFFBF4EC',
    blanco:     'FFFFFFFF',
    texto:      'FF2B2B2B',
    borde:      'FFD9D2C7',
    fondoFila:  'FFFAF6EF',
    zebraFila:  'FFF2EDE5',
    positivo:   'FF2E7D5B',
    rojo:       'FFC0392B',
    grisClaro:  'FFF1F5F9',
    grisTexto:  'FF6B7280',
    oro:        'FFC89820',
};

/* ── Helpers ── */
const copFmt  = '"$"#,##0';
const intFmt  = '#,##0';
const pctFmt  = '0.0"%"';

function setFont(cell, opts = {}) {
    cell.font = { name: opts.name || 'Calibri', size: opts.size || 11, bold: !!opts.bold, color: { argb: opts.color || C.texto }, ...opts.extra };
}

function setFill(cell, argb) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function setBorder(cell, color = C.borde) {
    const s = { style: 'thin', color: { argb: color } };
    cell.border = { top: s, left: s, bottom: s, right: s };
}

function setHeaderStyle(cell, bgArgb = C.naranja, fgArgb = C.blanco) {
    cell.font    = { name: 'Calibri', size: 11, bold: true, color: { argb: fgArgb } };
    cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.border  = { top: { style: 'thin', color: { argb: C.borde } }, left: { style: 'thin', color: { argb: C.borde } }, bottom: { style: 'medium', color: { argb: bgArgb } }, right: { style: 'thin', color: { argb: C.borde } } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function applyZebra(row, idx) {
    const argb = idx % 2 === 0 ? C.fondoFila : C.zebraFila;
    row.eachCell({ includeEmpty: true }, cell => {
        if (!cell.fill || cell.fill.fgColor?.argb === C.blanco || !cell.fill.fgColor?.argb) {
            setFill(cell, argb);
        }
        setBorder(cell, C.borde);
        cell.alignment = cell.alignment || {};
        cell.alignment.vertical = 'middle';
    });
}

function addDataBar(ws, col, startRow, endRow) {
    if (!ws.conditionalFormattings) ws.conditionalFormattings = [];
    ws.conditionalFormattings.push({
        ref: `${col}${startRow}:${col}${endRow}`,
        rules: [{
            type: 'dataBar',
            dataBar: {
                minLength: 0,
                maxLength: 100,
                color: { argb: C.naranja },
                showValue: true,
                cfvo: [{ type: 'min' }, { type: 'max' }],
            },
            priority: 1,
        }],
    });
}

function mergeFill(ws, startCell, endCell, argb) {
    ws.mergeCells(`${startCell}:${endCell}`);
    const cell = ws.getCell(startCell);
    setFill(cell, argb);
    return cell;
}

/* ────────────────────────────────────────────── */
/*  HOJA 1 — PORTADA                              */
/* ────────────────────────────────────────────── */
function buildPortada(wb, fecha) {
    const ws = wb.addWorksheet('Portada', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 28;
    ws.getColumn('C').width = 28;
    ws.getColumn('D').width = 28;
    ws.getColumn('E').width = 4;

    /* Banda verde superior */
    for (let r = 1; r <= 5; r++) {
        ws.getRow(r).height = 18;
        ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }

    /* Título principal */
    ws.mergeCells('B2:D2');
    const titulo = ws.getCell('B2');
    titulo.value = 'HOSPEDAJE DIGITAL';
    titulo.font    = { name: 'Calibri', size: 26, bold: true, color: { argb: C.blanco } };
    titulo.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('B3:D3');
    const sub = ws.getCell('B3');
    sub.value = 'Reporte de Gestión Hotelera';
    sub.font    = { name: 'Calibri', size: 14, bold: false, color: { argb: 'FFFDE68A' } };
    sub.alignment = { horizontal: 'center', vertical: 'middle' };

    /* Línea separadora crema */
    ws.getRow(6).height = 8;
    ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}6`), C.crema));

    /* Filas de contenido */
    const infoRows = [
        ['', 'Fecha de Generación:', fecha, ''],
        ['', 'Sistema:', 'Hospedaje Digital', ''],
        ['', 'Módulo:', 'Panel de Control — Dashboard', ''],
        ['', 'Tipo de Reporte:', 'Ejecutivo — Estadísticas Generales', ''],
    ];

    let row = 8;
    infoRows.forEach(([, label, val]) => {
        ws.getRow(row).height = 24;
        const lCell = ws.getCell(`B${row}`);
        lCell.value = label;
        lCell.font  = { name: 'Calibri', size: 11, bold: true, color: { argb: C.grisTexto } };
        lCell.alignment = { horizontal: 'right', vertical: 'middle' };
        const vCell = ws.getCell(`C${row}`);
        vCell.value = val;
        vCell.font  = { name: 'Calibri', size: 11, bold: false, color: { argb: C.texto } };
        vCell.alignment = { horizontal: 'left', vertical: 'middle' };
        row++;
    });

    /* Separador */
    row += 1;
    ws.mergeCells(`B${row}:D${row}`);
    const sep = ws.getCell(`B${row}`);
    sep.value = '─'.repeat(60);
    sep.font = { color: { argb: C.borde }, size: 9 };
    row += 2;

    /* Bloque SENA */
    const senaHeaders = [
        ['Centro de Formación:', 'Centro de Comercio y Servicios Regional Tolima'],
        ['Ficha:', 'ADSO — Tecnólogo en Análisis y Desarrollo de SW'],
        ['Instructor:', 'Por definir'],
        ['Aprendices:', 'Por definir'],
        ['Servicio / Dominio:', 'Administración y Mantenimiento de SW'],
    ];
    ws.mergeCells(`B${row}:D${row}`);
    const senaTitle = ws.getCell(`B${row}`);
    senaTitle.value = 'INFORMACIÓN INSTITUCIONAL — SENA';
    senaTitle.font  = { name: 'Calibri', size: 12, bold: true, color: { argb: C.verde } };
    senaTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(row).height = 22;
    row += 1;

    senaHeaders.forEach(([label, val]) => {
        ws.getRow(row).height = 22;
        const lCell = ws.getCell(`B${row}`);
        lCell.value = label;
        lCell.font  = { name: 'Calibri', size: 10, bold: true, color: { argb: C.grisTexto } };
        lCell.alignment = { horizontal: 'right', vertical: 'middle' };
        const vCell = ws.getCell(`C${row}`);
        vCell.value = val;
        vCell.font  = { name: 'Calibri', size: 10, bold: false, color: { argb: C.texto } };
        vCell.alignment = { horizontal: 'left', vertical: 'middle' };
        row++;
    });

    /* Pie de portada */
    row += 2;
    ws.getRow(row).height = 18;
    ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${row}`), C.verde));
    ws.mergeCells(`B${row}:D${row}`);
    const pie = ws.getCell(`B${row}`);
    pie.value = '© Hospedaje Digital — Uso interno';
    pie.font  = { name: 'Calibri', size: 9, color: { argb: 'FFAAAAAA' } };
    pie.alignment = { horizontal: 'center', vertical: 'middle' };
}

/* ────────────────────────────────────────────── */
/*  HOJA 2 — RESUMEN EJECUTIVO (KPIs)             */
/* ────────────────────────────────────────────── */
function buildResumen(wb, data) {
    const ws = wb.addWorksheet('Resumen Ejecutivo', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 36;
    ws.getColumn('C').width = 22;
    ws.getColumn('D').width = 4;

    /* Banda header */
    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:C1');
    const h = ws.getCell('B1');
    h.value = 'RESUMEN EJECUTIVO — INDICADORES CLAVE';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    /* Header de tabla */
    ws.getRow(5).height = 22;
    const headers = ['B5', 'C5'];
    const hTexts  = ['Indicador', 'Valor'];
    headers.forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = hTexts[i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });

    const kpis = [
        ['Ingresos del mes (reservas activas)', Number(data.ingresosMes    || 0), copFmt, C.positivo],
        ['Reservas activas hoy',                Number(data.reservasActivas|| 0), intFmt, C.texto],
        ['Habitaciones ocupadas hoy',           Number(data.habOcupadas    || 0), intFmt, C.texto],
        ['Clientes registrados',                Number(data.totalClientes  || 0), intFmt, C.texto],
        ['Paquetes disponibles',                Number(data.paqActivos     || 0), intFmt, C.texto],
    ];

    kpis.forEach(([label, val, fmt, color], i) => {
        const rowNum = 6 + i;
        ws.getRow(rowNum).height = 26;
        const lCell = ws.getCell(`B${rowNum}`);
        lCell.value = label;
        lCell.font  = { name: 'Calibri', size: 11, bold: false, color: { argb: C.texto } };
        lCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const vCell = ws.getCell(`C${rowNum}`);
        vCell.value          = val;
        vCell.numFmt         = fmt;
        vCell.font           = { name: 'Calibri', size: 13, bold: true, color: { argb: color } };
        vCell.alignment      = { vertical: 'middle', horizontal: 'right' };

        applyZebra(ws.getRow(rowNum), i);
        setBorder(lCell);
        setBorder(vCell);
    });

    /* Total fila visual */
    ws.getRow(11).height = 6;
}

/* ────────────────────────────────────────────── */
/*  HOJA 3 — RESERVAS POR ESTADO                  */
/* ────────────────────────────────────────────── */
function buildPorEstado(wb, estados) {
    const ws = wb.addWorksheet('Por Estado', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 28;
    ws.getColumn('C').width = 16;
    ws.getColumn('D').width = 16;
    ws.getColumn('E').width = 4;

    /* Header banda */
    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:D1');
    const h = ws.getCell('B1');
    h.value = 'RESERVAS POR ESTADO';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    /* Encabezados columna */
    ws.getRow(5).height = 22;
    ['B5','C5','D5'].forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = ['Estado', 'Cantidad', '% del Total'][i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const total = estados.reduce((s, r) => s + Number(r.total), 0);
    const dataStart = 6;
    estados.forEach((r, i) => {
        const rowNum = dataStart + i;
        ws.getRow(rowNum).height = 22;

        const eCell = ws.getCell(`B${rowNum}`);
        eCell.value = r.nombre;
        eCell.font  = { name: 'Calibri', size: 10, color: { argb: C.texto } };
        eCell.alignment = { vertical: 'middle' };

        const cCell = ws.getCell(`C${rowNum}`);
        cCell.value  = Number(r.total);
        cCell.numFmt = intFmt;
        cCell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: C.texto } };
        cCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const pCell = ws.getCell(`D${rowNum}`);
        pCell.value  = total > 0 ? +(Number(r.total) / total * 100).toFixed(1) : 0;
        pCell.numFmt = pctFmt;
        pCell.font   = { name: 'Calibri', size: 10, color: { argb: C.texto } };
        pCell.alignment = { vertical: 'middle', horizontal: 'center' };

        applyZebra(ws.getRow(rowNum), i);
        [eCell, cCell, pCell].forEach(c => setBorder(c));
    });

    /* Fila total */
    const totalRow = dataStart + estados.length;
    ws.getRow(totalRow).height = 22;
    const tLabel = ws.getCell(`B${totalRow}`);
    tLabel.value = 'TOTAL';
    tLabel.font  = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    tLabel.alignment = { vertical: 'middle' };
    setFill(tLabel, C.naranja);
    setBorder(tLabel, C.naranja);

    const tVal = ws.getCell(`C${totalRow}`);
    tVal.value  = total;
    tVal.numFmt = intFmt;
    tVal.font   = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    tVal.alignment = { vertical: 'middle', horizontal: 'center' };
    setFill(tVal, C.naranja);
    setBorder(tVal, C.naranja);

    const tPct = ws.getCell(`D${totalRow}`);
    tPct.value  = 100;
    tPct.numFmt = pctFmt;
    tPct.font   = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    tPct.alignment = { vertical: 'middle', horizontal: 'center' };
    setFill(tPct, C.naranja);
    setBorder(tPct, C.naranja);

    if (estados.length > 0) {
        addDataBar(ws, 'C', dataStart, dataStart + estados.length - 1);
    }

    ws.autoFilter = { from: 'B5', to: 'D5' };
}

/* ────────────────────────────────────────────── */
/*  HOJA 4 — INGRESOS POR MES                     */
/* ────────────────────────────────────────────── */
function buildPorMes(wb, meses) {
    const ws = wb.addWorksheet('Ingresos por Mes', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 24;
    ws.getColumn('C').width = 18;
    ws.getColumn('D').width = 22;
    ws.getColumn('E').width = 4;

    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:D1');
    const h = ws.getCell('B1');
    h.value = 'INGRESOS Y RESERVAS POR MES';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(5).height = 22;
    ['B5','C5','D5'].forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = ['Mes', 'Reservas', 'Ingresos (COP)'][i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const dataStart = 6;
    let totalRes = 0, totalIng = 0;

    meses.forEach((r, i) => {
        const rowNum = dataStart + i;
        ws.getRow(rowNum).height = 22;

        const [y, m] = (r.mes || '').split('-');
        const label = y && m
            ? new Date(Number(y), Number(m) - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
            : r.mes;
        totalRes += Number(r.total  || 0);
        totalIng += Number(r.ingresos || 0);

        const mCell = ws.getCell(`B${rowNum}`);
        mCell.value = label;
        mCell.font  = { name: 'Calibri', size: 10, color: { argb: C.texto } };
        mCell.alignment = { vertical: 'middle' };

        const cCell = ws.getCell(`C${rowNum}`);
        cCell.value  = Number(r.total || 0);
        cCell.numFmt = intFmt;
        cCell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: C.texto } };
        cCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const iCell = ws.getCell(`D${rowNum}`);
        iCell.value  = Number(r.ingresos || 0);
        iCell.numFmt = copFmt;
        iCell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: C.positivo } };
        iCell.alignment = { vertical: 'middle', horizontal: 'right' };

        applyZebra(ws.getRow(rowNum), i);
        [mCell, cCell, iCell].forEach(c => setBorder(c));
    });

    /* Fila total */
    const totalRow = dataStart + meses.length;
    ws.getRow(totalRow).height = 22;
    ['B','C','D'].forEach(col => setFill(ws.getCell(`${col}${totalRow}`), C.naranja));

    const tl = ws.getCell(`B${totalRow}`);
    tl.value = 'TOTAL';
    tl.font  = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    tl.alignment = { vertical: 'middle' };
    setBorder(tl, C.naranja);

    const tc = ws.getCell(`C${totalRow}`);
    tc.value  = totalRes;
    tc.numFmt = intFmt;
    tc.font   = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    tc.alignment = { vertical: 'middle', horizontal: 'center' };
    setBorder(tc, C.naranja);

    const ti = ws.getCell(`D${totalRow}`);
    ti.value  = totalIng;
    ti.numFmt = copFmt;
    ti.font   = { name: 'Calibri', size: 11, bold: true, color: { argb: C.blanco } };
    ti.alignment = { vertical: 'middle', horizontal: 'right' };
    setBorder(ti, C.naranja);

    if (meses.length > 0) {
        addDataBar(ws, 'D', dataStart, dataStart + meses.length - 1);
    }

    ws.autoFilter = { from: 'B5', to: 'D5' };
}

/* ────────────────────────────────────────────── */
/*  HOJA 5 — PAQUETES MÁS SOLICITADOS             */
/* ────────────────────────────────────────────── */
function buildPaquetes(wb, paquetes) {
    const ws = wb.addWorksheet('Top Paquetes', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 6;
    ws.getColumn('C').width = 36;
    ws.getColumn('D').width = 20;
    ws.getColumn('E').width = 4;

    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:D1');
    const h = ws.getCell('B1');
    h.value = 'PAQUETES MÁS SOLICITADOS';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(5).height = 22;
    ['B5','C5','D5'].forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = ['#', 'Paquete', 'Veces Solicitado'][i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const dataStart = 6;
    paquetes.forEach((p, i) => {
        const rowNum = dataStart + i;
        ws.getRow(rowNum).height = 22;

        const nCell = ws.getCell(`B${rowNum}`);
        nCell.value = i + 1;
        nCell.font  = { name: 'Calibri', size: 10, bold: true, color: { argb: C.naranja } };
        nCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const pCell = ws.getCell(`C${rowNum}`);
        pCell.value = p.NombrePaquete;
        pCell.font  = { name: 'Calibri', size: 10, color: { argb: C.texto } };
        pCell.alignment = { vertical: 'middle' };

        const tCell = ws.getCell(`D${rowNum}`);
        tCell.value  = Number(p.total || 0);
        tCell.numFmt = intFmt;
        tCell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: C.texto } };
        tCell.alignment = { vertical: 'middle', horizontal: 'center' };

        applyZebra(ws.getRow(rowNum), i);
        [nCell, pCell, tCell].forEach(c => setBorder(c));
    });

    if (paquetes.length === 0) {
        ws.getCell('C6').value = 'Sin datos disponibles';
        ws.getCell('C6').font  = { color: { argb: C.grisTexto }, italic: true };
    }

    if (paquetes.length > 0) {
        addDataBar(ws, 'D', dataStart, dataStart + paquetes.length - 1);
    }
}

/* ────────────────────────────────────────────── */
/*  HOJA 6 — SERVICIOS MÁS SOLICITADOS            */
/* ────────────────────────────────────────────── */
function buildServicios(wb, servicios) {
    const ws = wb.addWorksheet('Top Servicios', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 6;
    ws.getColumn('C').width = 36;
    ws.getColumn('D').width = 20;
    ws.getColumn('E').width = 4;

    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D','E'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:D1');
    const h = ws.getCell('B1');
    h.value = 'SERVICIOS MÁS SOLICITADOS';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(5).height = 22;
    ['B5','C5','D5'].forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = ['#', 'Servicio', 'Veces Solicitado'][i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const dataStart = 6;
    servicios.forEach((s, i) => {
        const rowNum = dataStart + i;
        ws.getRow(rowNum).height = 22;

        const nCell = ws.getCell(`B${rowNum}`);
        nCell.value = i + 1;
        nCell.font  = { name: 'Calibri', size: 10, bold: true, color: { argb: C.naranja } };
        nCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const sCell = ws.getCell(`C${rowNum}`);
        sCell.value = s.NombreServicio;
        sCell.font  = { name: 'Calibri', size: 10, color: { argb: C.texto } };
        sCell.alignment = { vertical: 'middle' };

        const tCell = ws.getCell(`D${rowNum}`);
        tCell.value  = Number(s.total || 0);
        tCell.numFmt = intFmt;
        tCell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: C.texto } };
        tCell.alignment = { vertical: 'middle', horizontal: 'center' };

        applyZebra(ws.getRow(rowNum), i);
        [nCell, sCell, tCell].forEach(c => setBorder(c));
    });

    if (servicios.length === 0) {
        ws.getCell('C6').value = 'Sin datos disponibles';
        ws.getCell('C6').font  = { color: { argb: C.grisTexto }, italic: true };
    }

    if (servicios.length > 0) {
        addDataBar(ws, 'D', dataStart, dataStart + servicios.length - 1);
    }
}

/* ────────────────────────────────────────────── */
/*  HOJA 7 — RESERVAS RECIENTES                   */
/* ────────────────────────────────────────────── */
function buildRecientes(wb, recientes) {
    const ws = wb.addWorksheet('Reservas Recientes', { views: [{ showGridLines: false }] });
    ws.getColumn('A').width = 4;
    ws.getColumn('B').width = 12;
    ws.getColumn('C').width = 22;
    ws.getColumn('D').width = 16;
    ws.getColumn('E').width = 16;
    ws.getColumn('F').width = 20;
    ws.getColumn('G').width = 26;
    ws.getColumn('H').width = 4;

    for (let r = 1; r <= 3; r++) {
        ws.getRow(r).height = 16;
        ['A','B','C','D','E','F','G','H'].forEach(c => setFill(ws.getCell(`${c}${r}`), C.verde));
    }
    ws.mergeCells('B1:G1');
    const h = ws.getCell('B1');
    h.value = 'RESERVAS RECIENTES';
    h.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: C.blanco } };
    h.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(5).height = 22;
    ['B5','C5','D5','E5','F5','G5'].forEach((cell, i) => {
        const c = ws.getCell(cell);
        c.value = ['# Reserva', 'Documento Cliente', 'Fecha Inicio', 'Fecha Fin', 'Monto Total', 'Estado'][i];
        setHeaderStyle(c, C.naranja, C.blanco);
    });
    ws.views = [{ state: 'frozen', ySplit: 5 }];

    const dataStart = 6;
    recientes.forEach((r, i) => {
        const rowNum = dataStart + i;
        ws.getRow(rowNum).height = 22;

        const fmtDate = (val) => {
            if (!val) return '—';
            const d = new Date(val);
            return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
        };

        const cols = [
            { col: 'B', val: r.IdReserva,            fmt: intFmt,  bold: true,  color: C.naranja,  align: 'center' },
            { col: 'C', val: r.NroDocumentoCliente || '—', fmt: null,  bold: false, color: C.texto,    align: 'left'   },
            { col: 'D', val: fmtDate(r.FechaInicio),        fmt: null,  bold: false, color: C.texto,    align: 'center' },
            { col: 'E', val: fmtDate(r.FechaFinalizacion),  fmt: null,  bold: false, color: C.texto,    align: 'center' },
            { col: 'F', val: Number(r.Monto_Total || 0),    fmt: copFmt, bold: true,  color: C.positivo, align: 'right'  },
            { col: 'G', val: r.estado || '—',               fmt: null,  bold: false, color: C.grisTexto, align: 'center' },
        ];

        cols.forEach(({ col, val, fmt, bold, color, align }) => {
            const cell = ws.getCell(`${col}${rowNum}`);
            cell.value = val;
            if (fmt) cell.numFmt = fmt;
            cell.font  = { name: 'Calibri', size: 10, bold, color: { argb: color } };
            cell.alignment = { vertical: 'middle', horizontal: align };
            setBorder(cell);
        });

        applyZebra(ws.getRow(rowNum), i);
    });

    if (recientes.length === 0) {
        ws.getCell('B6').value = 'Sin reservas disponibles';
        ws.getCell('B6').font  = { color: { argb: C.grisTexto }, italic: true };
    }

    ws.autoFilter = { from: 'B5', to: 'G5' };
}

/* ────────────────────────────────────────────── */
/*  ENTRY POINT                                    */
/* ────────────────────────────────────────────── */
async function generarReporteExcel(res) {
    const data = await DashboardService.estadisticas();
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const fechaArchivo = new Date().toISOString().split('T')[0];

    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Hospedaje Digital';
    wb.created  = new Date();
    wb.modified = new Date();

    buildPortada(wb, fecha);
    buildResumen(wb, data);
    buildPorEstado(wb, data.reservasPorEstado || []);
    buildPorMes(wb, data.reservasPorMes || []);
    buildPaquetes(wb, data.topPaquetes || []);
    buildServicios(wb, data.topServicios || []);
    buildRecientes(wb, data.reservasRecientes || []);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Hospedaje_Digital_${fechaArchivo}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
}

module.exports = { generarReporteExcel };

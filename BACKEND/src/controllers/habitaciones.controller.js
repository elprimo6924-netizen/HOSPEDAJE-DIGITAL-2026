const db = require("../config/db");

/* ================= LISTAR TODAS ================= */

const mapHabitacion = (r) => ({
  ...r,
  ImagenHabitacion: Buffer.isBuffer(r.ImagenHabitacion)
    ? r.ImagenHabitacion.toString("utf8")
    : r.ImagenHabitacion,
});

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM habitacion");
    res.json(rows.map(mapHabitacion));
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo habitaciones", detalle: error.message });
  }
};

/* ================= DISPONIBLES (activas, Estado=1) ================= */

const disponibles = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM habitacion WHERE Estado = 1 ORDER BY NombreHabitacion ASC");
    res.json(rows.map(mapHabitacion));
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo habitaciones disponibles", detalle: error.message });
  }
};

/* ================= BUSCAR ================= */

const buscar = async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || "").toString().trim();

    if (!q) {
      return res.status(400).json({ error: "Parámetro de búsqueda 'q' requerido" });
    }

    const like = `%${q}%`;
    const [rows] = await db.query(
      "SELECT * FROM habitacion WHERE NombreHabitacion LIKE ? OR Descripcion LIKE ?",
      [like, like]
    );

    return res.json(rows.map(mapHabitacion));
  } catch (error) {
    return res.status(500).json({ error: "Error buscando habitaciones", detalle: error.message });
  }
};

/* ================= CREAR ================= */

const create = async (req, res) => {
  try {
    const { NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion } = req.body;

    if (!NombreHabitacion || !String(NombreHabitacion).trim()) {
      return res.status(400).json({ error: "El nombre de la habitación es obligatorio" });
    }
    if (!Descripcion || !String(Descripcion).trim()) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }
    const costoNum = Number(Costo);
    if (Costo === undefined || Costo === null || Costo === '' || isNaN(costoNum) || costoNum < 0 || !Number.isInteger(costoNum)) {
      return res.status(400).json({ error: "El costo debe ser un número entero no negativo." });
    }

    const nombre = String(NombreHabitacion).trim();
    const [dup] = await db.query(
      "SELECT IDHabitacion FROM habitacion WHERE LOWER(TRIM(NombreHabitacion)) = LOWER(TRIM(?)) LIMIT 1",
      [nombre]
    );
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe una habitación con el nombre "${nombre}". Usa un nombre diferente.` });
    }

    await db.query(
      `INSERT INTO habitacion (NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion) VALUES (?, ?, ?, ?, ?)`,
      [nombre, String(Descripcion).trim(), Number(Costo), Estado ?? 1, ImagenHabitacion || null]
    );

    res.status(201).json({ mensaje: "Habitación creada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error creando habitación", detalle: error.message });
  }
};

/* ================= ACTUALIZAR ================= */

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion } = req.body;

    if (!NombreHabitacion || !String(NombreHabitacion).trim()) {
      return res.status(400).json({ error: "El nombre de la habitación es obligatorio" });
    }
    if (!Descripcion || !String(Descripcion).trim()) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }
    const costoNum = Number(Costo);
    if (Costo === undefined || Costo === null || Costo === '' || isNaN(costoNum) || costoNum < 0 || !Number.isInteger(costoNum)) {
      return res.status(400).json({ error: "El costo debe ser un número entero no negativo." });
    }

    const nombre = String(NombreHabitacion).trim();
    const [dup] = await db.query(
      "SELECT IDHabitacion FROM habitacion WHERE LOWER(TRIM(NombreHabitacion)) = LOWER(TRIM(?)) AND IDHabitacion != ? LIMIT 1",
      [nombre, id]
    );
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe otra habitación con el nombre "${nombre}". Usa un nombre diferente.` });
    }

    if (Number(Estado) === 0) {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM reserva WHERE IDHabitacion = ? AND IdEstadoReserva IN (1,2,5,6)",
        [id]
      );
      if (total > 0) {
        return res.status(409).json({
          error: "No se puede desactivar esta habitación porque tiene reservas activas o pendientes."
        });
      }
    }

    await db.query(
      `UPDATE habitacion SET NombreHabitacion = ?, Descripcion = ?, Costo = ?, Estado = ?, ImagenHabitacion = ? WHERE IDHabitacion = ?`,
      [nombre, String(Descripcion).trim(), Number(Costo), Estado ?? 1, ImagenHabitacion ?? null, id]
    );

    res.json({ mensaje: "Habitación actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando habitación", detalle: error.message });
  }
};

/* ================= ELIMINAR ================= */

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ totalDirecto }]] = await db.query(
      "SELECT COUNT(*) AS totalDirecto FROM reserva WHERE IDHabitacion = ?",
      [id]
    );
    if (totalDirecto > 0) {
      return res.status(409).json({
        error: "No se puede eliminar esta habitación porque tiene reservas asociadas."
      });
    }

    const [[{ totalPaquete }]] = await db.query(
      `SELECT COUNT(*) AS totalPaquete
       FROM detallereservapaquetes drp
       JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       WHERE p.IDHabitacion = ?`,
      [id]
    );
    if (totalPaquete > 0) {
      return res.status(409).json({
        error: "No se puede eliminar esta habitación porque tiene reservas asociadas."
      });
    }

    await db.query("DELETE FROM habitacion WHERE IDHabitacion = ?", [id]);
    res.json({ mensaje: "Habitación eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando habitación", detalle: error.message });
  }
};

/* ================= TOGGLE ESTADO ================= */

const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { Estado } = req.body;

    if (Estado === undefined || Estado === null) {
      return res.status(400).json({ error: "Campo Estado es requerido" });
    }

    if (Number(Estado) === 0) {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM reserva WHERE IDHabitacion = ? AND IdEstadoReserva IN (1,2,5,6)",
        [id]
      );
      if (total > 0) {
        return res.status(409).json({
          error: "No se puede desactivar esta habitación porque tiene reservas activas o pendientes."
        });
      }
    }

    await db.query("UPDATE habitacion SET Estado = ? WHERE IDHabitacion = ?", [Estado, id]);
    res.json({ mensaje: "Estado de habitación actualizado", Estado });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando estado de habitación", detalle: error.message });
  }
};

module.exports = { getAll, disponibles, buscar, create, update, remove, toggleEstado };

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

    await db.query(
      `INSERT INTO habitacion (NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion) VALUES (?, ?, ?, ?, ?)`,
      [NombreHabitacion, Descripcion, Costo, Estado || 1, ImagenHabitacion || null]
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

    await db.query(
      `UPDATE habitacion SET NombreHabitacion = ?, Descripcion = ?, Costo = ?, Estado = ?, ImagenHabitacion = ? WHERE IDHabitacion = ?`,
      [NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion ?? null, id]
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

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM detallereservapaquetes drp
       JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       WHERE p.IDHabitacion = ?`,
      [id]
    );
    if (total > 0) {
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

    await db.query("UPDATE habitacion SET Estado = ? WHERE IDHabitacion = ?", [Estado, id]);
    res.json({ mensaje: "Estado de habitación actualizado", Estado });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando estado de habitación", detalle: error.message });
  }
};

module.exports = { getAll, disponibles, buscar, create, update, remove, toggleEstado };

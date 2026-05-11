require("dotenv").config();

const { execSync } = require("child_process");
const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

function liberarPuerto(port) {
  try {
    const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: "utf8" });
    const pids = [...new Set(
      out.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        .map(l => l.split(/\s+/))
        .filter(p => p.length >= 5 && p[1].endsWith(`:${port}`) && p[3] === "LISTENING")
        .map(p => Number(p[4]))
        .filter(n => Number.isInteger(n) && n > 0)
    )];
    if (pids.length > 0) {
      pids.forEach(pid => {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" }); } catch {}
      });
      console.log(`Puerto ${port} liberado (PID: ${pids.join(", ")})`);
    }
  } catch {}
}

liberarPuerto(PORT);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

USE hospedaje;

CREATE TABLE IF NOT EXISTS paquete_servicios (
    IDPaquete   INT NOT NULL,
    IDServicio  INT NOT NULL,
    PRIMARY KEY (IDPaquete, IDServicio),
    FOREIGN KEY (IDPaquete)  REFERENCES paquetes(IDPaquete)  ON DELETE CASCADE,
    FOREIGN KEY (IDServicio) REFERENCES servicio(IDServicio)
);

-- Migrate existing single-service relationships to the junction table
INSERT IGNORE INTO paquete_servicios (IDPaquete, IDServicio)
SELECT IDPaquete, IDServicio FROM paquetes WHERE IDServicio IS NOT NULL;

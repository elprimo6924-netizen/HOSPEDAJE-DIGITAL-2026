USE hospedaje;
ALTER TABLE detallereservaservicio
    ADD COLUMN IF NOT EXISTS HoraServicio VARCHAR(10) DEFAULT NULL;
